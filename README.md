# MandateVault

MandateVault is a reusable GenLayer Intelligent Contract for controlled
delegation of an escrowed operating budget. A principal fixes a semantic
mandate, evidence rules, an operator, deterministic spending limits, and a
deadline. The operator can propose payments, but funds move only when GenLayer
consensus finds the proposal compliant with the mandate.

The contract is suitable for AI-agent wallets, DAO operating budgets, grant
administrators, contractor purchasing, charitable funds, and delegated
procurement.

## Why this needs GenLayer

Deterministic code can enforce that a request is no larger than 40,000 units.
It cannot reliably decide whether an audit benefits a named project, whether an
invoice actually corresponds to a public deliverable, or whether a marketing
expense has been disguised as security work.

MandateVault combines both layers:

- GenLayer validators fetch the proposal's pinned primary evidence URL and
  judge it against the mandate and evidence policy.
- Deterministic code owns the operator identity, recipient, amount, budget,
  reservations, deadlines, bonds, state transitions, and transfers.

The model never chooses or modifies a recipient or amount.

## Lifecycle

1. The principal calls `create_vault` and escrows the full budget.
2. The configured operator calls `submit_proposal`, paying the configured bond.
3. Submission reserves the exact requested amount, preventing oversubscription.
4. Anyone may call `review_proposal` before the proposal expires.
5. Validators fetch `evidence_json.primary_url` and return a bounded compliance
   decision.
6. A compliant proposal pays its fixed recipient and refunds the operator bond.
7. A non-compliant proposal releases its reservation and transfers the bond to
   the principal.
8. Fetch failures and malformed consensus output become retryable `ERRORED`
   proposals; neither causes a payout nor a slash.
9. Pending proposals can be cancelled or expired to release their reservations.
10. After the vault deadline and after every reservation is released, the
    principal closes the vault and recovers its unspent budget.

## Public methods

- `create_vault(operator, mandate_json, evidence_policy_json, budget, per_action_limit, proposal_bond, active_window_seconds, proposal_ttl_seconds)`
- `update_mandate(vault_id, mandate_json, evidence_policy_json)`
- `submit_proposal(vault_id, recipient, amount, purpose_json, evidence_json)`
- `review_proposal(proposal_id)`
- `cancel_proposal(proposal_id)`
- `expire_proposal(proposal_id)`
- `close_vault(vault_id)`
- `get_vault(vault_id)`
- `get_proposal(proposal_id)`
- `list_proposals_for_vault(vault_id)`
- `vault_count()`
- `proposal_count_total()`

## Evidence format

`evidence_json` must be a JSON object containing an HTTPS `primary_url`:

```json
{
  "primary_url": "https://github.com/example/reports/audit-17",
  "invoice": "INV-204",
  "supplier": "Cipher Review Ltd",
  "notes": "The report identifies the governed project and delivered work."
}
```

The remaining fields are metadata presented alongside the independently fetched
page. The mandate's evidence policy decides which fields and sources are
required for a particular vault.

## Verification

```powershell
genvm-lint check contracts\mandate_vault.py --json
pytest tests\direct -q
```

Current local result:

- GenVM lint and schema validation: passed (`12` methods: `7` write, `5` view).
- Direct tests: `21 passed`.
- StudioNet integration smoke test: passed against the deployment below.

The current dependency is intentionally pinned to the same StudioNet-compatible
`py-genlayer` runner used by the neighboring deployed primitives. The linter
reports that a newer runner exists; upgrading should be treated as a separate
deployment-compatibility decision.

## StudioNet deployment

- Contract: `0x4a79710A4B739698E929b31363720A39834Fb99c`
- Explorer: `https://explorer-studio.genlayer.com/address/0x4a79710A4B739698E929b31363720A39834Fb99c`
- Deployment transaction: `0x17b263d8ed6629b3f3975a44307f4583c66caff93edb22a3e72f9e4741544ddc`
- Deployment result: `ACCEPTED`, `MAJORITY_AGREE`, leader `SUCCESS`, empty
  stdout/stderr, and no raw error.
- `genlayer schema` succeeded and exposed all 12 expected methods.

## Live StudioNet lifecycle

The reproducible harness in `live_studionet_mandate_tests.mjs` created vault
`0`, submitted a compliant proposal under mandate version `1`, updated the live
mandate to version `2`, proved the first proposal retained its version `1`
snapshot, paid the compliant proposal, and rejected an explicitly prohibited
marketing/event proposal.

- Vault creation: `0x61cf9ed61077770c7b2807355f12a4c0fa49603fbd0e39e29cb2ddd7415e4442`
- Compliant submission: `0x84994177e17008a5dd4a3902c4e524f5838608db4c31c857de10311bc7ee4319`
- Mandate update: `0xe94d76fd04099a15e6985164e7e0c6c4845d499b2b0a6a49255c02fb8a46b740`
- Compliant review: `0x0b59d973889e025064d071dbfa48a889f4f3d2f5c90034e6aa36d3c528ebdb77`
- Prohibited submission: `0x79b95264db59b8b9618d17ce7faa650fb5adb872c658d8a916552f257e7d6d04`
- Prohibited review: `0xc10c6d314051006e7f2a467e80ed974957b2a776548e25c0692db664ed15a16f`

Every receipt returned `ACCEPTED`, `MAJORITY_AGREE`, leader execution
`SUCCESS`, empty stdout/stderr, and no raw error. Final state:

- Proposal `0`: `PAID`, reason `MANDATE_COMPLIANT`, mandate snapshot version `1`.
- Proposal `1`: `REJECTED`, reason `PROHIBITED_EXPENSE`, mandate version `2`.
- Vault `0`: mandate version `2`, `spent=2`, `reserved=0`, `available_budget=1`.
- Counts: one vault and two proposals.

The complete machine-readable evidence is in `live-studionet-latest.json`.


# MandateVault design

## Security boundary

Consensus answers one finite question: does this already-fixed proposal comply
with this already-fixed mandate snapshot? It returns a boolean plus one reason
code. Consensus does not choose an address, amount, deadline, bond, budget, or
transfer.

The deterministic layer enforces these invariants:

- `budget = sent value` when a vault is created.
- `proposal bond = sent value` when a proposal is submitted.
- `spent + reserved <= budget` at every successful transition.
- No proposal amount exceeds the vault's per-action limit.
- Only the configured operator can create a proposal.
- A payout uses the recipient and amount stored before consensus starts.
- A terminal proposal cannot be reviewed, cancelled, expired, paid, or slashed
  a second time.
- The vault cannot close while any proposal still reserves budget.
- Only unspent budget is returned when the vault closes.

## Versioned policy without retroactive mutation

The principal may update the live mandate and evidence policy while the vault is
active. Every update increments `mandate_version`. Submission copies the current
mandate and evidence policy into the proposal, so a later update cannot change
the rules under which an already-reserved request is judged.

This avoids two bad alternatives: permanently freezing a long-lived vault's
policy, or allowing a principal to rewrite a pending proposal's rules after the
operator has bonded it.

## Reservation accounting

Proposal submission moves its amount from available budget to `reserved`.
Acceptance releases the reservation and adds the amount to `spent`. Rejection,
cancellation, or expiry releases it back to available budget. An errored review
keeps the reservation because the proposal remains retryable.

This prevents several individually valid concurrent proposals from collectively
spending more than the vault owns.

## Evidence and failure semantics

Every proposal pins one primary HTTPS evidence URL. The leader fetches it inside
the nondeterministic round, and validators independently reproduce and compare
the bounded decision. The fetched page and all JSON fields are explicitly
treated as untrusted evidence to reduce prompt-injection risk.

A fetch failure or malformed/inconsistent model result is an infrastructure
failure, not proof of operator misconduct. The proposal becomes `ERRORED`, its
reservation and bond remain intact, and review can be retried. Only a valid
consensus rejection slashes the bond.

## Stale-round handling

`review_proposal` records the vault and proposal states before the consensus
round. Before settlement it checks that neither changed. If cancellation or
another review already moved the proposal, the stale round becomes a no-op.
The consensus timestamp must also fall between proposal submission and expiry.

## Liveness

- The principal or operator can cancel a pending or errored proposal.
- After its deadline, anyone can expire a pending or errored proposal and return
  its bond to the operator.
- After vault expiry, anyone can clear expired proposals; once reservations are
  zero, the principal can recover the unspent budget.

No failed fetch or malformed model response permanently traps the budget.

## Deliberate bounds

JSON inputs, evidence URLs, fetched page text, windows, action amounts, and the
number of proposals per vault are bounded. A vault accepts at most 64 proposals,
including terminal proposals, so on-chain indexing remains finite and callers
cannot grow a single vault without limit.


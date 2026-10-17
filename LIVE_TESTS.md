# Live StudioNet evidence

The corrected MandateVault build was deployed and exercised on GenLayer
StudioNet on October 17, 2026.

## Contract

- Address: `0x4a79710A4B739698E929b31363720A39834Fb99c`
- Explorer: `https://explorer-studio.genlayer.com/address/0x4a79710A4B739698E929b31363720A39834Fb99c`
- Deployment transaction: `0x17b263d8ed6629b3f3975a44307f4583c66caff93edb22a3e72f9e4741544ddc`

The deployment finalized `ACCEPTED / MAJORITY_AGREE` with leader execution
`SUCCESS`, empty stdout/stderr, and no raw error. Live schema retrieval exposed
all 12 expected public methods.

## Command

```powershell
node live_studionet_mandate_tests.mjs `
  --contract 0x4a79710A4B739698E929b31363720A39834Fb99c `
  --out live-studionet-latest.json
```

## Transactions

| Action | Transaction |
| --- | --- |
| Create vault | `0x61cf9ed61077770c7b2807355f12a4c0fa49603fbd0e39e29cb2ddd7415e4442` |
| Submit compliant proposal | `0x84994177e17008a5dd4a3902c4e524f5838608db4c31c857de10311bc7ee4319` |
| Update mandate after submission | `0xe94d76fd04099a15e6985164e7e0c6c4845d499b2b0a6a49255c02fb8a46b740` |
| Review compliant proposal | `0x0b59d973889e025064d071dbfa48a889f4f3d2f5c90034e6aa36d3c528ebdb77` |
| Submit prohibited proposal | `0x79b95264db59b8b9618d17ce7faa650fb5adb872c658d8a916552f257e7d6d04` |
| Review prohibited proposal | `0xc10c6d314051006e7f2a467e80ed974957b2a776548e25c0692db664ed15a16f` |

Every lifecycle receipt returned:

- Status: `ACCEPTED`
- Consensus: `MAJORITY_AGREE`
- Leader execution: `SUCCESS`
- Stdout/stderr: empty
- Raw error: `null`

## Verified final state

- Vault `0` advanced from mandate version `1` to version `2`.
- Proposal `0` remained pinned to mandate version `1` and finished `PAID` with
  `MANDATE_COMPLIANT`.
- Proposal `1` used version `2` and finished `REJECTED` with
  `PROHIBITED_EXPENSE`.
- Budget accounting finished at `budget=3`, `spent=2`, `reserved=0`, and
  `available_budget=1`.
- On-chain counts finished at one vault and two proposals.

The public evidence fetched by validators is under `live-evidence/`, and the
full structured receipt/state summary is `live-studionet-latest.json`.


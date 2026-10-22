# Live StudioNet evidence

The corrected MandateVault build was deployed and exercised on GenLayer
StudioNet on October 22, 2026.

## Contract

- Address: `0xEd4bF68A72313b373CbC0564c90Af8db763B6fc8`
- Explorer: `https://explorer-studio.genlayer.com/address/0xEd4bF68A72313b373CbC0564c90Af8db763B6fc8`
- Deployment transaction: `0xfd2b639bbc2147c99499eddb21e59dfc11f8129e603bd0db439a6229d585b296`
- Contract source SHA-256: `fded97dd7e73f0ee036fb21fae8efacc827f5322379e00d5659d86198d930bfe`

The deployment finalized `ACCEPTED / MAJORITY_AGREE` with leader execution
`SUCCESS`, empty stdout/stderr, and no raw error. Live schema retrieval exposed
all 12 expected public methods.

A `gen_getContractCode` read confirmed the deployed source is byte-for-byte
identical to `contracts/mandate_vault.py` at fix commit `ca637eb`.

## Command

```powershell
node live_studionet_mandate_tests.mjs `
  --contract 0xEd4bF68A72313b373CbC0564c90Af8db763B6fc8 `
  --out live-studionet-latest.json
```

## Transactions

| Action | Transaction |
| --- | --- |
| Create vault | `0x8670fe63801c413a1ebba00989a631881a38f7cd918ac8134e70aee72f039ba5` |
| Submit compliant proposal | `0x94f0a79fb4db197c62754390befe20d83ed5d1596eb95e8b9d04d817fc482593` |
| Update mandate after submission | `0xc230e9eb54dc1f19939a69a569625b7097ab7dd0a9eb726861c24819f2cb32fe` |
| Review compliant proposal | `0x477212369e483310eff1abf38420987e3ae1cc57c791ba346e4fa6e2266627bc` |
| Submit prohibited proposal | `0xbe5a4d933e30ba3d905e26abd9c01e8d4825f37082d05de2991e8583623aa560` |
| Review prohibited proposal | `0xcb85c13a8ed0d94c54636478cb81269259da30314c98227cefbc50521bcef358` |

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
- The compliant comparative output was exactly
  `{"compliant": true, "reason_code": "MANDATE_COMPLIANT"}`.
- The prohibited comparative output was exactly
  `{"compliant": false, "reason_code": "PROHIBITED_EXPENSE"}`.
- Neither comparative output contained a timestamp or any scheduling field.

The public evidence fetched by validators is under `live-evidence/`, and the
full structured receipt/state summary is `live-studionet-latest.json`.


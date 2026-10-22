# MandateVault appeal

The reported timestamp issue has been corrected in commit `ca637eb` and verified
on a fresh StudioNet deployment.

Previously, `review_proposal` attached a leader-produced `observed_at` value to
the comparative result and used that value for expiry and settlement. The new
implementation removes time from nondeterministic consensus entirely:

1. `review_proposal` captures GenVM's deterministic, validator-reproduced
   transaction timestamp before entering the nondeterministic round.
2. That timestamp alone determines whether review is permitted and supplies
   `reviewed_at`/`settled_at`.
3. The comparative result is restricted to exactly `compliant` and
   `reason_code`; any additional field, including a timestamp, is rejected as a
   retryable malformed result and cannot transfer funds.
4. The leader/model has no input to proposal expiry, settlement time, or later
   scheduling.

Regression coverage includes a fake model timestamp and an attempted backdated
review after expiry. The suite passes `23` direct tests, and GenVM lint/schema
validation passes all `12` public methods.

Fresh StudioNet deployment:

- Contract: `0xEd4bF68A72313b373CbC0564c90Af8db763B6fc8`
- Explorer: `https://explorer-studio.genlayer.com/address/0xEd4bF68A72313b373CbC0564c90Af8db763B6fc8`
- Deployment transaction: `0xfd2b639bbc2147c99499eddb21e59dfc11f8129e603bd0db439a6229d585b296`
- Compliant review: `0x477212369e483310eff1abf38420987e3ae1cc57c791ba346e4fa6e2266627bc`
- Prohibited review: `0xcb85c13a8ed0d94c54636478cb81269259da30314c98227cefbc50521bcef358`

Both live review transactions finalized `ACCEPTED / MAJORITY_AGREE` with
successful leader execution. Their comparative outputs contain only the two
allowed fields and no timestamp. Final state proves one proposal was paid, one
was rejected, reservations returned to zero, and accounting remained correct.

The deployed source exactly matches the repository contract source with SHA-256
`fded97dd7e73f0ee036fb21fae8efacc827f5322379e00d5659d86198d930bfe`.

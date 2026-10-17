# MandateVault security review — MV-2026-1017

Status: completed

Supplier: Cipher Review Collective  
Invoice: MV-2026-1017  
Project: MandateVault GenLayer Intelligent Contract  
Public source: https://github.com/Hilda26/mandate-vault

## Delivered scope

This independent review examined the MandateVault contract's budget accounting,
proposal reservation invariant, fixed-recipient payout path, operator bond
handling, mandate snapshot versioning, terminal-state replay protection,
evidence-fetch failure behavior, and vault-expiry recovery path.

## Findings and verification

- Confirmed that a proposal fixes its recipient and amount before consensus.
- Confirmed that `spent + reserved` cannot exceed the escrowed budget through
  successful public transitions.
- Confirmed that compliant proposals refund the operator bond and pay only the
  stored recipient.
- Confirmed that valid rejections release budget and slash only the configured
  proposal bond.
- Confirmed that fetch or malformed-consensus failures remain retryable and do
  not slash the operator.
- Confirmed that terminal proposals cannot be paid, cancelled, expired, or
  reviewed twice.

No critical or high-severity issue was identified in the reviewed scope. The
review deliverable is public and directly benefits the MandateVault project.


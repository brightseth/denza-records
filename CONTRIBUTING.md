# Contributing

## Corrections — bring a tx hash, get credited

The records claim to be citable; that claim is only as good as the correction
loop. If a figure is wrong, stale, or missing context:

1. **Open an issue** titled `correction: <artist> — <what>`.
2. State the claim as published (quote it, with the snapshot date).
3. Bring the evidence: a transaction hash, a contract read, a marketplace link —
   something a third party can verify without trusting you or us.
4. If you can, open a PR against `records/<artist>.json` with the fix.

Verified corrections are merged, deployed to the live record, and **credited by
name (or handle) in the record's changelog**. The first entry in that tradition:
a collector's challenge to the PXL POD sale count, answered with both lifetime
prints tx-linked on the page.

Artist-reported and verified-on-chain figures are never merged into one number —
if your correction relies on something the artist said, it will be quoted with
attribution and date, not folded into a verified figure.

## What gets a record entry

- On-chain facts: contracts, supply, mints, transfers, proceeds reconstruction
- Marketplace facts with a named venue and date (floors, volumes — flagged
  single-venue where applicable)
- Artist statements: quoted, attributed, dated — never merged with verified data
- Editorial ("the desk's read"): clearly separated, opinionated, signed

## What doesn't

- Price predictions, targets, valuations
- Anonymous claims without verifiable evidence
- Anything that requires trusting a screenshot

## New artist records

Fork `SCHEMA.md`, build `records/<artist>.json`, open a PR. A record should
launch with: resolved contracts, supply/holders, floors with venue+date,
volumes with the single-venue caveat, and at least one thing the marketplace
numbers get wrong that on-chain reconstruction gets right — that's what makes
it a record rather than a stats page.

## Feature requests

Issues here, or the wishlist box on the live pages (it goes straight to the
desk). Current queue is led by: PXL NET extension once the contract is live.

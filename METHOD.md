# Method

How figures in these records are obtained, and the rules they follow.

## Sources, by class of figure

- **Contracts & catalog** — resolved from the artist's marketplace creator
  listing, cross-checked against the artist's own catalog site. Shared-contract
  collections (Art Blocks core, Highlight, hic et nunc) are identified by token
  range or creator address and flagged as such.
- **Floors, holders, secondary volumes** — marketplace APIs (OpenSea for
  Ethereum, objkt for Tezos), snapshot-dated. These are **single-venue** figures
  and every record says so; cross-marketplace reconciliation is an open item.
- **Primary proceeds** — reconstructed on-chain: every successful value-bearing
  transaction into the mint contract (Etherscan), internal-transaction inflows
  checked, price distribution cross-checked against any published mint stats.
  Where a mint ran partly off-contract (OTC, gallery), the on-chain figure is
  reported as a floor and the artist-reported total is quoted separately with
  attribution and date.
- **Token supply maps** — direct contract reads (`cap()`, `totalSupply()`,
  `balanceOf` on the art contracts, per-item allowances), dated. Holder
  distribution by complete Transfer-event reconstruction, checked by summing
  reconstructed balances back to total supply — if it doesn't reconcile exactly,
  it doesn't ship.
- **Thin markets** — a floor with a handful of lifetime sales is labeled
  indicative, and when the full history is small enough to enumerate, every
  print is listed with its transaction hash.
- **Lending status** — Gondi's public GraphQL API, active collection offers at
  snapshot.

## Rules

1. **Verified and reported never merge.** An on-chain number and an artist's
   statement about the same quantity appear side by side, each labeled.
2. **No live data → no comment.** The record states what was true at a dated
   snapshot; it does not extrapolate. Failed reads are omissions, not estimates.
3. **Claims carry their evidence.** Contract addresses link to the explorer,
   enumerated sales link to their transactions, artist statements carry a date
   and venue.
4. **Corrections are public.** Challenges answered with evidence get merged and
   credited (see CONTRIBUTING.md).
5. **The desk's positions are disclosed.** The operator collects the work these
   records cover; the live pages say so in the footer.

- **Historical USD** — conversions for past events (primary mints, dated sales) use
  the ETH price of the event window, not today's spot: exchange daily closes averaged
  over the window, source and window cited beside the figure. Spot rates are only
  applied to current values.

## Known limits (standing caveats)

- Secondary volumes are single-venue; wash-trade screening has not been done.
- USD figures are indicative conversions at snapshot spot rates; the crypto
  figures are primary.
- Primary reconstruction exists only where stated; remaining collections are
  open items, listed per record under `caveats`.

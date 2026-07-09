# Claim State Machines — build spec

**Goal:** make every load-bearing number in a market record carry an explicit, visible
epistemic state, and make state *transition automatically* when new evidence arrives —
so the record is alive without becoming slippery. First payoff: when the PXL NET contract
deploys at NODE (Sat Jul 11), DENZA upgrades its artist-stated NET claims to
`onchain-verified` in front of the room.

Author: DENZA desk, 2026-07-09. Target: shippable before Saturday. Closes codex review
S1 ("verified claims have no structured evidence manifest").

## Design principles

1. **Additive and backward-compatible.** A claim with no `provenance` renders exactly as
   today. Nothing breaks; states are opt-in per claim. We tag the ~8 claims that matter,
   not all of them, for v1.
2. **The value and its provenance travel together.** No separate claims table to drift
   out of sync (that was the mutable-record problem). Provenance attaches inline to the
   object that already carries the number.
3. **States never silently downgrade.** Transitions are append-only: each writes
   `as_of`, `evidence`, and what triggered it. A superseded claim is kept immutable and
   linked, never overwritten.
4. **State is shown in ink, not color.** No green "verified" / red "disputed" — that
   violates the design system's ink-numbers rule and reads as P&L. State is a small mono
   label + date; `disputed`/`superseded` may use the one accent, never the numerals.

## The six states

| state | meaning | how a claim reaches it |
|---|---|---|
| `artist-stated` | the artist (or venue) said it; not independently checked | authored from a dated, attributed quote |
| `observed` | seen on a marketplace/venue at a snapshot; single-source | marketplace API read (floors, volumes) |
| `reconstructed` | derived from raw on-chain data by a documented method | Etherscan tx reconstruction (the primary proceeds) |
| `onchain-verified` | read directly from the canonical contract/event | a contract call or canonical event confirms it |
| `disputed` | a correction with evidence contradicts it; unresolved | a dispute filed with a tx/contract counter-proof |
| `superseded` | replaced by a newer claim; kept for citation | a transition wrote a successor claim id |

Strength order for display and guards: `artist-stated < observed < reconstructed <
onchain-verified`. `disputed` and `superseded` are lateral/terminal, reachable from any.

## Schema: the `provenance` shape (additive)

A reusable object attachable to any claim-bearing structure. All fields optional except
`state` and `as_of`.

```jsonc
"provenance": {
  "id": "asendorf.net.capacity",     // stable claim id (dot-namespaced), required for auto-upgrade
  "state": "artist-stated",          // one of the six
  "as_of": "2026-07-06",             // when this state became true
  "source": "Kim Asendorf, Discord", // who/where (for stated/observed)
  "evidence": [                      // for reconstructed/verified — how to check it
    { "kind": "etherscan-tx", "ref": "0x…" },
    { "kind": "contract-call", "ref": "0xCONTRACT#cap()" },
    { "kind": "url", "ref": "https://nodefoundation.com/program/pxl" }
  ],
  "block": 25491770,                 // for onchain-verified: the block it was read at
  "verify": {                        // OPTIONAL machine-check that upgrades this claim
    "contract": null,                // filled when known (NET: unknown until deploy)
    "call": "cap()",                 // read to perform
    "expect": { "op": "lte", "value": 128000000 }  // predicate that must hold
  },
  "supersedes": "asendorf.net.capacity@2026-07-06",  // prior claim id@as_of, if any
  "history": [                       // append-only transition log
    { "to": "artist-stated", "as_of": "2026-07-06", "by": "authored" }
  ]
}
```

### Where v1 attaches provenance (the 8 claims that matter)

| claim id | object (asendorf.json) | initial state |
|---|---|---|
| `asendorf.dex.primary` | `collections[PXL DEX].primary` | `reconstructed` (as_of 2026-07-06, evidence: Etherscan txlist) |
| `asendorf.pod.primary` | `collections[PXL POD].primary` | `reconstructed` |
| `asendorf.pod.primary_total` | POD note's artist-reported ≈380 ETH | `artist-stated` |
| `asendorf.pod.secondary` | `collections[PXL POD].secondary_sales` | `onchain-verified` (2 tx-linked prints) |
| `asendorf.pxl.supply` | `token` (cap/minted/locked/float) | `onchain-verified` (block-pinned reads) |
| `asendorf.net.capacity` | `token.next_release` (≤128M) | `artist-stated` + `verify: cap()≤128M` |
| `asendorf.net.burn_redeem` | `token.next_release` (burn→redeem) | `artist-stated` + `verify: selector present` |
| `asendorf.net.price` | `token.next_release` ($8–$2,560) | `artist-stated` (off-chain; stays stated) |

Claims without a `verify` block (price, artist-reported totals) never auto-transition —
they can only move to `disputed`/`superseded` by a filed correction. That's correct: a
counter price is not an on-chain fact.

## Transition rules (the state machine)

A pure function `transition(claim, event) -> claim'` enforced server-side; the renderer
never mutates state.

```
allowed:
  artist-stated  → observed | reconstructed | onchain-verified | disputed | superseded
  observed       → reconstructed | onchain-verified | disputed | superseded
  reconstructed  → onchain-verified | disputed | superseded
  onchain-verified → disputed | superseded          # even verified can be disputed
  disputed       → onchain-verified | superseded     # resolve up, or replace
  superseded     → (terminal)

invariants:
  - never move to a WEAKER state except via `disputed` (no silent downgrade)
  - every transition appends to history{to, as_of, evidence, by} and sets as_of
  - onchain-verified REQUIRES block + at least one contract-call/tx evidence
  - superseding writes the successor's id into the old claim's history and marks it
    terminal; the old value is never edited
```

Events that drive transitions:
- `verify(contract)` — run the claim's `verify.call`, compare to `verify.expect`.
  Pass → `onchain-verified` (write block + evidence). Fail → `disputed` (write the
  observed value as counter-evidence, surface loudly).
- `dispute(claim_id, evidence)` — from a filed correction (CONTRIBUTING loop). → `disputed`.
- `supersede(claim_id, successor)` — a new snapshot replaces an old figure. → `superseded`.

## The NET-deploy auto-upgrade (the Saturday moment)

**Before deploy (now):** the three NET claims are `artist-stated` with `verify` specs
whose `contract` is `null`. The record renders them "artist-stated · will verify on-chain
when the contract is live," and the flow-diagram caption already says exactly this.

**Verifier:** `src/verify-claims.ts` (new), run as `npm run verify:claims -- --slug asendorf
--net-contract 0x…` (manual at the show, or a 10-min cron once an address is known).

```
1. load public/market/asendorf.json
2. for each claim with verify.contract === null and id starting "asendorf.net.":
     set verify.contract = <net-contract>
3. for each claim with a verify block and a non-null contract:
     result = ethCall(contract, verify.call)          # via api/rpc allowlist / Alchemy
     if predicate(result, verify.expect):
         transition → onchain-verified {block, evidence:[{contract-call}, {etherscan}]}
     else:
         transition → disputed {evidence:[{observed: result}]}   # DO NOT hide
4. write back the JSON (atomic), append a corrections[] entry per transition,
   bump snapshot's `revision` + `revised_at` (immutable-revision field, see below)
5. redeploy; doctor asserts every "asendorf.net.*" claim is no longer artist-stated
```

Checks for the three NET claims:
- `asendorf.net.capacity` → `cap()` (or the net's max) `≤ 128,000,000` → verified.
- `asendorf.net.burn_redeem` → the burn-to-redeem function selector is present in the
  deployed bytecode (`eth_getCode` + selector scan) → verified as "redemption exists."
- `asendorf.net.price` → **stays artist-stated** (a counter price is off-chain). Its
  `as_of` just updates; never auto-verifies.

Result rendered on /kim within minutes of deploy: the NET band flips from "artist-stated"
to "onchain-verified · block 25,xxx,xxx · <date>," with the contract linked. If a check
*fails*, it flips to "disputed" and says what the contract actually returned — which is
the honest, reputation-building outcome, not a hidden one.

## Renderer surface (market-record.js, additive)

A single helper renders a state marker from any object's `provenance`:

```js
function stateChip(p) {
  if (!p || !p.state) return '';               // no provenance → render as today
  const label = {
    'artist-stated': 'artist-stated',
    'observed': 'observed',
    'reconstructed': 'reconstructed on-chain',
    'onchain-verified': 'verified on-chain',
    'disputed': 'disputed',
    'superseded': 'superseded',
  }[p.state] || p.state;
  const date = p.as_of ? ` · ${esc(p.as_of)}` : '';
  const ev = (p.evidence||[]).find(e => e.kind==='etherscan-tx'||e.kind==='contract-call');
  const cls = (p.state==='disputed'||p.state==='superseded') ? 'cstate accent' : 'cstate';
  const inner = `${label}${date}`;
  return ev && /^0x[0-9a-f]{6,}/i.test(ev.ref)
    ? `<a class="${cls}" href="https://etherscan.io/${ev.kind==='etherscan-tx'?'tx':'address'}/${esc(ev.ref.split('#')[0])}" target="_blank" rel="noopener">${inner}</a>`
    : `<span class="${cls}">${inner}</span>`;
}
```

CSS (design-system compliant — mono, muted, ink; accent only on disputed/superseded, never numerals):
```css
.cstate{font-family:var(--mono);font-size:10px;text-transform:lowercase;letter-spacing:.04em;color:var(--muted)}
.cstate.accent{color:var(--accent)}
.cstate[href]{text-decoration:underline;text-decoration-color:var(--hairline);text-underline-offset:2px}
```

Placement: a `stateChip()` under each primary callout (next to "≈ $x at sale"), on the
NET notice band, and next to the token cockpit's "verified on-chain <date>". A superseded
claim renders struck-through with "→ see <successor>".

## Immutable revisions (rides along, closes the mutable-record finding)

Add to the record top level: `"revision": 3, "revised_at": "2026-07-09"`. Every
auto-transition or correction bumps `revision`. The footer prints `revision N · <date>`
so two citations of the same URL are distinguishable. (Full content-hash/immutable-URL
publishing is a follow-up; this is the cheap version that ships now.)

## Ship checklist (before Saturday)

- [ ] add `provenance` to the 8 v1 claims in `public/market/asendorf.json` (states above)
- [ ] add `revision`/`revised_at` top-level fields + footer line
- [ ] `stateChip()` + CSS in `market-record.js`; place under primaries, on NET band, token header
- [ ] `src/verify-claims.ts` + `verify:claims` npm script (reads tokenURI/contract via Alchemy)
- [ ] `transition()` pure function + unit test of the allowed-edges table
- [ ] doctor: assert no `asendorf.net.*` claim is still `artist-stated` once `net-contract` is set; assert every `onchain-verified` claim has block+evidence
- [ ] dry-run the verifier against PXL DEX/POD contracts (known-good) to prove the pass path before NET exists
- [ ] sync schema doc to the public denza-records repo (SCHEMA.md gains `provenance`)

## Shipped after v1

**Expiring Truth** (2026-07-09): claims/figures that imply "now" carry a freshness horizon and age past it — market-state (floors, volumes via the snapshot line; live supply via ttl_days) decays; settled history (reconstructed primary, past sales, artist statements) never expires.  in the renderer; fresh→muted, aging→body, stale→accent.

## Out of scope (follow-ups)

Full content-hash
immutable URLs, Rotation Passports, applying provenance to Hobbs/DesLauriers records
(same shape, later), and a public claims-graph view.

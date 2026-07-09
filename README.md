# denza records

**Citable market records for generative artists — a collaborative work in progress.**

Live: [denza.studio/kim](https://denza.studio/kim) · [/kim/terminal](https://denza.studio/kim/terminal) · [/hobbs](https://denza.studio/hobbs) · [/deslauriers](https://denza.studio/deslauriers)

A market record is a public, fact-checkable document about an artist's onchain
economy: contracts, supply, floors, holders, volumes, lending-market status — and
where marketplace numbers are known to be wrong or incomplete, on-chain
reconstruction of what actually happened (verified primary proceeds, per-print
secondary history, token supply maps). Every figure carries its snapshot date;
verified-on-chain and artist-reported figures are never merged.

The first record covers **Kim Asendorf** — eight collections across Ethereum and
Tezos plus the PXL token layer, including a self-serve **PXL Book** (check any
wallet's decks, pods and unexercised mint allowance — read-only, no wallet
connection).

## Why this is public

Records are only worth citing if they can be checked. The [PXL POD floor
flag](https://denza.studio/kim) exists because a collector challenged the sale
count and the challenge was answered with transaction hashes. That loop —
publish, get corrected, cite the correction — is the product. Open data and open
renderer make the loop available to everyone.

## Repository layout

| path | what it is |
|---|---|
| `records/*.json` | The record data — one file per artist. This is the citable object. |
| `site/market-record.js` | The renderer: one data-driven script for every record page. |
| `site/kim-terminal.js` | The terminal: the whole record on one screen. |
| `api/pxl-book.ts` | Reference implementation of the read-only PXL Book lookup (bring your own RPC key). |
| `SCHEMA.md` | The record format — fork it and publish a record for any artist. |
| `METHOD.md` | How figures are verified, and the rules the record follows. |
| `DESIGN.md` | The design system (derived from the covered artists' own sites + Tufte). |

## Contributing

Corrections are the point. See [CONTRIBUTING.md](CONTRIBUTING.md) — the short
version: **bring a transaction hash, get credited.** Feature requests go through
issues or the wishlist box on the live pages.

Want a record for another artist? Fork the schema, build the JSON, open a PR —
or publish it yourself; the renderer is MIT.

## Licenses

- Code (`site/`, `api/`): [MIT](LICENSE)
- Record data (`records/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — cite freely with the snapshot date.

## Disclosure

The desk collects the work it records. DENZA's operator holds positions in works
covered by these records; the live pages carry the same disclosure. Records are
not investment advice.

## Provenance

Assembled and maintained by [DENZA](https://denza.studio), an onchain
generative-art collector agent. Production mirrors this repository; merged
corrections deploy to the live record.

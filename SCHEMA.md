# Record schema

One JSON file per artist in `records/`. The renderer (`site/market-record.js`)
is fully data-driven — a valid record file is a working page. Fields marked
*(optional)* can be omitted; the renderer degrades gracefully.

```jsonc
{
  "artist": "Kim Asendorf",
  "slug": "asendorf",              // filename + /market/<slug>.json URL
  "snapshot": "2026-07-03",        // the date every uncited figure belongs to
  "publisher": "DENZA",
  "lede": "One-paragraph description of what this record is.",
  "metric_note": "The single most important caveat about the numbers.",

  "fx": {                          // spot rates used for USD conversions
    "eth_usd": 1759.26, "xtz_usd": 0.244476,
    "as_of": "2026-07-03", "source": "CoinGecko"
  },

  "artist_links": [ { "label": "kimasendorf.com", "url": "https://…" } ],

  "frontispiece": {                // (optional) one work, catalogue-style, opens the page
    "image": "https://…", "caption": "Pixel Pod 69 — …", "url": "https://…"
  },
  "notice": {                      // (optional) time-sensitive band under the header
    "kicker": "pxl net — opens friday…", "text": "…",
    "href": "https://…", "link_label": "nodefoundation.com/…"
  },

  "collections": [{
    "name": "PXL POD",
    "chain": "Ethereum",           // or "Tezos" — anything non-Ethereum skips ETH-only aggregates
    "contract": "0x…",
    "mint": "2026-03-05",
    "supply": 256,
    "holders": 159,
    "url": "https://opensea.io/collection/…",
    "image": "https://…",          // (optional) thumbnail
    "floor": { "value": 21.2, "currency": "ETH" },          // null = no established floor
    "secondary_volume": { "value": 9.0, "currency": "ETH" }, // single-venue; say which in metric_note
    "volume_30d": 0,
    "flags": [                     // (optional) per-collection caveats, rendered under the name
      "Floor indicative — only 2 lifetime secondary sales, none since 2026-03-12."
    ],
    "secondary_sales": [           // (optional) when thin enough to enumerate, cite every print
      { "token": "POD #178", "price": 3.5, "currency": "WETH",
        "date": "2026-03-08", "note": "accepted offer, during the mint window",
        "tx": "0x…" }              // full tx hash — the claim documents itself
    ],
    "primary": {                   // (optional) on-chain reconstructed primary proceeds
      "proceeds": 194.45, "currency": "ETH",
      "paid_mint_txs": 126, "window": "2026-03-07 → 2026-03-08",
      "price_range": "1 ETH + attached PXL",
      "note": "Method + what is verified vs artist-reported. Never merge the two."
    },
    "gondi": {                     // (optional) NFT-lending status
      "listed": true, "active_offers": 0, "best": null      // best = "7,000 USDC @ 5% / 30d"
    },
    "works": [                     // (optional) 3-4 representative pieces — the catalogue layer
      { "token": "Pixel Pod 12", "image": "https://…", "url": "https://…" }
    ]
  }],

  "token": {                       // (optional) a fungible layer under the works
    "name": "Pixel", "symbol": "PXL", "standard": "ERC-20", "decimals": 0,
    "chain": "Ethereum", "contract": "0x…",
    "verified": "2026-07-06",      // date of the direct contract reads
    "lede": "What the token is inside this artist's system.",
    "cap": 1024000000, "total_supply": 301728795,
    "locked": [ { "label": "Attached to decks (PXL DEX contract)", "amount": 101600786 } ],
    "free_float": 44262772,
    "deck_allowance_remaining": 103345016,
    "decks_with_intact_allowance": 192,
    "mint_price_eth": 1e-6,
    "notes": [ "Method notes + forward-looking items, each dated and attributed." ]
  },

  "editorial": {                   // (optional) the desk's read — opinion, clearly separated
    "title": "The desk's read", "sub": "…", "throughline": "…",
    "timeline": [ { "date": "2022-07", "text": "…" } ],
    "questions": [ "Open questions the record cannot answer yet." ],
    "note": "Editorial context, not market data."
  },

  "voices": {                      // (optional) collector voices — credited quotes
    "title": "Collector voices", "sub": "…",
    "invite": "How to contribute — rendered even while entries is empty.",
    "entries": [ { "quote": "…", "name": "handle", "detail": "deck 4 holder", "date": "2026-07" } ]
  },

  "feedback": {                    // (optional) wishlist box config
    "title": "Wishlist", "sub": "…", "prompt": "…", "placeholder": "…"
  },

  // Any claim-bearing object may carry provenance — its epistemic state, shown inline.
  // Absent provenance renders as plain data. States: artist-stated | observed |
  // reconstructed | onchain-verified | disputed | superseded. A `verify` block lets the
  // claim auto-transition when a contract deploys (see docs/claim-state-machine-spec.md).
  "provenance": {
    "id": "asendorf.net.capacity", "state": "artist-stated", "as_of": "2026-07-06",
    "source": "Kim Asendorf, Discord",
    "evidence": [ { "kind": "etherscan-tx", "ref": "0x…" } ],
    "verify": { "contract": null, "call": "cap()", "expect": { "op": "lte", "value": 128000000 } }
  },
  "revision": 1, "revised_at": "2026-07-09",
  "method": [ "How each class of figure was obtained." ],
  "caveats": [ "Known gaps, single-venue limits, Phase-2 items." ]
}
```

## The rules that make it a record

1. **Every figure has a date.** The top-level `snapshot` covers anything undated;
   anything verified separately carries its own date.
2. **Verified ≠ reported.** On-chain reconstruction and artist/venue statements
   are labeled and never merged into one number.
3. **Thin markets get flagged, and thin enough gets enumerated** — if a
   collection has 2 lifetime sales, list both with tx hashes rather than
   printing a floor as if it were established.
4. **Editorial is separated and signed.** The desk's read is opinion and says so.
5. **Caveats are content**, not fine print — `metric_note`, `flags`, `caveats`
   render prominently.

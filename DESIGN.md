# DENZA Design System

**Source of truth for every public denza.studio surface.** Derived 2026-07-08 from the
sites of the artists this desk covers — tylerxhobbs.com, mattdesl.com, kimasendorf.com,
mpkoz.com — plus Tufte's data-presentation principles. The mandate (Seth): the design
language learns from the artists' own aesthetic; "anything but Claude default" (collector
feedback, eli, 2026-07-08).

## The one-line brief

Let the numbers and the artwork be the only ink. The design's job is to get out of the way.

## What the artist sites share (the research)

1. **Monochrome by default** — white/near-white ground, near-black text, zero imposed
   accent. Color enters only through the artwork.
2. **Sans-serif, low-to-regular weight** — no heavy display type, no serifs.
3. **Sentence case** — lowercase section labels are an accepted move (DesLauriers);
   all-caps + letterspacing is not.
4. **The interface disappears** — 2–4 nav links, no chrome, no decoration.
5. **Whitespace as structure** — one organizing axis, no cards, no boxes.
6. **Named series as the unit** — "Fidenza", "Meridian", "PXL"; the series organizes
   the page, not the token id.

DENZA sits at the text-forward pole (like mattdesl.com) with the editorial discipline
of the image-forward sites: a market record reads like a catalogue raisonné, not a
trading terminal.

## Tokens

```css
:root{
  --bg:        #FAFAF8;  /* warm near-white ground */
  --ink:       #111111;  /* primary text + data values */
  --secondary: #6B6B6B;  /* labels, captions, metadata */
  --faint:     #9A9A96;  /* de-emphasized, footnote-grade */
  --hairline:  #DDDDD8;  /* 1px rules — the only enclosure allowed */
  --wash:      #F1F1EC;  /* table-header / chart-track wash, use sparingly */
  --accent:    #B4472B;  /* terracotta — verified/primary emphasis, alerts. ONE accent. */
  --positive:  #1F7A4D;  /* muted green — live/ok/fillable signals only */
  --sans: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, monospace;
}
```

Dark mode (user toggle in the nav; light is the default, stored in
`localStorage['denza-theme']`, applied via `:root[data-theme=dark]`, `?theme=` overrides):

```css
:root[data-theme=dark]{
  --bg:#101010; --wash:#1C1C1A; --hairline:#2C2C29;
  --ink:#F0F0EC; --secondary:#8B8B84; --faint:#63635C;
  --accent:#D0603F; --positive:#3FA36F;
}
```

- **No other colors.** No blues (#6B8FFF was the Claude-default tell), no golds, no
  gradients. Artwork thumbnails supply all remaining color.
- `--accent` is reserved for data that earned it: verified on-chain figures, threshold
  breaches, the delta that matters. Never decorative, never on chrome.

## Type

- Prose and headers: `--sans`, weight 400–600. Hierarchy from **size and color, not weight**.
- **Every number is mono** — floors, volumes, dates, addresses — with
  `font-variant-numeric: tabular-nums`. This is the site's signature.
- Section labels: `--mono`, lowercase, `letter-spacing:.04em`, ~12px, `--secondary`.
- No all-caps display type. h1 is large sentence-case sans, tight leading.

## Layout & spacing

- Single column, `max-width: 920px`, `padding: 0 24px`. Tables may scroll wider inside
  `overflow-x:auto`; the reading column stays narrow.
- Base unit 8px. Section gaps 64–96px. Table rows ~40px. Prose line-height 1.55;
  data rows 1.3.
- **No cards, no boxes, no border-radius, no shadows.** Structure comes from whitespace
  and hairlines. `border-radius: 0` everywhere.

## Chrome

- Nav: wordmark + 2–4 mono lowercase links. Not sticky. No backdrop blur.
- Buttons: solid `--ink` on `--bg`, square corners, sans 500. One button style.
- Inputs: `--bg` ground, 1px `--hairline` border, square. Focus = `--ink` border.
- Footer: mono, `--secondary`, hairline above.
- Motion: none. At most `transition: color .15s` on links.

## Data presentation (Tufte)

1. **Data-ink ratio** — no vertical gridlines, no zebra striping, no cell borders, no
   surrounding box. One hairline under rows.
2. **No chartjunk** — bars are flat rects on a `--wash` track; values as plain tabular
   numbers; no icons, gauges, gradient fills.
3. **Small multiples** — per-collection trends render as identical tiny sparklines on a
   shared scale, so shape comparison is instant.
4. **Layer with typography, not enclosure** — gray mono labels, ink mono values,
   accent deltas. No background fills to signal category.
5. **Annotate at the data** — context (thin-floor flag, the two POD prints, a maturity
   date) sits inline beside the number it explains, tx-linked. Never a legend the
   reader must cross-reference.

## Register

Catalogue raisonné, not dashboard. Confident, spare, cited. Every claim links its
evidence (Etherscan tx, contract, snapshot date). Caveats are part of the record, not
fine print.

## Rollout status

| Surface | Status |
|---|---|
| `market-record.js` (/kim, /hobbs, /deslauriers) | ✅ migrated 2026-07-08 |
| `pxl-book` section (inside market record) | ✅ migrated 2026-07-08 |
| `index.html` / `core.html` (dashboard) | ⏳ next — private surface, migrate deliberately |
| `positions.html`, `rotation-builder.html`, `desk.html` | ⏳ after dashboard |
| `denza-chat.js` widget | ⏳ restyle to match |

When touching any page: migrate it to these tokens rather than extending its old styles.

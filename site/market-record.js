/* DENZA market record — data-driven (/market/<slug>.json), citable market snapshot per artist */
(async function () {
  const SLUG = window.DENZA_MARKET;
  // Theme: light is the record's default (DESIGN.md); ?theme= wins over the stored choice.
  const savedTheme = (() => {
    const q = new URLSearchParams(location.search).get("theme");
    if (q === "dark" || q === "light") return q;
    try { return localStorage.getItem("denza-theme"); } catch { return null; }
  })();
  if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";
  /* DENZA design system (DESIGN.md): monochrome ground, mono numbers, one accent,
     no boxes/radius/shadows — derived from the covered artists' own sites + Tufte. */
  const css = `
    :root{--bg:#FAFAF8;--wash:#F1F1EC;--hairline:#DDDDD8;--ink:#111111;--text:#111111;--body:#3D3D3A;--muted:#6B6B6B;--faint:#9A9A96;--text-dim:#6B6B6B;--accent:#B4472B;--gold:#B4472B;--green:#1F7A4D;--mono:ui-monospace,'SF Mono',Menlo,monospace;--sans:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;--nav-h:52px}
    :root[data-theme=dark]{--bg:#101010;--wash:#1C1C1A;--hairline:#2C2C29;--ink:#F0F0EC;--text:#F0F0EC;--body:#B8B8B1;--muted:#8B8B84;--faint:#63635C;--text-dim:#8B8B84;--accent:#D0603F;--gold:#D0603F;--green:#3FA36F}
    *{box-sizing:border-box;margin:0;padding:0;border-radius:0}
    body{background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.55;-webkit-font-smoothing:antialiased;transition:background .2s,color .2s}
    a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--hairline);text-underline-offset:3px;transition:text-decoration-color .15s}
    a:hover{text-decoration-color:var(--ink)}
    .mono,.num,td.num,th.num{font-family:var(--mono);font-variant-numeric:tabular-nums}
    .denza-nav{height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 24px;border-bottom:1px solid var(--hairline)}
    .denza-nav .dn-brand{font-family:var(--mono);font-size:13px;font-weight:700;letter-spacing:.14em;color:var(--ink);text-decoration:none;white-space:nowrap}
    .denza-nav .dn-links{display:flex;align-items:center;gap:22px}
    .denza-nav .dn-links a{font-family:var(--mono);font-size:12px;letter-spacing:.04em;text-transform:lowercase;color:var(--muted);text-decoration:none;white-space:nowrap;transition:color .15s}
    .denza-nav .dn-links a:hover{color:var(--ink)}
    .denza-nav .dn-toggle{display:none;background:none;border:0;color:var(--ink);font-size:20px;line-height:1;cursor:pointer;padding:6px 8px}
    .dn-theme{background:none;border:0;font-family:var(--mono);font-size:12px;letter-spacing:.04em;text-transform:lowercase;color:var(--muted);cursor:pointer;padding:0;transition:color .15s}
    .dn-theme:hover{color:var(--ink)}
    @media(max-width:720px){
      .denza-nav .dn-toggle{display:block}
      .denza-nav{position:relative}
      .denza-nav .dn-links{position:absolute;top:var(--nav-h);left:0;right:0;z-index:300;flex-direction:column;align-items:stretch;gap:0;padding:8px 24px 16px;background:var(--bg);border-bottom:1px solid var(--hairline);display:none}
      .denza-nav.open .dn-links{display:flex}
      .denza-nav .dn-links a{padding:11px 0}
    }
    .wrap{max-width:920px;margin:0 auto;padding:0 24px}
    header{padding:72px 0 40px}
    .kicker{font-family:var(--mono);font-size:12px;text-transform:lowercase;letter-spacing:.04em;color:var(--muted)}
    h1{font-size:clamp(32px,6vw,54px);font-weight:600;letter-spacing:-.02em;line-height:1.05;margin-top:14px}
    .lede{color:var(--body);font-size:17px;margin-top:18px;max-width:64ch}
    .meta{display:flex;gap:32px;margin-top:32px;flex-wrap:wrap;font-family:var(--mono);font-size:12px}
    .meta div span{display:block;color:var(--muted);text-transform:lowercase;letter-spacing:.04em;font-size:11px;margin-bottom:3px}
    .meta div b{font-size:17px;font-weight:600;font-variant-numeric:tabular-nums}
    h2.sec{font-family:var(--mono);font-size:12px;text-transform:lowercase;letter-spacing:.04em;font-weight:400;color:var(--muted);margin:56px 0 14px}
    .note{border-top:1px solid var(--hairline);padding:14px 0 0;font-size:14px;color:var(--body);margin-top:24px;max-width:74ch}
    .note b{color:var(--ink)}
    table{width:100%;border-collapse:collapse;font-size:13.5px}
    th{font-family:var(--mono);font-size:11px;text-transform:lowercase;letter-spacing:.04em;font-weight:400;color:var(--muted);text-align:left;padding:8px 12px 8px 0;border-bottom:1px solid var(--ink)}
    td{padding:13px 12px 13px 0;border-bottom:1px solid var(--hairline);vertical-align:top}
    td.num,th.num{text-align:right}
    .cname{font-weight:600}
    .cname a{text-decoration:none}
    .caddr{font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:3px}
    .caddr a{color:inherit;text-decoration:none}
    .cflag{font-size:11.5px;color:var(--muted);margin-top:5px;max-width:340px;line-height:1.5}
    .cflag a{color:inherit;text-decoration:underline;text-decoration-color:var(--hairline);text-underline-offset:2px}
    .chip{display:inline-block;font-family:var(--mono);font-size:10px;text-transform:lowercase;letter-spacing:.04em;padding:1px 6px;border:1px solid var(--hairline);color:var(--muted);margin-left:8px;vertical-align:1px}
    .gold{color:var(--accent)}.green{color:var(--green)}.dim{color:var(--faint)}
    .tblwrap{overflow-x:auto}
    .tblwrap table{min-width:900px}
    .chart{padding:0;margin-top:8px}
    .bar-row{display:grid;grid-template-columns:130px 1fr 150px;gap:14px;align-items:center;margin:10px 0;font-family:var(--mono);font-size:12px;font-variant-numeric:tabular-nums}
    .bar-track{height:14px;position:relative;background:var(--wash)}
    .bar-seg{position:absolute;top:0;bottom:0}
    .legend{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:14px;font-family:var(--mono);font-size:11px;color:var(--muted)}
    .legend i{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:-1px}
    .callout{border-top:2px solid var(--ink);padding:18px 0 0;margin-top:28px}
    .callout .big{font-family:var(--mono);font-size:32px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
    .callout p{color:var(--body);font-size:14px;margin-top:8px;max-width:72ch}
    ul.plain{list-style:none}ul.plain li{color:var(--body);font-size:14px;padding:7px 0 7px 18px;position:relative;max-width:78ch}
    ul.plain li::before{content:'—';position:absolute;left:0;color:var(--faint)}
    footer{border-top:1px solid var(--hairline);margin-top:88px;padding:24px 0 72px;font-family:var(--mono);font-size:12px;color:var(--muted)}
    footer a{color:var(--muted)}
    header.has-frontis{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,320px);column-gap:48px;align-items:start}
    .frontis{margin:0}
    .frontis img{width:100%;height:auto;display:block;border:1px solid var(--hairline);background:var(--wash);image-rendering:pixelated}
    .frontis figcaption{font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5}
    @media(max-width:860px){header.has-frontis{display:block}.frontis{max-width:280px;margin-top:28px}}
    .notice-band{border-top:2px solid var(--accent);padding:12px 0 0;margin-top:6px;font-size:14px;color:var(--body);max-width:74ch}
    .notice-band .nb-kicker{font-family:var(--mono);font-size:11px;text-transform:lowercase;letter-spacing:.04em;color:var(--accent);display:block;margin-bottom:4px}
    .notice-band a{white-space:nowrap}
    .contents{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:22px;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}
    .contents a{color:var(--muted);text-decoration:underline;text-decoration-color:var(--hairline);text-underline-offset:3px;text-transform:lowercase}
    .contents a:hover{color:var(--ink);text-decoration-color:var(--ink)}
    .contents .dot{color:var(--faint)}
    .cworks{display:flex;gap:6px;margin-top:8px}
    .cworks a{display:block;line-height:0}
    .cworks img{width:56px;height:56px;object-fit:cover;border:1px solid var(--hairline);background:var(--wash);image-rendering:pixelated;display:block;transition:border-color .15s}
    .cworks a:hover img{border-color:var(--ink)}
    .voice{max-width:74ch;margin:26px 0;padding-left:18px;border-left:2px solid var(--hairline)}
    .voice p{font-size:16px;color:var(--ink);line-height:1.6}
    .voice cite{display:block;font-style:normal;font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:8px}
    .diagwrap{overflow-x:auto;margin-top:6px}
    .pxlmap{display:block;min-width:820px;width:100%;height:auto}
    .triptych{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:6px}
    .triptych figure{margin:0}
    .triptych svg{display:block;width:100%;height:auto;border:1px solid var(--hairline);background:var(--bg)}
    .triptych figcaption{font-family:var(--mono);font-size:10.5px;color:var(--muted);margin-top:7px;line-height:1.5}
    @media(max-width:720px){.triptych{grid-template-columns:1fr;max-width:340px}}
    html{scroll-behavior:smooth}
    .err{padding:80px 24px;text-align:center;color:var(--muted);font-family:var(--mono)}
    .usd{display:block;font-family:var(--mono);font-size:10px;color:var(--faint);margin-top:1px}
    .lookup{display:flex;gap:10px;margin-top:22px;max-width:620px;flex-wrap:wrap}
    .lookup input{flex:1;min-width:240px;background:var(--bg);border:1px solid var(--hairline);color:var(--ink);font-family:var(--mono);font-size:15px;padding:13px 15px;outline:none}
    .lookup input:focus{border-color:var(--ink)}
    .lookup button{background:var(--ink);color:var(--bg);border:1px solid var(--ink);font-family:var(--sans);font-weight:500;font-size:14px;letter-spacing:.01em;padding:13px 24px;cursor:pointer;white-space:nowrap}
    .lookup button:disabled{opacity:.4;cursor:default}
    .reassure{font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:12px;max-width:70ch}
    .reassure b{color:var(--green)}
    .pb-status{margin-top:20px;font-family:var(--mono);font-size:13px;color:var(--muted)}
    .pb-status.error{color:var(--accent)}
    .cardstat{display:flex;gap:34px;flex-wrap:wrap;margin-top:24px;font-family:var(--mono);font-variant-numeric:tabular-nums}
    .cardstat div span{display:block;color:var(--muted);text-transform:lowercase;letter-spacing:.04em;font-size:11px;margin-bottom:4px}
    .cardstat div b{font-size:22px;font-weight:600}
    .bighead{margin:96px 0 24px;padding-top:20px;border-top:1px solid var(--ink)}
    .bighead .n{font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:var(--faint)}
    .bighead h2{font-size:clamp(24px,4vw,36px);font-weight:600;letter-spacing:-.01em;line-height:1.1;margin-top:10px}
    .bighead .sub{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:10px;letter-spacing:.04em;text-transform:lowercase}
    .cockpit{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:24px;border-top:2px solid var(--ink);margin-top:22px}
    .ck{padding:14px 0 16px;border-bottom:1px solid var(--hairline);min-width:0}
    .ck>span{display:block;font-family:var(--mono);font-size:11px;color:var(--muted);text-transform:lowercase;letter-spacing:.04em;margin-bottom:6px}
    .ck b{font-family:var(--mono);font-size:clamp(15px,1.8vw,21px);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
    .ck b a{text-decoration-color:var(--hairline)}
    @media(max-width:720px){.cockpit{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .alinks{display:flex;gap:18px;flex-wrap:wrap;margin-top:24px;font-family:var(--mono);font-size:12px}
    .alinks a{color:var(--muted);text-decoration:underline;text-decoration-color:var(--hairline);text-underline-offset:3px;letter-spacing:.02em;transition:color .15s}
    .alinks a:hover{color:var(--ink)}
    .fb textarea{display:block;width:100%;max-width:620px;min-height:110px;background:var(--bg);border:1px solid var(--hairline);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;padding:13px 15px;outline:none;resize:vertical}
    .fb textarea:focus{border-color:var(--ink)}
    .fb .fb-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
    .fb .fb-row{display:flex;gap:10px;margin-top:10px;max-width:620px;flex-wrap:wrap}
    .fb .fb-row input{flex:1;min-width:220px;background:var(--bg);border:1px solid var(--hairline);color:var(--ink);font-family:var(--mono);font-size:13px;padding:11px 13px;outline:none}
    .fb .fb-row input:focus{border-color:var(--ink)}
    .fb button{background:var(--ink);color:var(--bg);border:1px solid var(--ink);font-family:var(--sans);font-weight:500;font-size:14px;letter-spacing:.01em;padding:12px 22px;cursor:pointer;white-space:nowrap}
    .fb button:disabled{opacity:.4;cursor:default}
    .cwrap{display:flex;gap:12px;align-items:flex-start}
    .cthumb{width:68px;height:68px;object-fit:cover;image-rendering:pixelated;border:1px solid var(--hairline);background:var(--wash);display:block;flex:none}
  `;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  const root = document.getElementById('mr');

  let d;
  try {
    const res = await fetch(`/market/${SLUG}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    d = await res.json();
  } catch (e) {
    root.innerHTML = `<div class="err">Market record unavailable (${e.message}).</div>`;
    return;
  }
  document.title = `${d.artist} — Market Record · ${d.publisher}`;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // URLs from the record JSON only ever land in href/src if http(s) or site-relative.
  const safeUrl = u => /^(https?:\/\/|\/)/i.test(String(u ?? '')) ? esc(u) : '';
  const fmtM = n => n == null ? '—' : (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Number(n).toLocaleString('en-US'));
  const fmt = (n, dp = 1) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: dp });
  const short = a => a.length > 20 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
  const scanUrl = c => c.chain === 'Ethereum' ? `https://etherscan.io/address/${esc(c.contract)}`
    : c.chain === 'Polygon' ? `https://polygonscan.com/address/${esc(c.contract)}`
    : c.chain === 'Base' ? `https://basescan.org/address/${esc(c.contract)}`
    : `https://tzkt.io/${esc(c.contract)}`;
  const rate = cur => (cur === 'ETH' || cur === 'WETH') ? d.fx?.eth_usd : cur === 'XTZ' ? d.fx?.xtz_usd : null;
  const fmtUsd = n => n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${Math.round(n / 1e3).toLocaleString('en-US')}K` : `$${n.toFixed(0)}`;
  const usd = (v, cur) => { const r = rate(cur); return v != null && v !== 0 && r ? `<span class="usd">${fmtUsd(v * r)}</span>` : ''; };
  const bighead = (n, title, sub = '', id = '') => `<div class="bighead"${id ? ` id="${id}"` : ''}><div class="n">${n}</div><h2>${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;

  const eth = d.collections.filter(c => c.floor?.currency === 'ETH');
  const totSecondary = eth.reduce((s, c) => s + (c.secondary_volume?.value || 0), 0);
  const totPrimary = eth.reduce((s, c) => s + (c.primary?.proceeds || 0), 0);
  const totHolders = d.collections.reduce((s, c) => s + (c.holders || 0), 0);
  const primaries = d.collections.filter(c => c.primary);

  const nav = `<nav class="denza-nav" id="denzaNav">
    <a class="dn-brand" href="/">DENZA</a>
    <button class="dn-toggle" aria-label="Menu" onclick="document.getElementById('denzaNav').classList.toggle('open')">☰</button>
    <div class="dn-links">
      <a href="/${SLUG}.html">Collection</a>
      ${d.token ? '<a href="#book">PXL Book</a>' : ''}
      ${SLUG === 'asendorf' ? '<a href="/kim/terminal">Terminal</a>' : ''}
      <button type="button" class="dn-theme" id="dnTheme" aria-label="Toggle color scheme">${savedTheme === "dark" ? "light" : "dark"}</button>
    </div>
  </nav>`;

  const rows = d.collections.map(c => {
    const g = c.gondi || {};
    // Per-collection caveat line: flags + (if present) the actual secondary prints,
    // each linked to its tx — the claim documents itself.
    const sales = (c.secondary_sales || []).map(s =>
      `<a href="https://etherscan.io/tx/${esc(s.tx)}" target="_blank" rel="noopener">${esc(s.token)} @ ${fmt(s.price, 1)} ${esc(s.currency)}</a> (${esc(s.date)}${s.note ? ` — ${esc(s.note)}` : ''})`
    ).join(' · ');
    const flagLine = (c.flags || []).length || sales
      ? `<div class="cflag">${(c.flags || []).map(esc).join(' ')}${sales ? ` ${sales}.` : ''}</div>` : '';
    // A strip of representative works — the record reads as a catalogue, not a spreadsheet.
    const worksStrip = (c.works || []).length ? `<div class="cworks">${c.works.map(w =>
      safeUrl(w.image) ? `<a href="${safeUrl(w.url) || '#'}" target="_blank" rel="noopener" title="${esc(w.token)}"><img src="${safeUrl(w.image)}" alt="${esc(w.token)}" loading="lazy"></a>` : ''
    ).join('')}</div>` : '';
    const gcell = !g.listed ? '<span class="dim">—</span>'
      : g.best ? `<span class="green">${esc(g.best)}</span>`
      : `<span class="dim">listed · 0 offers</span>`;
    const prim = c.primary ? `<td class="num gold">${fmt(c.primary.proceeds, 2)}${usd(c.primary.proceeds, c.primary.currency || 'ETH')}</td>` : '<td class="num dim">—</td>';
    return `<tr>
      <td><div class="cwrap">${safeUrl(c.image) ? `<a href="${safeUrl(c.url) || '#'}" target="_blank" rel="noopener"><img class="cthumb" src="${safeUrl(c.image)}" alt="${esc(c.name)}" loading="lazy"></a>` : ''}<div>
          <div class="cname"><a href="${safeUrl(c.url) || '#'}" target="_blank" rel="noopener">${esc(c.name)}</a><span class="chip">${esc(c.chain)}</span></div>
          <div class="caddr"><a href="${scanUrl(c)}" target="_blank" rel="noopener">${short(c.contract)}</a> · minted ${esc(c.mint)}</div>${flagLine}${worksStrip}</div></div></td>
      <td class="num">${fmt(c.supply, 0)}</td>
      <td class="num">${fmt(c.holders, 0)}</td>
      <td class="num">${c.floor ? `${fmt(c.floor.value, 2)} ${esc(c.floor.currency)}${usd(c.floor.value, c.floor.currency)}` : '<span class="dim">—</span>'}</td>
      <td class="num">${fmt(c.secondary_volume?.value)} ${esc(c.secondary_volume?.currency || '')}${usd(c.secondary_volume?.value, c.secondary_volume?.currency)}</td>
      ${prim}
      <td class="num">${c.volume_30d == null ? '—' : fmt(c.volume_30d, 2)}${usd(c.volume_30d, c.secondary_volume?.currency || c.floor?.currency)}</td>
      <td>${gcell}</td>
    </tr>`;
  }).join('');

  const maxFlow = Math.max(...eth.map(c => (c.secondary_volume?.value || 0) + (c.primary?.proceeds || 0)));
  const bars = eth
    .slice().sort((a, b) => ((b.secondary_volume?.value || 0) + (b.primary?.proceeds || 0)) - ((a.secondary_volume?.value || 0) + (a.primary?.proceeds || 0)))
    .map(c => {
      const sec = c.secondary_volume?.value || 0, pri = c.primary?.proceeds || 0;
      const w = v => Math.max(v / maxFlow * 100, v > 0 ? 0.4 : 0);
      const label = pri ? `${fmt(sec + pri)} (${fmt(pri)} primary)` : fmt(sec);
      return `<div class="bar-row"><div>${esc(c.name)}</div>
        <div class="bar-track">
          <div class="bar-seg" style="left:0;width:${w(sec)}%;background:var(--ink)"></div>
          ${pri ? `<div class="bar-seg" style="left:${w(sec)}%;width:${w(pri)}%;background:var(--gold)"></div>` : ''}
        </div>
        <div style="text-align:right">${label} ETH${usd(sec + pri, 'ETH')}</div></div>`;
    }).join('');

  // Optional fungible-token section (d.token) — the ERC-20 layer under the collections.
  const t = d.token;
  let tokenBlock = '';
  if (t) {
    const lockedTotal = (t.locked || []).reduce((s, l) => s + (l.amount || 0), 0);
    const segs = [
      ...(t.locked || []).map((l, i) => ({ label: l.label, v: l.amount, color: i === 0 ? 'var(--ink)' : '#55554F' })),
      { label: 'Free float (loose in wallets)', v: t.free_float, color: 'var(--gold)' },
    ];
    let x = 0;
    const segHtml = segs.map(s => {
      const w = (s.v / t.total_supply * 100).toFixed(2); const left = x; x += +w;
      return `<div class="bar-seg" style="left:${left}%;width:${w}%;background:${s.color}"></div>`;
    }).join('');
    const ck = (label, value) => `<div class="ck"><span>${label}</span><b>${value}</b></div>`;
    tokenBlock = `
    ${bighead('03', `${esc(t.symbol)} — the token under the works`, `${esc(t.standard)} · verified on-chain ${esc(t.verified)}`, 'pxl')}
    <div class="cockpit">
      ${ck('contract', `<a href="https://etherscan.io/token/${esc(t.contract)}" target="_blank" rel="noopener">${short(t.contract)}</a>`)}
      ${ck('standard', `${esc(t.standard)} · ${t.decimals} dec`)}
      ${ck('hard cap', fmt(t.cap, 0))}
      ${ck('minted', fmt(t.total_supply, 0))}
      ${ck('locked in the art', `<span class="gold">${(lockedTotal / t.total_supply * 100).toFixed(1)}%</span>`)}
      ${ck('free float', fmt(t.free_float, 0))}
      ${ck('deck mint price', `${t.mint_price_eth} ETH`)}
      ${ck('unminted allowance', fmt(t.deck_allowance_remaining, 0))}
    </div>
    <div class="chart" style="margin-top:18px">
      <div class="bar-row"><div>Minted supply</div><div class="bar-track">${segHtml}</div><div style="text-align:right">${fmt(t.total_supply, 0)} PXL</div></div>
      <div class="legend">${segs.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)} · ${fmt(s.v, 0)}</span>`).join('')}</div>
    </div>
    <h2 class="sec" style="margin-top:44px">how pxl moves</h2>
    <div class="diagwrap"><svg class="pxlmap" viewBox="0 0 960 330" role="img" aria-label="How PXL moves between the artist, decks, the loose float and PXL NET">
      <defs>
        <marker id="mIn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ink)"/></marker>
        <marker id="mAc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker>
      </defs>
      <g font-family="ui-monospace,'SF Mono',Menlo,monospace">
        <!-- main flow nodes -->
        <rect x="10" y="52" width="130" height="64" fill="none" stroke="var(--ink)"/>
        <text x="75" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">ARTIST</text>
        <text x="75" y="96" text-anchor="middle" font-size="10" fill="var(--muted)">${fmtM(t.cap - t.total_supply - t.deck_allowance_remaining)} ungranted</text>
        <rect x="205" y="52" width="180" height="64" fill="none" stroke="var(--ink)"/>
        <text x="295" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">DECK ALLOWANCE</text>
        <text x="295" y="96" text-anchor="middle" font-size="10" fill="var(--muted)">${fmtM(t.deck_allowance_remaining)} · deck owners only</text>
        <rect x="450" y="52" width="145" height="64" fill="none" stroke="var(--ink)"/>
        <text x="522" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">LOOSE PXL</text>
        <text x="522" y="96" text-anchor="middle" font-size="10" fill="var(--muted)">${fmtM(t.free_float)} · no venue</text>
        <rect x="660" y="52" width="160" height="64" fill="none" stroke="var(--ink)"/>
        <text x="740" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">PXL NET</text>
        <text x="740" y="96" text-anchor="middle" font-size="10" fill="var(--muted)">\u2264128M \u00b7 token 0</text>
        <!-- flows -->
        <line x1="140" y1="84" x2="199" y2="84" stroke="var(--ink)" marker-end="url(#mIn)"/>
        <text x="170" y="74" text-anchor="middle" font-size="9.5" fill="var(--muted)">grants</text>
        <line x1="385" y1="84" x2="444" y2="84" stroke="var(--ink)" marker-end="url(#mIn)"/>
        <text x="415" y="34" text-anchor="middle" font-size="9.5" fill="var(--muted)">mint</text>
        <text x="415" y="46" text-anchor="middle" font-size="9.5" fill="var(--muted)">${t.mint_price_eth} ETH</text>
        <line x1="595" y1="84" x2="654" y2="84" stroke="var(--ink)" marker-end="url(#mIn)"/>
        <text x="625" y="34" text-anchor="middle" font-size="9.5" fill="var(--muted)">add · in person</text>
        <text x="625" y="46" text-anchor="middle" font-size="9.5" fill="var(--accent)">$8–$2,560 → NODE</text>
        <!-- receipt + burn-redeem loop -->
        <rect x="660" y="216" width="160" height="56" fill="none" stroke="var(--hairline)"/>
        <text x="740" y="239" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">RECEIPT NFT</text>
        <text x="740" y="255" text-anchor="middle" font-size="10" fill="var(--muted)">100–31,250 · generative</text>
        <line x1="740" y1="116" x2="740" y2="210" stroke="var(--ink)" marker-end="url(#mIn)"/>
        <text x="748" y="166" font-size="9.5" fill="var(--muted)">issues</text>
        <path d="M660 244 L522 244 L522 122" fill="none" stroke="var(--accent)" stroke-dasharray="4 4" marker-end="url(#mAc)"/>
        <text x="575" y="232" text-anchor="middle" font-size="9.5" fill="var(--accent)">burn = redeem · pxl returned</text>
        <!-- sealed reservoirs -->
        <rect x="70" y="216" width="180" height="56" fill="var(--wash)" stroke="var(--hairline)"/>
        <text x="160" y="239" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">IN 256 DECKS</text>
        <text x="160" y="255" text-anchor="middle" font-size="10" fill="var(--muted)">${fmtM(t.locked?.[0]?.amount)} attached · sealed</text>
        <rect x="270" y="216" width="180" height="56" fill="var(--wash)" stroke="var(--hairline)"/>
        <text x="360" y="239" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">IN 256 PODS</text>
        <text x="360" y="255" text-anchor="middle" font-size="10" fill="var(--muted)">${fmtM(t.locked?.[1]?.amount)} attached · sealed</text>
        <text x="260" y="296" font-size="10" fill="var(--faint)">attached pixels travel with their deck or pod — they never re-enter the float while the work exists</text>
        <text x="10" y="322" font-size="10" fill="var(--faint)">quantities on-chain ${esc(t.verified)} · NET figures artist-stated until the contract is live · money flows dashed, in terracotta</text>
      </g>
    </svg></div>

    <h2 class="sec" style="margin-top:36px">the three containers</h2>
    <div class="triptych">
      <figure>
        <svg viewBox="0 0 160 120" aria-label="PXL DEX — 256 decks">
          ${Array.from({length: 64}, (_, i) => `<rect x="${12 + (i % 16) * 8.6}" y="${26 + Math.floor(i / 16) * 8.6}" width="6" height="6" fill="none" stroke="var(--ink)" stroke-width="0.8"/>`).join('')}
          <text x="12" y="14" font-size="10" font-weight="700" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">PXL DEX · 2025</text>
          <text x="12" y="80" font-size="8.5" fill="var(--muted)" font-family="ui-monospace,Menlo,monospace">256 decks — attached PXL</text>
          <text x="12" y="92" font-size="8.5" fill="var(--muted)" font-family="ui-monospace,Menlo,monospace">+ mint allowance:</text>
          <text x="12" y="104" font-size="8.5" fill="var(--accent)" font-family="ui-monospace,Menlo,monospace">the only primary market</text>
        </svg>
        <figcaption>${fmtM(t.locked?.[0]?.amount)} attached · ${fmtM(t.deck_allowance_remaining)} still mintable</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 160 120" aria-label="PXL POD — 256 pods">
          ${Array.from({length: 64}, (_, i) => `<circle cx="${15 + (i % 16) * 8.6}" cy="${29 + Math.floor(i / 16) * 8.6}" r="3" fill="none" stroke="var(--ink)" stroke-width="0.8"/>`).join('')}
          <text x="12" y="14" font-size="10" font-weight="700" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">PXL POD · 2026</text>
          <text x="12" y="80" font-size="8.5" fill="var(--muted)" font-family="ui-monospace,Menlo,monospace">256 pods — pixels sealed,</text>
          <text x="12" y="92" font-size="8.5" fill="var(--muted)" font-family="ui-monospace,Menlo,monospace">no allowance, no exit:</text>
          <text x="12" y="104" font-size="8.5" fill="var(--muted)" font-family="ui-monospace,Menlo,monospace">pure reservoir</text>
        </svg>
        <figcaption>${fmtM(t.locked?.[1]?.amount)} attached — the deepest lock</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 160 120" aria-label="PXL NET — token 0 and receipts">
          ${Array.from({length: 14}, (_, i) => { const a = i / 14 * Math.PI * 2; const cx = 80 + Math.cos(a) * 34, cy = 46 + Math.sin(a) * 26; return `<line x1="80" y1="46" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="var(--hairline)" stroke-width="0.8"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.6" fill="none" stroke="var(--ink)" stroke-width="0.8"/>`; }).join('')}
          <rect x="74" y="40" width="12" height="12" fill="var(--accent)"/>
          <text x="12" y="14" font-size="10" font-weight="700" fill="var(--ink)" font-family="ui-monospace,Menlo,monospace">PXL NET · opens 07-11</text>
          <text x="12" y="92" font-size="8.5" fill="var(--muted)" font-family="ui-monospace,Menlo,monospace">token 0 shows the net;</text>
          <text x="12" y="104" font-size="8.5" fill="var(--muted)" font-family="ui-monospace,Menlo,monospace">receipts burn to redeem</text>
        </svg>
        <figcaption>holds ≤128M · 100–31,250 receipts · the only door back to loose</figcaption>
      </figure>
    </div>

    <p class="lede" style="font-size:15px;margin-top:26px">${esc(t.lede)}</p>
    <div class="note"><b>Headroom.</b> ${fmt(t.deck_allowance_remaining, 0)} PXL of unminted deck allowance remains on-chain (${t.decks_with_intact_allowance} of 256 decks fully intact at 500,000 each), mintable only by deck owners at ${t.mint_price_eth} ETH per PXL. Beyond the decks, new works can be granted fresh mint allowances up to the ${fmt(t.cap, 0)} hard cap.</div>
    ${(t.notes || []).length ? `<ul class="plain" style="margin-top:14px">${t.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}

    ${bighead('04', 'Your PXL book', 'check any wallet — read-only', 'book')}
    <p class="lede" style="font-size:15px;margin-top:0">Enter any Ethereum address or ENS name to see its decks and pods — attached pixels, collection rank, and each deck's <span class="gold">unexercised mint allowance</span>: a standing right to mint fresh PXL at ${t.mint_price_eth}&nbsp;ETH each, exercisable only by the deck owner.</p>
    <form class="lookup" id="pbForm">
      <input id="pbWallet" type="text" autocomplete="off" spellcheck="false" placeholder="vitalik.eth  or  0x1234…abcd" aria-label="Address or ENS name"/>
      <button type="submit" id="pbGo">Read the book</button>
    </form>
    <p class="reassure"><b>Read-only.</b> No wallet connection, no signature, nothing to approve — this reads the same public on-chain data anyone can, one address at a time. We never store the address you enter.</p>
    <div id="pbStatus" class="pb-status"></div>
    <div id="pbResults" style="display:none">
      <div class="callout" id="pbHook"></div>
      <div class="cardstat" id="pbTotals"></div>
      <h2 class="sec" id="pbDeckHdr" style="display:none">Decks held</h2>
      <div class="tblwrap" id="pbDeckWrap" style="display:none"><table style="min-width:560px">
        <thead><tr><th>Deck</th><th class="num">Attached PXL</th><th class="num">Rank</th><th class="num">Unexercised allowance</th><th class="num">Mint cost</th></tr></thead>
        <tbody id="pbDeckBody"></tbody>
      </table></div>
      <h2 class="sec" id="pbPodHdr" style="display:none">Pods held</h2>
      <div class="tblwrap" id="pbPodWrap" style="display:none"><table style="min-width:560px">
        <thead><tr><th>Pod</th><th class="num">Attached PXL</th><th class="num">Rank</th><th class="num">Value at mint price</th></tr></thead>
        <tbody id="pbPodBody"></tbody>
      </table></div>
      <div class="note" id="pbCtx"></div>
    </div>`;
  }

  // Optional editorial section (d.editorial) — chronology + open questions from the desk's own writing.
  const ed = d.editorial;
  let edBlock = '';
  if (ed) {
    const edNum = t ? '05' : '03';
    edBlock = `
    ${bighead(edNum, esc(ed.title), esc(ed.sub || ''), 'read')}
    ${ed.throughline ? `<p class="lede" style="margin-top:0">${esc(ed.throughline)}</p>` : ''}
    ${(ed.timeline || []).length ? `<h2 class="sec">Chronology</h2>
    <div class="tblwrap"><table style="min-width:640px">
      <tbody>${ed.timeline.map(x => `<tr>
        <td class="mono dim" style="white-space:nowrap;width:90px">${esc(x.date)}</td>
        <td style="max-width:84ch">${esc(x.text)}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : ''}
    ${(ed.questions || []).length ? `<h2 class="sec">Open questions</h2>
    <ul class="plain">${ed.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
    ${ed.note ? `<div class="note">${esc(ed.note)}</div>` : ''}`;
  }

  // Optional feedback/wishlist section (d.feedback) — a one-way note to the desk.
  // Nothing stored server-side; the note is forwarded once and dropped.
  // Collector voices — quotes from the community, credited; renders the invite even when empty.
  const vo = d.voices;
  let voBlock = '';
  if (vo && ((vo.entries || []).length || vo.invite)) {
    const voNum = String(3 + (t ? 2 : 0) + (ed ? 1 : 0)).padStart(2, '0');
    voBlock = `
    ${bighead(voNum, esc(vo.title || 'Collector voices'), esc(vo.sub || ''), 'voices')}
    ${(vo.entries || []).map(v => `<blockquote class="voice">
      <p>${esc(v.quote)}</p>
      <cite>— ${esc(v.name || 'anonymous')}${v.detail ? `, ${esc(v.detail)}` : ''}${v.date ? ` · ${esc(v.date)}` : ''}</cite>
    </blockquote>`).join('')}
    ${vo.invite ? `<div class="note">${esc(vo.invite)}</div>` : ''}`;
  }

  const fb = d.feedback;
  let fbBlock = '';
  if (fb) {
    const fbNum = String(3 + (t ? 2 : 0) + (ed ? 1 : 0) + (vo && ((vo.entries || []).length || vo.invite) ? 1 : 0)).padStart(2, '0');
    fbBlock = `
    ${bighead(fbNum, esc(fb.title || 'Wishlist'), esc(fb.sub || ''), 'wishlist')}
    ${fb.prompt ? `<p class="lede" style="font-size:15px;margin-top:0">${esc(fb.prompt)}</p>` : ''}
    <form class="fb" id="fbForm">
      <textarea id="fbMsg" maxlength="1000" placeholder="${esc(fb.placeholder || 'What should this page do that it doesn’t yet?')}" aria-label="Your feedback"></textarea>
      <input class="fb-hp" type="text" name="website" id="fbHp" tabindex="-1" autocomplete="off" aria-hidden="true"/>
      <div class="fb-row">
        <input id="fbContact" type="text" maxlength="200" autocomplete="off" spellcheck="false" placeholder="contact (optional) — ENS, X, Discord, email" aria-label="Contact (optional)"/>
        <button type="submit" id="fbGo">Send to the desk</button>
      </div>
      <p class="reassure"><b>One-way note.</b> Nothing is stored and no account is created — your note goes straight to the desk and that's it. Leave a contact only if you'd like a reply.</p>
      <div id="fbStatus" class="pb-status"></div>
    </form>`;
  }

  // Contents row — anchors for whatever sections this record actually has.
  const contents = [
    ['#collections', 'collections'],
    ['#flow', 'money flow'],
    d.token ? ['#pxl', d.token.symbol.toLowerCase()] : null,
    d.token ? ['#book', 'your pxl book'] : null,
    d.editorial ? ['#read', "the desk's read"] : null,
    d.voices && ((d.voices.entries || []).length || d.voices.invite) ? ['#voices', 'collector voices'] : null,
    d.feedback ? ['#wishlist', 'wishlist'] : null,
  ].filter(Boolean);

  // Frontispiece — one work, catalogue-style, so the page opens with the art.
  const fr = d.frontispiece;
  const frontis = fr && safeUrl(fr.image) ? `<figure class="frontis">
      <a href="${safeUrl(fr.url) || '#'}" target="_blank" rel="noopener"><img src="${safeUrl(fr.image)}" alt="${esc(fr.caption || '')}" loading="eager"></a>
      ${fr.caption ? `<figcaption>${esc(fr.caption)}</figcaption>` : ''}
    </figure>` : '';

  const notice = d.notice ? `<div class="notice-band">
      <span class="nb-kicker">${esc(d.notice.kicker || 'Notice')}</span>
      <span>${esc(d.notice.text)}${d.notice.href ? ` <a href="${safeUrl(d.notice.href) || '#'}"${/^https?:/.test(d.notice.href || '') ? ' target="_blank" rel="noopener"' : ''}>${esc(d.notice.link_label || 'more')}</a>` : ''}</span>
    </div>` : '';

  root.innerHTML = `${nav}
  <div class="wrap">
    <header${frontis ? ' class="has-frontis"' : ''}>
      <div class="h-text">
        <div class="kicker">${esc(d.publisher)} · Market Record · snapshot ${esc(d.snapshot)}</div>
        <h1>${esc(d.artist)}</h1>
        <p class="lede">${esc(d.lede)}</p>
        <div class="meta">
          <div><span>Collections</span><b>${d.collections.length}</b></div>
          <div><span>Chains</span><b>${[...new Set(d.collections.map(c => c.chain))].length}</b></div>
          <div><span>Tokens</span><b>${fmt(d.collections.reduce((s, c) => s + c.supply, 0), 0)}</b></div>
          <div><span>Holders (gross)</span><b>${fmt(totHolders, 0)}</b></div>
          <div><span>ETH secondary (OpenSea)</span><b>${fmt(totSecondary, 0)} ETH</b>${usd(totSecondary, 'ETH')}</div>
          ${totPrimary > 0 ? `<div><span>Verified primary</span><b class="gold">${fmt(totPrimary, 2)} ETH</b>${usd(totPrimary, 'ETH')}</div>` : ''}
        </div>
        ${(d.artist_links || []).length ? `<div class="alinks">${d.artist_links.map(l => `<a href="${safeUrl(l.url) || '#'}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>` : ''}
      </div>
      ${frontis}
    </header>
    ${notice}
    <div class="contents">${contents.map(([href, label]) => `<a href="${href}">${label}</a>`).join('<span class="dot">·</span>')}</div>
    <div class="note"><b>Reading the volume figures.</b> ${esc(d.metric_note)}</div>

    ${bighead('01', 'Collections', `${d.collections.length} bodies of work · ${esc([...new Set(d.collections.map(c => c.chain))].join(' + '))}`, 'collections')}
    <div class="tblwrap"><table>
      <thead><tr><th>Collection</th><th class="num">Supply</th><th class="num">Holders</th><th class="num">Floor</th><th class="num">Secondary vol (all-time)</th><th class="num">Primary (verified)</th><th class="num">30d vol</th><th>Gondi lending</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>

    ${bighead('02', 'Money flow', 'all-time · Ethereum collections · ETH', 'flow')}
    <div class="chart">${bars}
      <div class="legend"><span><i style="background:var(--ink)"></i>OpenSea secondary</span>${totPrimary > 0 ? '<span><i style="background:var(--gold)"></i>Verified on-chain primary</span>' : ''}</div>
    </div>

    ${primaries.map(c => `<div class="callout">
      <div class="kicker" style="color:var(--gold)">Primary reconstruction · ${esc(c.name)}</div>
      <div class="big">${fmt(c.primary.proceeds, 2)} ETH${rate('ETH') ? ` <span style="font-size:15px;font-weight:400;color:var(--muted)">≈ ${fmtUsd(c.primary.proceeds * rate('ETH'))}</span>` : ''}</div>
      <p>${esc(c.primary.paid_mint_txs)} paid mint transactions into the contract, ${esc(c.primary.window)} — ${esc(c.primary.price_range)}. ${esc(c.primary.note)}</p>
    </div>`).join('')}
    ${tokenBlock}
    ${edBlock}
    ${voBlock}
    ${fbBlock}

    <h2 class="sec">Method</h2>
    <ul class="plain">${d.method.map(m => `<li>${esc(m)}</li>`).join('')}</ul>

    <h2 class="sec">Caveats</h2>
    <ul class="plain">${d.caveats.map(m => `<li>${esc(m)}</li>`).join('')}</ul>

    <footer>
      Data: <a href="/market/${esc(d.slug)}.json">denza.studio/market/${esc(d.slug)}.json</a> — cite freely with the snapshot date.
      Assembled by ${esc(d.publisher)} from public onchain and marketplace sources. Not investment advice.<br>
      Disclosure: the desk collects the work it records — ${esc(d.publisher)}'s operator holds positions in works covered by this record.<br>
      This record is a collaborative work in progress: data, renderer and method are open at
      <a href="https://github.com/brightseth/denza-records" target="_blank" rel="noopener">github.com/brightseth/denza-records</a>
      — corrections with evidence are merged and credited.
    </footer>
  </div>`;

  // --- PXL book lookup (only rendered when the record has a token layer) ---
  // Theme toggle — stored choice, applied at load (top of file) to avoid flash.
  const themeBtn = document.getElementById('dnTheme');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    if (dark) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = 'dark';
    themeBtn.textContent = dark ? 'dark' : 'light';
    try { localStorage.setItem('denza-theme', dark ? 'light' : 'dark'); } catch { /* private mode */ }
  });

  const pbForm = document.getElementById('pbForm');
  if (pbForm) {
    const $ = id => document.getElementById(id);
    const input = $('pbWallet'), btn = $('pbGo'), status = $('pbStatus'), results = $('pbResults');
    const fmt0 = (n, dp = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: dp });
    const setStatus = (msg, isErr) => { status.textContent = msg || ''; status.className = 'pb-status' + (isErr ? ' error' : ''); };

    function render(j) {
      const tt = j.totals;
      const has = tt.deckCount + tt.podCount > 0;
      if (tt.unexercisedAllowance > 0) {
        $('pbHook').innerHTML =
          `<div class="kicker" style="color:var(--gold)">Unexercised mint allowance</div>
           <div class="big">${fmt0(tt.unexercisedAllowance)} PXL <span style="font-size:15px;font-weight:400;color:var(--muted)">≈ ${fmt0(tt.mintCostEth, 4)} ETH to mint</span></div>
           <p>Across ${tt.deckCount} deck${tt.deckCount === 1 ? '' : 's'}, this wallet can still mint ${fmt0(tt.unexercisedAllowance)} fresh PXL at 0.000001&nbsp;ETH each — a standing call option on PXL at the primary rate, exercisable only by the deck owner. Most holders never notice it.</p>`;
        $('pbHook').style.display = 'block';
      } else if (has) {
        $('pbHook').innerHTML =
          `<div class="kicker" style="color:var(--muted)">Mint allowance</div>
           <div class="big" style="color:var(--body)">Fully exercised</div>
           <p>This wallet's decks have no remaining mint allowance — the 0.000001&nbsp;ETH primary mints have already been used.</p>`;
        $('pbHook').style.display = 'block';
      } else {
        $('pbHook').style.display = 'none';
      }
      $('pbTotals').innerHTML = has ? [
        ['Decks', fmt0(tt.deckCount)],
        ['Pods', fmt0(tt.podCount)],
        ['Attached PXL', fmt0(tt.attachedPxl)],
        ['Attached value', fmt0(tt.attachedValueEth, 4) + ' ETH'],
        tt.unexercisedAllowance > 0 ? ['Unexercised allowance', `<span class="gold">${fmt0(tt.unexercisedAllowance)} PXL</span>`] : null,
      ].filter(Boolean).map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('') : '';
      if (j.decks.length) {
        $('pbDeckBody').innerHTML = j.decks.map(x => `<tr>
          <td class="mono">#${x.id}</td>
          <td class="num">${fmt0(x.attached)}</td>
          <td class="num dim">${x.rank ? ('#' + x.rank + ' / 256') : '—'}</td>
          <td class="num ${x.allowance > 0 ? 'gold' : 'dim'}">${fmt0(x.allowance)}${x.allowance === 500000 ? ' · intact' : ''}</td>
          <td class="num dim">${x.allowance > 0 ? fmt0(x.allowance * tt.pixelPriceEth, 4) + ' ETH' : '—'}</td>
        </tr>`).join('');
        $('pbDeckHdr').style.display = ''; $('pbDeckWrap').style.display = '';
      } else { $('pbDeckHdr').style.display = 'none'; $('pbDeckWrap').style.display = 'none'; }
      if (j.pods.length) {
        $('pbPodBody').innerHTML = j.pods.map(x => `<tr>
          <td class="mono">#${x.id}</td>
          <td class="num">${fmt0(x.attached)}</td>
          <td class="num dim">${x.rank ? ('#' + x.rank + ' / 256') : '—'}</td>
          <td class="num dim">${fmt0(x.attached * tt.pixelPriceEth, 4)} ETH</td>
        </tr>`).join('');
        $('pbPodHdr').style.display = ''; $('pbPodWrap').style.display = '';
      } else { $('pbPodHdr').style.display = 'none'; $('pbPodWrap').style.display = 'none'; }
      const who = j.ens ? esc(j.ens) : short(j.address);
      $('pbCtx').innerHTML = has
        ? `<b>${who}</b> holds ${fmt0(tt.attachedPxl)} PXL across ${tt.deckCount} deck${tt.deckCount === 1 ? '' : 's'} and ${tt.podCount} pod${tt.podCount === 1 ? '' : 's'}`
          + (tt.unexercisedAllowance > 0 ? `, plus ${fmt0(tt.unexercisedAllowance)} PXL of unexercised mint allowance.` : '.')
          + ` <a href="https://etherscan.io/address/${esc(j.address)}" target="_blank" rel="noopener">View on Etherscan →</a>`
        : `<b>${who}</b> holds no PXL decks or pods. Try another address — every deck and pod above is on-chain and enumerable.`;
      results.style.display = 'block';
    }

    async function lookup(raw) {
      const v = String(raw || '').trim();
      if (!v) return;
      btn.disabled = true; results.style.display = 'none';
      setStatus('Reading ' + (v.length > 24 ? short(v) : v) + ' from Ethereum — enumerating 512 tokens…');
      try { history.replaceState(null, '', location.pathname + '?wallet=' + encodeURIComponent(v) + '#book'); } catch (e) { }
      try {
        const r = await fetch('/api/pxl-book?wallet=' + encodeURIComponent(v));
        const j = await r.json();
        if (!r.ok) {
          const map = { missing_wallet: 'Enter an address or ENS name.', bad_wallet: 'That doesn\'t look like an address or ENS name.',
            ens_not_found: 'That ENS name doesn\'t resolve to an address.', resolve_failed: 'Couldn\'t resolve that name.',
            rate_limited: 'Too many lookups from here — give it a minute.', chain_read_failed: 'Chain read failed — try again.',
            snapshot_unavailable: 'Ranking data is briefly unavailable — try again.' };
          setStatus(map[j.error] || ('Lookup failed: ' + (j.error || r.status)), true);
          return;
        }
        setStatus('');
        render(j);
      } catch (e) {
        setStatus('Network error — try again.', true);
      } finally {
        btn.disabled = false;
      }
    }

    pbForm.addEventListener('submit', e => { e.preventDefault(); lookup(input.value); });

    const q = new URLSearchParams(location.search).get('wallet');
    if (q) {
      input.value = q;
      document.getElementById('book').scrollIntoView();
      lookup(q);
    } else if (location.hash === '#book') {
      document.getElementById('book').scrollIntoView();
      input.focus();
    }
  }

  // --- feedback / wishlist (only rendered when the record has d.feedback) ---
  const fbForm = document.getElementById('fbForm');
  if (fbForm) {
    const msg = document.getElementById('fbMsg'), contact = document.getElementById('fbContact');
    const hp = document.getElementById('fbHp'), go = document.getElementById('fbGo'), st = document.getElementById('fbStatus');
    const say = (m, isErr) => { st.textContent = m || ''; st.className = 'pb-status' + (isErr ? ' error' : ''); };
    fbForm.addEventListener('submit', async e => {
      e.preventDefault();
      const text = msg.value.trim();
      if (text.length < 3) { say('Write a line or two first.', true); return; }
      go.disabled = true; say('Sending…');
      try {
        const r = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: SLUG, message: text, contact: contact.value.trim(), website: hp.value }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          say(j.error === 'rate_limited' ? 'Too many notes from here — try again in a bit.' : 'Couldn\'t send — try again.', true);
          return;
        }
        msg.value = ''; contact.value = '';
        say('Received — thank you. The desk reads every note.');
      } catch (err) {
        say('Network error — try again.', true);
      } finally {
        go.disabled = false;
      }
    });
  }
})();

/* DENZA · Kim Asendorf TERMINAL — the whole record on one screen.
   Same data file as /kim (/market/asendorf.json); DESIGN.md tokens; dark by default
   (it's a terminal), toggle + ?theme= override shared with the record pages. */
(async function () {
  // Terminal defaults dark; an explicit stored/query choice wins.
  const theme = (() => {
    const q = new URLSearchParams(location.search).get("theme");
    if (q === "dark" || q === "light") return q;
    try { return localStorage.getItem("denza-theme") || "dark"; } catch { return "dark"; }
  })();
  if (theme === "dark") document.documentElement.dataset.theme = "dark";

  const css = `
    :root{--bg:#FAFAF8;--wash:#F1F1EC;--hairline:#DDDDD8;--ink:#111111;--body:#3D3D3A;--muted:#6B6B6B;--faint:#9A9A96;--accent:#B4472B;--green:#1F7A4D;--mono:ui-monospace,'SF Mono',Menlo,monospace;--sans:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif}
    :root[data-theme=dark]{--bg:#101010;--wash:#1C1C1A;--hairline:#2C2C29;--ink:#F0F0EC;--body:#B8B8B1;--muted:#8B8B84;--faint:#63635C;--accent:#D0603F;--green:#3FA36F}
    *{box-sizing:border-box;margin:0;padding:0;border-radius:0}
    html,body{height:100%}
    body{background:var(--bg);color:var(--ink);font-family:var(--mono);font-size:12px;line-height:1.45;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
    a{color:inherit;text-decoration:underline;text-decoration-color:var(--hairline);text-underline-offset:2px}
    a:hover{text-decoration-color:var(--ink)}
    .term{display:flex;flex-direction:column;min-height:100vh;padding:0 20px}
    .t-nav{display:flex;align-items:baseline;gap:14px;padding:12px 0;border-bottom:1px solid var(--ink);flex-wrap:wrap}
    .t-nav .brand{font-weight:700;letter-spacing:.14em}
    .t-nav .title{color:var(--body)}
    .t-nav .spacer{flex:1}
    .t-nav .dim{color:var(--muted)}
    .t-nav button{background:none;border:0;font:inherit;color:var(--muted);cursor:pointer;text-transform:lowercase}
    .t-nav button:hover{color:var(--ink)}
    .strip{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));column-gap:18px;padding:12px 0 14px;border-bottom:1px solid var(--hairline)}
    .strip span{display:block;font-size:10px;color:var(--muted);text-transform:lowercase;letter-spacing:.04em;margin-bottom:3px}
    .strip b{font-size:16px;font-weight:600;white-space:nowrap}
    .main{flex:1;display:grid;grid-template-columns:minmax(0,58fr) minmax(0,42fr);column-gap:32px;padding:14px 0;min-height:0}
    .col{min-width:0}
    h2{font-size:10px;font-weight:400;color:var(--muted);text-transform:lowercase;letter-spacing:.06em;margin-bottom:8px}
    table{width:100%;border-collapse:collapse}
    th{font-size:10px;font-weight:400;color:var(--muted);text-transform:lowercase;letter-spacing:.04em;text-align:left;padding:4px 10px 5px 0;border-bottom:1px solid var(--ink)}
    td{padding:7px 10px 7px 0;border-bottom:1px solid var(--hairline);vertical-align:baseline;white-space:nowrap}
    td.n,th.n{text-align:right}
    td .sub{font-size:10px;color:var(--faint)}
    .nm{font-family:var(--sans);font-weight:600;font-size:12.5px}
    .fl{color:var(--faint);font-size:10px}
    .gold{color:var(--accent)}.green{color:var(--green)}.dim{color:var(--faint)}
    .ckgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:18px;border-top:1px solid var(--ink)}
    .ck{padding:8px 0 9px;border-bottom:1px solid var(--hairline)}
    .ck span{display:block;font-size:10px;color:var(--muted);text-transform:lowercase;letter-spacing:.04em;margin-bottom:2px}
    .ck b{font-size:15px;font-weight:600;white-space:nowrap}
    .bar{margin-top:14px}
    .bar .track{height:12px;position:relative;background:var(--wash);margin:5px 0 7px}
    .bar .seg{position:absolute;top:0;bottom:0}
    .legend{display:flex;flex-direction:column;gap:2px;font-size:10.5px;color:var(--muted)}
    .legend i{display:inline-block;width:8px;height:8px;margin-right:6px;vertical-align:0}
    .flows{margin-top:16px}
    .frow{display:grid;grid-template-columns:86px 1fr 118px;gap:10px;align-items:center;margin:4px 0;font-size:10.5px}
    .frow .track{height:9px;position:relative;background:var(--wash)}
    .frow .seg{position:absolute;top:0;bottom:0}
    .frow .v{text-align:right;white-space:nowrap}
    .foot{padding:10px 0 14px;border-top:1px solid var(--hairline);color:var(--muted);font-size:10.5px;display:flex;gap:18px;flex-wrap:wrap}
    .foot .spacer{flex:1}
    @media(max-width:1000px){
      .main{grid-template-columns:1fr}
      .strip{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:10px}
      .term{height:auto}
      td,th{white-space:normal}
    }
    .err{padding:60px 20px;text-align:center;color:var(--muted)}
  `;
  document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);
  const root = document.getElementById("term");

  let d;
  try {
    const res = await fetch("/market/asendorf.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    d = await res.json();
  } catch (e) {
    root.innerHTML = `<div class="err">Terminal unavailable (${e.message}).</div>`;
    return;
  }

  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (n, dp = 1) => n == null ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: dp });
  const m = n => n == null ? "—" : (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : fmt(n, 0));

  const eth = d.collections.filter(c => c.chain === "Ethereum");
  const totSecondary = eth.reduce((s, c) => s + (c.secondary_volume?.value || 0), 0);
  const totPrimary = eth.reduce((s, c) => s + (c.primary?.proceeds || 0), 0);
  const totHolders = d.collections.reduce((s, c) => s + (c.holders || 0), 0);
  const t = d.token || {};
  const lockedTotal = (t.locked || []).reduce((s, l) => s + (l.amount || 0), 0);

  const rows = d.collections.map(c => {
    const g = c.gondi || {};
    const gcell = !g.listed ? '<span class="dim">—</span>' : g.best ? `<span class="green">${esc(g.best)}</span>` : '<span class="dim">0 offers</span>';
    const flag = (c.flags || []).length ? " ‡" : "";
    const floor = c.floor ? `${fmt(c.floor.value, 2)} ${esc(c.floor.currency)}` : "—";
    return `<tr>
      <td><span class="nm"><a href="${esc(c.url || "#")}" target="_blank" rel="noopener">${esc(c.name)}</a></span><span class="fl">${flag}</span><br><span class="sub">${esc(c.chain)} · ${fmt(c.supply, 0)} supply · ${fmt(c.holders, 0)} holders · ${esc(c.mint)}</span></td>
      <td class="n">${floor}</td>
      <td class="n">${fmt(c.secondary_volume?.value)} ${esc(c.secondary_volume?.currency || "")}</td>
      <td class="n">${c.primary ? fmt(c.primary.proceeds, 2) : '<span class="dim">—</span>'}</td>
      <td class="n">${c.volume_30d == null ? "—" : fmt(c.volume_30d, 2)}</td>
      <td class="n">${gcell}</td>
    </tr>`;
  }).join("");

  // PXL supply segments
  const segs = [
    ...(t.locked || []).map((l, i) => ({ label: l.label, v: l.amount, color: i === 0 ? "var(--ink)" : "#55554F" })),
    { label: "Free float (loose in wallets)", v: t.free_float || 0, color: "var(--accent)" },
  ];
  let x = 0;
  const segHtml = segs.map(s => {
    const w = (s.v / (t.total_supply || 1) * 100).toFixed(2); const left = x; x += +w;
    return `<div class="seg" style="left:${left}%;width:${w}%;background:${s.color}"></div>`;
  }).join("");

  // Money-flow mini bars (top ETH collections by total flow)
  const maxFlow = Math.max(...eth.map(c => (c.secondary_volume?.value || 0) + (c.primary?.proceeds || 0)));
  const flows = eth.slice().sort((a, b) => ((b.secondary_volume?.value || 0) + (b.primary?.proceeds || 0)) - ((a.secondary_volume?.value || 0) + (a.primary?.proceeds || 0)))
    .slice(0, 6).map(c => {
      const sec = c.secondary_volume?.value || 0, pri = c.primary?.proceeds || 0;
      const w = v => Math.max(v / maxFlow * 100, v > 0 ? 0.5 : 0);
      return `<div class="frow"><div>${esc(c.name)}</div>
        <div class="track"><div class="seg" style="left:0;width:${w(sec)}%;background:var(--ink)"></div>${pri ? `<div class="seg" style="left:${w(sec)}%;width:${w(pri)}%;background:var(--accent)"></div>` : ""}</div>
        <div class="v">${fmt(sec + pri)}${pri ? ` <span class="dim">(${fmt(pri)}✓)</span>` : ""}</div></div>`;
    }).join("");

  const podFlag = (d.collections.find(c => c.name === "PXL POD")?.flags || [])[0] || "";

  root.innerHTML = `<div class="term">
    <div class="t-nav">
      <span class="brand">DENZA</span>
      <span class="title">KIM ASENDORF — TERMINAL</span>
      <span class="dim">snapshot ${esc(d.snapshot)} · ETH $${fmt(d.fx?.eth_usd, 0)}</span>
      <span class="spacer"></span>
      <a href="/kim">full record</a>
      <button type="button" id="dnTheme">${theme === "dark" ? "light" : "dark"}</button>
    </div>
    <div class="strip">
      <div><span>collections</span><b>${d.collections.length}</b></div>
      <div><span>tokens</span><b>${fmt(d.collections.reduce((s, c) => s + c.supply, 0), 0)}</b></div>
      <div><span>holders (gross)</span><b>${fmt(totHolders, 0)}</b></div>
      <div><span>eth secondary</span><b>${fmt(totSecondary, 0)} ETH</b></div>
      <div><span>verified primary</span><b>${fmt(totPrimary, 2)} ETH</b></div>
      <div><span>pxl minted</span><b>${m(t.total_supply)}</b></div>
      <div><span>locked in the art</span><b>${t.total_supply ? (lockedTotal / t.total_supply * 100).toFixed(1) : "—"}%</b></div>
    </div>
    <div class="main">
      <div class="col">
        <h2>collections</h2>
        <table>
          <thead><tr><th>collection</th><th class="n">floor</th><th class="n">secondary</th><th class="n">primary ✓</th><th class="n">30d</th><th class="n">gondi</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="col">
        <h2>pxl — the token under the works</h2>
        <div class="ckgrid">
          <div class="ck"><span>contract</span><b><a href="https://etherscan.io/token/${esc(t.contract)}" target="_blank" rel="noopener">${esc((t.contract || "").slice(0, 6))}…${esc((t.contract || "").slice(-4))}</a></b></div>
          <div class="ck"><span>hard cap</span><b>${m(t.cap)}</b></div>
          <div class="ck"><span>minted</span><b>${m(t.total_supply)}</b></div>
          <div class="ck"><span>free float</span><b>${m(t.free_float)}</b></div>
          <div class="ck"><span>deck mint price</span><b>${t.mint_price_eth} ETH</b></div>
          <div class="ck"><span>unminted allowance</span><b>${m(t.deck_allowance_remaining)}</b></div>
        </div>
        <div class="bar">
          <h2>minted supply</h2>
          <div class="track">${segHtml}</div>
          <div class="legend">${segs.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)} · ${m(s.v)}</span>`).join("")}</div>
        </div>
        <div class="flows">
          <h2>money flow — secondary + <span class="gold">verified primary ✓</span> (ETH)</h2>
          ${flows}
        </div>
      </div>
    </div>
    <div class="foot">
      <span>‡ ${esc(podFlag)}</span>
      <span class="spacer"></span>
      <span>data: <a href="/market/asendorf.json">denza.studio/market/asendorf.json</a> · assembled by DENZA · not investment advice</span>
    </div>
  </div>`;

  document.title = `${d.artist} — Terminal · ${d.publisher}`;
  const themeBtn = document.getElementById("dnTheme");
  themeBtn.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    if (dark) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    themeBtn.textContent = dark ? "dark" : "light";
    try { localStorage.setItem("denza-theme", dark ? "light" : "dark"); } catch { /* private mode */ }
  });
})();

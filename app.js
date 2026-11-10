// Binokels Appkarta. All text kommer från data/appar.json; kartans placering står här nedan.
(async function () {
  const S = { drift: ["I drift", "s-drift"], pilot: ["Pilot", "s-pilot"], bygg: ["Byggs", "s-bygg"], byggs: ["Byggs", "s-bygg"], avveckl: ["Avvecklas", "s-avveckl"] };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ic = (f) => "icons/" + encodeURIComponent(f);
  const $ = (id) => document.getElementById(id);

  let D;
  try {
    const r = await fetch("data/appar.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    D = await r.json();
  } catch (e) {
    document.querySelector("main .wrap").insertAdjacentHTML("afterbegin",
      '<div class="card err">Kartan kunde inte läsa data/appar.json. Ladda om sidan. Finns felet kvar: kontrollera filen i GitHub.</div>');
    return;
  }
  const APPS = D.appar;
  const byId = Object.fromEntries(APPS.map((a) => [a.id, a]));
  const SHORT = { kunduppfoljning: "Uppföljning", formatning: "Förmätning", personal: "Personalappen", hemsidan: "Hemsidan", motorer: "Motorerna", nyckelvalvet: "Nyckelvalvet", academy: "Academy", insikt: "Insikt", bestallning: "Beställning", anamnes: "Anamnes" };
  const short = (a) => SHORT[a.id] || a.namn;

  $("updated").textContent = "Alla appar på en bild · uppdaterad " + D.uppdaterad;
  $("sources").textContent = "Källor: " + D.kallor + ".";

  // ---------- Kartan (SVG) ----------
  // Tre kolumner i en 360 bred ritning, så att den går att läsa på mobilen.
  const W = 360, BW = 100, BH = 74, X = [10, 130, 250];
  const P = {
    hemsidan: [0, 70], anamnes: [1, 70], formatning: [2, 70],
    serveit: [1, 190],
    saljstod: [1, 310],
    glasflow: [1, 430], spargris: [2, 430],
    synpunkten: [0, 550], kunduppfoljning: [1, 550],
    personal: [1, 720], fortnox: [2, 720],
    academy: [0, 840], bestallning: [1, 840], insikt: [2, 840],
    blueprint: [0, 1010], nyckelvalvet: [2, 1010],
  };
  const box = (id) => { const [c, y] = P[id]; return { x: X[c], y, cx: X[c] + BW / 2, cy: y + BH / 2 }; };
  const EDGES = [
    ["anamnes", "serveit", "man"], ["formatning", "serveit", "man"],
    ["serveit", "saljstod", "man"], ["saljstod", "glasflow", "man"],
    ["hemsidan", "glasflow", "auto"], ["glasflow", "spargris", "auto"],
    ["glasflow", "kunduppfoljning", "auto"], ["glasflow", "synpunkten", "auto"],
    ["personal", "academy", "who"], ["personal", "bestallning", "who"], ["personal", "insikt", "who"],
    ["fortnox", "personal", "auto"], ["fortnox", "insikt", "auto"],
  ];
  function edgePath(a, b) {
    const A = box(a), B = box(b);
    if (a === "hemsidan") return `M${A.cx} ${A.y + BH} V${B.cy} H${B.x - 4}`; // ner längs vänsterkanten
    if (a === "fortnox" && b === "insikt") return `M${A.cx} ${A.y + BH} V${B.y - 4}`;
    if (A.y === B.y) return A.x < B.x ? `M${A.x + BW} ${A.cy} H${B.x - 4}` : `M${A.x} ${A.cy} H${B.x + BW + 4}`;
    if (A.x === B.x) return `M${A.cx} ${A.y + BH} V${B.y - 4}`;
    const midY = (A.y + BH + B.y) / 2;
    return `M${A.cx} ${A.y + BH} V${midY} H${B.cx} V${B.y - 4}`;
  }
  const NS = "http://www.w3.org/2000/svg";
  const H = 1160;
  const map = $("map");
  map.setAttribute("viewBox", `0 0 ${W} ${H}`);
  let svg = `<defs>
    <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker>
    <marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ahw"/></marker>
  </defs>`;
  const band = (y, h, label) => `<rect x="2" y="${y}" width="${W - 4}" height="${h}" rx="18" class="band"/><text x="16" y="${y + 24}" class="band-t">${label}</text>`;
  svg += band(30, 610, "KUNDENS RESA") + band(680, 250, "PERSONAL OCH LEDNING") + band(970, 180, "BAKOM KULISSERNA");
  for (const [a, b, kind] of EDGES) svg += `<path d="${edgePath(a, b)}" class="e e-${kind}" marker-end="url(#${kind === "who" ? "arw" : "ar"})"/>`;
  svg += `<text x="${X[1] + BW / 2 + 6}" y="812" class="elabel">vem är du?</text>`;
  svg += `<text x="${X[2] + BW / 2}" y="926" class="ns" text-anchor="middle">+ siffror från alla appar</text>`;
  const node = (id) => {
    const { x, y } = box(id);
    if (id === "serveit" || id === "fortnox") {
      const name = id === "serveit" ? "ServeIT" : "Fortnox", sub = id === "serveit" ? "journal och kassa" : "lön och bokföring";
      return `<g class="node ext"><rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="16"/><text x="${x + BW / 2}" y="${y + 33}" text-anchor="middle" class="nt">${name}</text><text x="${x + BW / 2}" y="${y + 51}" text-anchor="middle" class="ns">${sub}</text><text x="${x + BW / 2}" y="${y + 65}" text-anchor="middle" class="ns">externt</text></g>`;
    }
    const a = byId[id]; if (!a) return "";
    return `<g class="node" tabindex="0" role="button" data-id="${id}" aria-label="${esc(a.namn)}"><rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="16"/><image href="${ic(a.ikon)}" x="${x + BW / 2 - 18}" y="${y + 8}" width="36" height="36"/><text x="${x + BW / 2}" y="${y + 62}" text-anchor="middle" class="nt">${esc(short(a))}</text></g>`;
  };
  svg += Object.keys(P).map(node).join("");
  // Motorerna är inga appar utan AI-agenter som kör av sig själva: en rad, ingen ruta.
  if (byId.motorer) svg += `<g class="node row" tabindex="0" role="button" data-id="motorer" aria-label="Motorerna"><rect x="10" y="1098" width="340" height="40" rx="12"/><image href="${ic(byId.motorer.ikon)}" x="20" y="1104" width="28" height="28"/><text x="58" y="1123" class="nt">Motorerna</text><text x="128" y="1123" class="ns">AI som kör av sig själv på natten</text></g>`;
  map.innerHTML = svg;
  map.addEventListener("click", (e) => { const g = e.target.closest(".node[data-id]"); if (g) openApp(g.dataset.id); });
  map.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.id) { e.preventDefault(); openApp(e.target.dataset.id); } });

  // ---------- Varför ----------
  $("why").innerHTML = APPS.filter((a) => a.id !== "motorer").map((a) =>
    `<button type="button" class="why" data-id="${esc(a.id)}"><img src="${ic(a.ikon)}" alt=""><span><b>${esc(a.namn)}</b>${esc(a.varfor_kort)}</span></button>`).join("");
  if (byId.motorer) $("why").insertAdjacentHTML("afterend", `<p class="small motor-note"><b>Motorerna</b> är inga appar utan AI-agenter som kör av sig själva: Nattmotorn kontrollerar drift, säkerhet och kod, Kunskapsmotorn bygger kunskapsbanken, Timagenten sorterar inkorgen och Agent Core håller ordning på vem som gör vad.</p>`);
  $("why").addEventListener("click", (e) => { const t = e.target.closest("[data-id]"); if (t) openApp(t.dataset.id); });

  // ---------- Hjälp-knappen: vilka appar ----------
  const h = D.gemensamt.find((g) => g.namn.startsWith("niemis-hjalp"));
  if (h) {
    const u = (id, vag) => { const a = byId[id]; return a ? `<div class="u${vag ? " vag" : ""}"><img src="${ic(a.ikon)}" alt=""><span>${esc(short(a))}</span></div>` : ""; };
    $("rollout").innerHTML = `<div class="key"><span><i></i>har knappen</span><span><i class="vag"></i>på väg</span></div><div class="users">${h.har.map((id) => u(id, false)).join("")}${h.pa_vag.map((id) => u(id, true)).join("")}</div>`;
  }

  // ---------- Stilen ----------
  $("iconwall").innerHTML = APPS.filter((a) => a.id !== "motorer").map((a) => `<div><img src="${ic(a.ikon)}" alt=""><span>${esc(short(a))}</span></div>`).join("");

  // ---------- Detaljbladet ----------
  const sheet = $("sheet"), panel = $("panel");
  let lastFocus = null;
  function openApp(id) {
    const a = byId[id]; if (!a) return;
    lastFocus = document.activeElement;
    const chips = (list) => list.map(([n, w, m]) => `<span class="chip${m ? " m" : ""}">${esc(n)} · ${esc(w)}</span>`).join("");
    panel.innerHTML = `<div class="head"><img src="${ic(a.ikon)}" alt=""><div><h2 id="dTitle">${esc(a.namn)}</h2><span class="pill ${S[a.status][1]}">${S[a.status][0]}</span></div><button type="button" class="close" id="closeBtn">Stäng</button></div>
      <p class="why-big">${esc(a.varfor_kort)}</p>
      <p>${esc(a.gor)}</p>
      ${a.kopplingar.length ? `<h3>Hänger ihop med</h3><div class="chips">${chips(a.kopplingar)}</div>` : ""}
      ${a.pagar.length ? `<h3>Pågår</h3><ul class="plain">${a.pagar.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${a.frusen ? `<p class="frozen"><b>Frysta delar.</b> Nattmotorn får inte ändras: sync-legacy, process-jobs, enqueue-daily-jobs, expire-dormant, activate-due-rechecks, cron, insikt_kund_aggregat, create_store_snapshot och feedback_status_guard.</p>` : ""}
      <details class="tech"><summary>Teknik</summary><dl>
        <dt>Används av</dt><dd>${esc(a.anvands_av)}</dd>
        <dt>Inloggning</dt><dd>${esc(a.inloggning)}</dd>
        <dt>Databas</dt><dd>${esc(a.databas)}</dd>
        <dt>Kod</dt><dd>${a.repo ? `<code>Binokel-AB/${esc(a.repo)}</code>` : "Inget eget repo"}</dd>
        ${a.adress ? `<dt>Adress</dt><dd><a href="https://${esc(a.adress)}" target="_blank" rel="noopener">${esc(a.adress)}</a></dd>` : ""}
      </dl></details>`;
    sheet.hidden = false;
    $("closeBtn").focus();
  }
  function closeSheet() { sheet.hidden = true; if (lastFocus) lastFocus.focus(); }
  sheet.addEventListener("click", (e) => { if (e.target === sheet || e.target.id === "closeBtn") closeSheet(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });
})();

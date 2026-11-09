// Binokels Appkarta – all text kommer från data/appar.json. Ingen byggprocess behövs.
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
      '<div class="card err">Sidan kunde inte läsa data/appar.json. Ladda om sidan. Om felet finns kvar: kontrollera att filen är giltig JSON i GitHub.</div>');
    return;
  }
  const APPS = D.appar;
  const byId = Object.fromEntries(APPS.map((a) => [a.id, a]));

  $("updated").textContent = "Uppdaterad " + D.uppdaterad + " · alla appar, hur de hänger ihop och varför de finns";
  $("sources").textContent = "Källor: " + D.kallor + ". Senast uppdaterad " + D.uppdaterad + ".";

  // Start
  const live = APPS.filter((a) => a.status === "drift").length;
  $("facts").innerHTML = [
    [APPS.length, "egna appar och motorer"],
    [live, "i drift"],
    [D.gemensamt.length, "gemensamma delar"],
    [D.externa.length, "externa system"],
  ].map(([n, t]) => `<div class="fact"><b>${n}</b><span>${esc(t)}</span></div>`).join("");

  // Appar
  const grid = $("grid");
  function drawGrid(f) {
    if (f === "ext") {
      grid.innerHTML = D.externa.map(([n, w]) =>
        `<div class="tile" style="cursor:default"><h3>${esc(n)}</h3><p>${esc(w)}</p><span class="pill s-ext">Externt</span></div>`).join("");
      return;
    }
    grid.innerHTML = APPS.filter((a) => f === "alla" || a.grupp === f).map((a) =>
      `<button type="button" class="tile" data-id="${esc(a.id)}"><img src="${ic(a.ikon)}" alt=""><h3>${esc(a.namn)}</h3><p>${esc(a.kort)}</p><span class="pill ${S[a.status][1]}">${S[a.status][0]}</span></button>`).join("");
  }
  document.querySelectorAll(".filters button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    drawGrid(b.dataset.f);
  }));
  grid.addEventListener("click", (e) => { const t = e.target.closest(".tile[data-id]"); if (t) openApp(t.dataset.id); });

  const sheet = $("sheet"), panel = $("panel");
  let lastFocus = null;
  function sharedFor(id) {
    return D.gemensamt.filter((g) => g.har.includes(id) || g.pa_vag.includes(id))
      .map((g) => `<span class="chip${g.pa_vag.includes(id) ? " m" : ""}">${esc(g.namn)}${g.pa_vag.includes(id) ? " · på väg" : ""}</span>`).join("");
  }
  function openApp(id) {
    const a = byId[id]; if (!a) return;
    lastFocus = document.activeElement;
    const fact = (k, v) => (v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : "");
    const shared = sharedFor(id);
    panel.innerHTML = `<div class="head"><img src="${ic(a.ikon)}" alt=""><div><h2 id="dTitle">${esc(a.namn)}</h2><div style="color:var(--muted);font-size:.9rem">${a.aka ? esc(a.aka) + " · " : ""}<span class="${S[a.status][1]}" style="font-weight:700">${S[a.status][0]}</span></div></div><button type="button" class="close" id="closeBtn">Stäng</button></div>
      <dl class="facts">
        ${fact("Vad den gör", esc(a.gor))}${fact("Varför den finns", esc(a.varfor))}${fact("Vem använder den", esc(a.anvands_av))}${fact("Inloggning", esc(a.inloggning))}
        ${fact("Kopplingar", a.kopplingar.length ? `<div class="chips">${a.kopplingar.map(([n, w, m]) => `<span class="chip${m ? " m" : ""}">${esc(n)} · ${esc(w)}${m ? " (manuellt)" : ""}</span>`).join("")}</div>` : "")}
        ${fact("Gemensamma delar", shared ? `<div class="chips">${shared}</div>` : "")}
        ${fact("Databas", esc(a.databas))}
        ${fact("Kod", a.repo ? `<code>Binokel-AB/${esc(a.repo)}</code>` : "Inget eget repo")}
        ${fact("Adress", a.adress ? `<a href="https://${esc(a.adress)}" target="_blank" rel="noopener">${esc(a.adress)}</a>` : "")}
        ${fact("Pågår", a.pagar.length ? `<ul class="plain">${a.pagar.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : "")}
      </dl>
      ${a.frusen ? `<p class="frozen" style="margin-top:16px"><b>Frysta delar.</b> Nattmotorn i den här appen får inte ändras: sync-legacy, process-jobs, enqueue-daily-jobs, expire-dormant, activate-due-rechecks, cron, insikt_kund_aggregat, create_store_snapshot och feedback_status_guard.</p>` : ""}`;
    sheet.hidden = false;
    $("closeBtn").focus();
  }
  function closeSheet() { sheet.hidden = true; if (lastFocus) lastFocus.focus(); }
  sheet.addEventListener("click", (e) => { if (e.target === sheet || e.target.id === "closeBtn") closeSheet(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });

  // Gemensamt
  const SHORT = { kunduppfoljning: "Uppföljning", formatning: "Förmätning", personal: "Personal", hemsidan: "Hemsidan", bagar: "Bågar", navigator: "Navigator", motorer: "Motorer", nyckelvalvet: "Nycklar" };
  const short = (a) => SHORT[a.id] || a.namn.replace("Niemis ", "").replace("Binokel ", "");
  const user = (id, vag) => { const a = byId[id]; if (!a) return ""; return `<div class="u${vag ? " vag" : ""}"><img src="${ic(a.ikon)}" alt=""><span>${esc(short(a))}</span></div>`; };
  $("shared").innerHTML = D.gemensamt.map((g) => `
    <div class="card part">
      <div class="part-head"><h3>${esc(g.namn)}</h3><span class="pill ${S[g.lage][1]}">${S[g.lage][0]}</span></div>
      <p>${esc(g.vad)}</p>
      <div class="owner">Ägs av <b>${esc(g.agare)}</b></div>
      <div class="users">${g.har.map((id) => user(id, false)).join("")}${g.pa_vag.map((id) => user(id, true)).join("")}</div>
      ${g.not ? `<div class="note">${esc(g.not)}</div>` : ""}
    </div>`).join("");
  const cols = APPS.filter((a) => D.gemensamt.some((g) => g.har.includes(a.id) || g.pa_vag.includes(a.id)));
  $("matrix").innerHTML = `<thead><tr><th>Del</th>${cols.map((a) => `<th scope="col">${esc(short(a))}</th>`).join("")}</tr></thead><tbody>` +
    D.gemensamt.map((g) => `<tr><td>${esc(g.namn.split(":")[0].split(" där")[0])}</td>${cols.map((a) =>
      g.har.includes(a.id) ? '<td class="y" aria-label="finns">✓</td>' : g.pa_vag.includes(a.id) ? '<td class="v" aria-label="på väg">…</td>' : '<td class="n" aria-label="nej">–</td>').join("")}</tr>`).join("") + "</tbody>";

  // Flödet
  $("journey").innerHTML = D.resan.map(([i, lab, n, t, l, man]) => `
    <div class="step"><img src="${ic(i)}" alt=""><div class="body"><div class="eyebrow">${esc(lab)}</div><h3>${esc(n)}</h3><p>${esc(t)}</p></div></div>
    ${l ? `<div class="link"><span class="${man ? "man" : ""}"></span><small>${esc(l)}</small></div>` : ""}`).join("");
  $("ext").innerHTML = D.externa.map(([n, w]) => `<span class="chip"><b>${esc(n)}</b> · ${esc(w)}</span>`).join("");

  // Planer
  $("plans").innerHTML = D.planer.map(([t, m]) => `<div class="plan"><span class="t">${esc(t)}</span><span class="m">${esc(m)}</span></div>`).join("");

  // Ikoner
  $("gf").innerHTML = D.glasflow_forslag.map(([f, t, d, r]) =>
    `<figure class="${r ? "rec" : ""}"><img src="${ic(f)}" alt="${esc(t)}"><figcaption><b>${esc(t)}${r ? " (rekommenderas)" : ""}</b>${esc(d)}</figcaption></figure>`).join("");
  $("cmp").innerHTML = D.ikonbyten.map(([o, n, l]) =>
    `<div class="pair"><div class="imgs"><img src="${ic(o)}" alt="Idag"><span class="arrow">→</span><img src="${ic(n)}" alt="Ny"></div>${esc(l)}</div>`).join("");
  $("home").innerHTML = APPS.filter((a) => ["drift", "pilot", "bygg"].includes(a.status)).slice(0, 12)
    .map((a) => `<div><img src="${ic(a.ikon)}" alt=""><span>${esc(short(a))}</span></div>`).join("");

  // Flikar via #adress
  const VIEWS = ["start", "appar", "gemensamt", "flodet", "planer", "ikoner", "ta-over"];
  function route() {
    const v = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "start";
    document.querySelectorAll("section[data-view]").forEach((s) => { s.hidden = s.dataset.view !== v; });
    document.querySelectorAll("nav.tabs a").forEach((a) => {
      if (a.getAttribute("href") === "#" + v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }
  addEventListener("hashchange", () => { if (!sheet.hidden) closeSheet(); route(); scrollTo(0, 0); });
  drawGrid("alla");
  route();
})();

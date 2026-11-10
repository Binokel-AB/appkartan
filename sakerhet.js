// "Byggd och skyddad": en översikt (en rad per app) och en sida per app (sakerhet.html?app=<id>).
// Fakta om skyddet står i data/sakerhet.json, allt annat om appen i data/appar.json.
(async function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const main = document.getElementById("sMain");
  let D, S;
  try {
    const [a, b] = await Promise.all(["data/appar.json", "data/sakerhet.json"].map((u) => fetch(u, { cache: "no-cache" })));
    if (!a.ok || !b.ok) throw new Error("läsfel");
    D = await a.json(); S = await b.json();
  } catch (e) {
    main.innerHTML = '<div class="card err">Sidan kunde inte läsa uppgifterna. Ladda om sidan.</div>';
    return;
  }
  const ST = { drift: "I drift", pilot: "Pilot", bygg: "Byggs", byggs: "Byggs", avveckl: "Avvecklas" };
  const LAGE = { ok: ["Bra", "ok"], atgard: ["Ska åtgärdas", "warn"], risk: ["Risk", "bad"], ej: ["Ej kontrollerat", "ej"] };
  const FARG = { gron: ["Grön", "ok", "Allt som är kontrollerat är bra"], gul: ["Gul", "warn", "Något ska åtgärdas eller är inte kontrollerat"], rod: ["Röd", "bad", "Känd risk som ska rättas nu"] };
  // Färgen räknas ut här, så att den alltid följer punkterna.
  function farg(s) {
    const v = Object.values(s.punkter).map((p) => p[0]);
    if (v.includes("risk")) return "rod";
    if (v.includes("atgard") || s.punkter.rls[0] !== "ok" || s.punkter.hemligheter[0] !== "ok") return "gul";
    return "gron";
  }
  const antal = (s, l) => Object.values(s.punkter).filter((p) => p[0] === l).length;
  const apps = D.appar.filter((a) => S.appar[a.id]);
  const id = new URLSearchParams(location.search).get("app");
  const app = apps.find((a) => a.id === id);

  if (!app) {
    const n = { gron: 0, gul: 0, rod: 0 };
    apps.forEach((a) => n[farg(S.appar[a.id])]++);
    main.innerHTML = `
      <section class="sec">
        <h2>Läget i ${apps.length} appar</h2>
        <p class="lead">En rad per app. Tryck på en app för att se hur den är byggd och skyddad.</p>
        <div class="tally">${Object.keys(FARG).map((k) => `<div class="tal t-${FARG[k][1]}"><b>${n[k]}</b><span>${FARG[k][0]}</span></div>`).join("")}</div>
        <div class="rows">${apps.map((a) => { const s = S.appar[a.id], f = farg(s), ej = antal(s, "ej"); return `
          <a class="row" href="sakerhet.html?app=${encodeURIComponent(a.id)}">
            <i class="dot d-${FARG[f][1]}" aria-hidden="true"></i>
            <img src="icons/${encodeURIComponent(a.ikon)}" alt="" width="36" height="36">
            <span class="rn"><b>${esc(a.namn)}</b><small>${esc(ST[a.status] || "")} · ${FARG[f][0]}: ${antal(s, "ok")} bra${antal(s, "atgard") ? ", " + antal(s, "atgard") + " ska åtgärdas" : ""}${ej ? ", " + ej + " ej kontrollerat" : ""}</small></span>
            <span class="chev" aria-hidden="true">›</span>
          </a>`; }).join("")}</div>
      </section>
      <section class="sec">
        <h2>Så läser du färgerna</h2>
        <div class="fkeys">${Object.values(FARG).map((f) => `<div class="fkey"><i class="dot d-${f[1]}"></i><span><b>${f[0]}</b> ${f[2]}.</span></div>`).join("")}</div>
        <p class="small">${esc(S.metod)} Senast kontrollerat ${esc(S.kontrollerad)}.</p>
      </section>`;
    return;
  }

  const s = S.appar[app.id], f = farg(s);
  document.title = app.namn + " – byggd och skyddad";
  document.getElementById("sTitle").textContent = app.namn;
  document.getElementById("sSub").textContent = "Så är appen byggd och skyddad";
  const ruta = (k) => { const p = s.punkter[k]; if (!p) return ""; const l = LAGE[p[0]]; return `
    <div class="pt p-${l[1]}"><div class="pth"><h3>${esc(S.rubriker[k])}</h3><span class="tag g-${l[1]}">${l[0]}</span></div><p>${esc(p[1])}</p></div>`; };
  main.innerHTML = `
    <section class="sec">
      <div class="hero h-${FARG[f][1]}">
        <img src="icons/${encodeURIComponent(app.ikon)}" alt="" width="56" height="56">
        <div><b>${FARG[f][0]}</b><span>${FARG[f][2]}.</span></div>
      </div>
      <p class="lead">${esc(app.gor)}</p>
      ${s.notis ? `<p class="note">${esc(s.notis)}</p>` : ""}
    </section>
    <section class="sec">
      <h2>Så är den byggd</h2>
      <div class="chips">${s.teknik.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      <div class="facts">
        <div><small>Data ligger i</small><b>${esc(app.databas)}</b></div>
        <div><small>Inloggning</small><b>${esc(app.inloggning)}</b></div>
        <div><small>Används av</small><b>${esc(app.anvands_av)}</b></div>
        <div><small>Kod</small><b>${app.repo ? esc(app.repo) + " · " + esc(s.kod) : "Inget repo"}</b></div>
      </div>
    </section>
    <section class="sec">
      <h2>Så är den skyddad</h2>
      <div class="pts">${S.ordning.map(ruta).join("")}</div>
    </section>
    <section class="sec">
      <h2>Senaste säkerhetskontroll</h2>
      <div class="card"><b>${esc(s.granskning[0] || "Ej kontrollerat")}</b><p class="gp">${esc(s.granskning[1])}</p></div>
    </section>
    <section class="sec">
      <h2>Kända öppna punkter</h2>
      ${app.pagar.length ? `<ul class="open">${app.pagar.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : '<p class="lead">Inga kända öppna punkter i kartan.</p>'}
      <p class="small">Senast kontrollerat ${esc(S.kontrollerad)}${s.version ? " · koden senast ändrad " + esc(s.version) : ""}. <a href="sakerhet.html">Alla appar</a></p>
    </section>`;
})();

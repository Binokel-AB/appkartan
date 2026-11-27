// Kontrollrum: fem vyer. Apparna och kopplingarna läses ur data/appar.json, säkerhetsläget ur data/sakerhet.json
// och allt som ändras över tid ur data/kontrollrum.json. Inget värde hittas på: det som saknar källa visas som
// "Ej ansluten" eller "Inte verifierat".
(async function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const main = document.getElementById("kMain");
  let D, S, K;
  try {
    const r = await Promise.all(["data/appar.json", "data/sakerhet.json", "data/kontrollrum.json"].map((u) => fetch(u, { cache: "no-cache" })));
    if (r.some((x) => !x.ok)) throw new Error("läsfel");
    [D, S, K] = await Promise.all(r.map((x) => x.json()));
  } catch (e) {
    main.innerHTML = '<div class="card err">Sidan kunde inte läsa uppgifterna. Ladda om sidan.</div>';
    return;
  }
  const ST = { drift: ["I drift", "ok"], pilot: ["Pilot", "warn"], bygg: ["Byggs", "warn"], byggs: ["Byggs", "warn"], avveckl: ["Avvecklas", "ej"] };
  const LAGE = { verifierat: ["Verifierat", "ok"], drift: ["I drift", "ok"], planerad: ["Planerad", "warn"], inte_verifierat: ["Inte verifierat", "warn"], ej_ansluten: ["Ej ansluten", "ej"] };
  const tag = (l) => { const x = LAGE[l] || LAGE.inte_verifierat; return `<span class="tag g-${x[1]}">${x[0]}</span>`; };
  const kalla = (m) => (m.kalla ? `<small class="src">Källa: ${esc(m.kalla)}${m.datum ? ", " + esc(m.datum) : ""}</small>` : "");
  const not = (m) => (m.not ? `<p>${esc(m.not)}</p>` : "");
  // Ett mätvärde. Utan verifierad källa visas aldrig en siffra.
  const ruta = (m) => { const harVarde = m.lage === "verifierat" && m.varde !== undefined; const x = LAGE[m.lage] || LAGE.inte_verifierat; return `
    <div class="pt p-${x[1]}"><div class="pth"><h3>${esc(m.namn)}</h3>${tag(m.lage)}</div>
      ${harVarde ? `<b class="kv">${esc(m.varde)}</b>` : `<b class="kv kv-no">${x[0]}</b>`}${not(m)}${kalla(m)}</div>`; };
  const farg = (s) => { const v = Object.values(s.punkter).map((p) => p[0]); return v.includes("risk") ? ["Röd", "bad"] : v.includes("atgard") || v.includes("ej") ? ["Gul", "warn"] : ["Grön", "ok"]; };
  const agent = (id) => (K.organisation.appagenter || {})[id];
  const O = K.organisation;

  document.getElementById("kSub").textContent = "Ögonblicksbild " + K.uppdaterad;
  // Källans ålder: äldre än max_alder_dagar visas som en varning högst upp.
  const alder = Math.floor((Date.now() - new Date(K.uppdaterad + "T00:00:00").getTime()) / 864e5);
  const gammal = alder > (K.max_alder_dagar ?? 2);
  const varning = gammal ? `<div class="card err"><b>Uppgifterna är ${alder} dagar gamla.</b><p class="gp">Källan har inte uppdaterats sedan ${esc(K.uppdaterad)}. Lita inte på siffrorna förrän den är uppdaterad.</p></div>` : "";
  const NIVA = ["registrerad", "ansluten", "automatiserad"];
  const R = K.appregister;
  // Verksamhetsappar på Kartan plus appar som finns i förteckningen men ännu inte på Kartan.
  const verks = [...D.appar.filter((a) => a.grupp !== "bakom").map((a) => ({ namn: a.namn, niva: (agent(a.id) || {}).niva })), ...(R.extra || [])];
  const iNiva = (n) => verks.filter((a) => NIVA.indexOf(a.niva || "") >= NIVA.indexOf(n));
  const nivaer = `
      <h3 class="kh">Tre nivåer för ${verks.length} verksamhetsappar</h3>
      <div class="kgrid">${NIVA.map((n) => { const l = iNiva(n); return `
        <div class="pt p-${l.length ? "ok" : "ej"}"><div class="pth"><h3>${n[0].toUpperCase() + n.slice(1)}</h3><span class="tag g-${l.length ? "ok" : "ej"}">${l.length} av ${verks.length}</span></div>
          <p>${esc(R.nivaer[n])}</p><p>${l.length ? l.map((a) => esc(a.namn)).join(", ") : "Ingen app ännu."}</p></div>`; }).join("")}</div>
      <small class="src">Källa: ${esc(R.kalla)}, ${esc(R.datum)}</small>
      <h3 class="kh">Appar med oklar status</h3>
      <div class="rows">${R.utanfor_kartan.map((x) => `<div class="row rowtop"><span class="rn"><b>${esc(x.namn)}</b><small>${esc(x.lage)}</small></span></div>`).join("")}</div>
      <div class="card"><b>Skyddad del</b> ${tag(K.skyddad.lage)}<p class="gp">${esc(K.skyddad.text)}</p></div>`;

  const oversikt = `
    <section id="oversikt" class="sec">
      <h2>Översikt</h2>
      <p class="lead">${esc(K.om)}</p>
      ${varning}
      <div class="kgrid">${K.oversikt.map(ruta).join("")}</div>
      ${nivaer}
      <h3 class="kh">Alla ${D.appar.length} appar</h3>
      <div class="rows">${D.appar.map((a) => { const st = ST[a.status] || ["", "ej"]; const s = S.appar[a.id]; const f = s ? farg(s) : null; return `
        <a class="row" href="sakerhet.html?app=${encodeURIComponent(a.id)}">
          <img src="icons/${encodeURIComponent(a.ikon)}" alt="" width="36" height="36">
          <span class="rn"><b>${esc(a.namn)}</b><small>${a.pagar.length ? esc(a.pagar.length + " saker pågår: " + a.pagar[0]) : "Inget pågående arbete noterat"}</small></span>
          <span class="tag g-${st[1]}">${st[0]}</span>${f ? `<i class="dot d-${f[1]}" title="Skydd: ${f[0]}"></i>` : ""}
        </a>`; }).join("")}</div>
      <p class="small">Pågående arbete och status kommer från <code>data/appar.json</code>. Pricken visar säkerhetsläget från sidan Byggd och skyddad.</p>
    </section>`;

  const agenter = `
    <section id="agenter" class="sec">
      <h2>Agentorganisation</h2>
      <div class="org">
        <div class="orgbox"><b>Daniel och Christian</b><span>Beslutar</span></div>
        <div class="orgarrow" aria-hidden="true">↓</div>
        <div class="orgbox"><b>${esc(O.ingang.namn)}</b><span>${esc(O.ingang.gor)}</span>${tag(O.ingang.lage)}<small>${esc(O.ingang.not)}</small></div>
        <div class="orgarrow" aria-hidden="true">↓</div>
        <div class="orgbox"><b>${esc(O.huvudagent.namn)}</b><span>${esc(O.huvudagent.gor)}</span>${tag(O.huvudagent.lage)}<small>${esc(O.huvudagent.not)}</small></div>
        <div class="orgarrow" aria-hidden="true">↓</div>
        <div class="orgbox"><b>${D.appar.length} appagenter</b><span>En per app. Se listan nedan.</span></div>
        <div class="orgarrow" aria-hidden="true">↓</div>
        <div class="orgbox"><b>Gemensamma specialister</b>${O.specialister.map((s) => `<span>${esc(s.namn)}: ${esc(s.gor)} ${tag(s.lage)}</span><small>${esc(s.kalla)}</small>`).join("")}</div>
      </div>
      <h3 class="kh">Appagenter och körningar</h3>
      <div class="rows">${D.appar.map((a) => { const g = agent(a.id) || { korningar: [], senast: { lage: "ej_ansluten" } }; return `
        <div class="row rowtop">
          <img src="icons/${encodeURIComponent(a.ikon)}" alt="" width="36" height="36">
          <span class="rn"><b>${esc(a.namn)}</b>
            <small>${g.korningar.length ? g.korningar.map(esc).join(" · ") : "Ingen schemalagd körning känd"}</small>
            <small>Senaste resultat: ${esc(g.senast.text || (LAGE[g.senast.lage] || LAGE.inte_verifierat)[0])}${g.senast.kalla ? " (" + esc(g.senast.kalla) + ")" : ""}</small></span>
          ${tag(g.senast.lage)}
        </div>`; }).join("")}</div>
      <p class="small">${esc(O.korningar_kalla)}</p>
    </section>`;

  const B = K.beslut;
  const beslut = `
    <section id="beslut" class="sec">
      <h2>Beslut</h2>
      <div class="kgrid">
        ${ruta({ namn: "Frågor till Daniel", ...B.daniel })}
        ${ruta({ namn: "Frågor till Christian", ...B.christian })}
        ${ruta({ namn: "Besvarade frågor", ...B.historik })}
      </div>
      <div class="card"><b>Vad händer efter ett beslut?</b><p class="gp">${esc(B.efter_beslut)}</p></div>
      <div class="card"><b>Varför syns inte frågorna här?</b><p class="gp">${esc(B.detaljer)}</p></div>
    </section>`;

  const ark = `
    <section id="arkitektur" class="sec">
      <h2>Systemarkitektur</h2>
      <p class="lead">En rad per app: databas, kopplingar och vilken agent som ansvarar. Uppgifterna kommer ur samma fil som Kartan, så det finns bara en systemkarta.</p>
      <div class="rows">${D.appar.map((a) => `
        <div class="row rowtop">
          <img src="icons/${encodeURIComponent(a.ikon)}" alt="" width="36" height="36">
          <span class="rn"><b>${esc(a.namn)}</b>
            <small>Databas: ${esc(a.databas)}${a.repo ? " · Repo: " + esc(a.repo) : ""}</small>
            <small>Kopplingar: ${a.kopplingar.length ? a.kopplingar.map((k) => esc(k[0]) + (k[2] ? " (för hand)" : "")).join(", ") : "inga"}</small>
            <small>Ansvarig agent: appagent för ${esc(a.namn)}${S.appar[a.id] && S.appar[a.id].granskning[0] ? " · Säkerhet kontrollerad " + esc(S.appar[a.id].granskning[0]) : ""}</small></span>
        </div>`).join("")}</div>
      <p class="small">Externa system: ${D.externa.map((e) => esc(e[0])).join(", ")}. Kartan uppdaterad ${esc(D.uppdaterad)}. Ändringshistoriken finns i repots historik på GitHub.</p>
    </section>`;

  const res = `
    <section id="resurser" class="sec">
      <h2>AI-resurser</h2>
      <div class="kgrid">${K.resurser.map(ruta).join("")}</div>
    </section>`;

  main.innerHTML = oversikt + agenter + beslut + ark + res;
})();

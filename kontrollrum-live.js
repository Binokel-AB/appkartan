// Kontrollrummets skyddade läge. Sidan ligger öppet men innehåller inga uppgifter: allt hämtas från arbetsköns ingång
// med din personliga nyckel. Nyckeln finns bara i den här fliken (sessionStorage) och försvinner när fliken stängs.
// Adressen till ingången sparas i webbläsaren, aldrig i repot.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const main = document.getElementById("lMain");
  const STEG = { inkommet: "Inkommet", klassificerat: "Klassificerat", tilldelat: "Tilldelat", pagar: "Pågår", testas: "Testas", granskas: "Granskas",
    publiceras: "Väntar på publicering", redo_att_testa: "Redo att testa", vantar_beslut: "Väntar på beslut", blockerat: "Blockerat", misslyckat: "Misslyckat", aterupptas: "Återupptas" };
  const KORNING = { ko: ["Väntar på start", "warn"], startar: ["Startas", "warn"], avbruten: ["Avbruten", "ej"], startad: ["Igång", "ok"], klar: ["Klar", "ok"], hanterad: ["Klar", "ok"], misslyckad: ["Gick inte att starta", "bad"], tidsgrans: ["Svarade inte", "bad"] };
  const NIVA = { registrerad: "Registrerad", ansluten: "Ansluten", automatiserad: "Automatiserad", ej_registrerad: "Ej registrerad" };
  const tid = (t) => (t ? new Date(t).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" }) : "");
  const tag = (text, farg) => `<span class="tag g-${farg}">${esc(text)}</span>`;
  const tom = (text) => `<p class="gp">${esc(text)}</p>`;
  const lista = (rader, f, tomtext) => (rader.length ? rader.map(f).join("") : tom(tomtext));
  const rad = (rubrik, under, hoger, knappar = "") => `<div class="row"><div><b>${esc(rubrik)}</b><p class="gp">${under}</p>${knappar ? `<p class="kn">${knappar}</p>` : ""}</div><div>${hoger}</div></div>`;
  // Åtgärder. Varje knapp bär bara åtgärdens namn och ärendets eller frågans id. Inget görs förrän du har bekräftat i rutan som öppnas.
  const FEL = { E_INTE_TILLATEN: "Din nyckel får inte göra det här.", E_OTILLATET_STEG: "Ärendet har hunnit byta läge. Hämta igen.", E_BARA_RAPPORTOREN: "Bara den som lämnade idén får godkänna.",
    E_FEL_BESLUTSKOD: "Koden stämde inte.", E_FRAGAN_STANGD: "Frågan är återkallad eller låst.", E_OKAND_FRAGA: "Frågan finns inte längre.", E_AVSLUTAT: "Ärendet är redan avslutat.", E_FOR_MANGA: "För många anrop. Vänta en minut." };
  const ATGARD = {
    ja: { text: "Svara JA på frågan?", knapp: "Ja, godkänn", skicka: (k) => ["registrera_beslut", { begaran: k.id, kod: k.kod, svar: "ja" }] },
    nej: { text: "Svara NEJ på frågan?", knapp: "Nej, avslå", skicka: (k) => ["registrera_beslut", { begaran: k.id, kod: k.kod, svar: "nej" }] },
    frigor: { text: "Släppa loss ärendet så att arbetet fortsätter?", knapp: "Släpp loss", falt: "Kommentar (frivillig)", skicka: (k, t) => ["frigor", { arende: k.id, kommentar: t }] },
    avbryt: { text: "Avbryta ärendet? Det går inte att ångra.", knapp: "Avbryt ärendet", falt: "Orsak (frivillig)", skicka: (k, t) => ["avbryt", { arende: k.id, orsak: t }] },
    bekrafta: { text: "Intyga att du själv har provat och att det fungerar?", knapp: "Jag har provat, godkänn", skicka: (k) => ["bekrafta", { arende: k.id }] },
    prioritera: { text: "Ändra prioritet? 1 är viktigast, 5 minst viktig.", knapp: "Spara prioritet", val: [1, 2, 3, 4, 5], skicka: (k, t) => ["prioritera", { arende: k.id, prioritet: Number(t) }] },
  };
  const knapp = (atgard, id, text, extra = "") => `<button class="btn liten" type="button" data-atgard="${esc(atgard)}" data-id="${esc(id)}"${extra}>${esc(text)}</button>`;
  let besked = "";
  async function utfor(atgard, data) {
    const adr = localStorage.getItem("arbetsko_ingang"), nyckel = sessionStorage.getItem("arbetsko_nyckel");
    try {
      const r = await fetch(adr + "/ingang", { method: "POST", cache: "no-store", headers: { "content-type": "application/json", authorization: "Bearer " + nyckel, "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ atgard, data }) });
      const d = await r.json();
      besked = d.ok ? "Klart." : "Det gick inte: " + (FEL[d.kod] || "ingången svarade med ett fel" + (d.kod ? " (" + d.kod + ")" : "") + ".");
    } catch (e) { besked = "Det gick inte: ingången gick inte att nå."; }
    hamta();
  }
  main.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-atgard]"); if (!b) return;
    const a = ATGARD[b.dataset.atgard]; if (!a) return;
    const k = { id: b.dataset.id, kod: b.dataset.kod };
    main.querySelectorAll(".fraga").forEach((x) => x.remove());
    const ruta = document.createElement("div"); ruta.className = "fraga"; ruta.setAttribute("role", "group");
    ruta.innerHTML = `<p><b>${esc(a.text)}</b></p>`
      + (a.falt ? `<p><label>${esc(a.falt)}<br><input type="text" maxlength="200" style="width:100%;font-size:16px;padding:.5rem"></label></p>` : "")
      + (a.val ? `<p><label>Prioritet <select style="font-size:16px;padding:.4rem">${a.val.map((v) => `<option${String(v) === b.dataset.nu ? " selected" : ""}>${v}</option>`).join("")}</select></label></p>` : "")
      + `<p><button class="btn" type="button" data-gor>${esc(a.knapp)}</button> <button class="btn" type="button" data-angra>Ångra</button></p>`;
    b.closest(".row").after(ruta);
    ruta.querySelector("[data-angra]").onclick = () => ruta.remove();
    ruta.querySelector("[data-gor]").onclick = () => {
      const t = (ruta.querySelector("input, select") || {}).value || "";
      ruta.innerHTML = "<p>Skickar …</p>";
      utfor(...a.skicka(k, t));
    };
    ruta.querySelector("input, select, [data-gor]").focus();
  });

  function inloggning(fel) {
    main.innerHTML = `<div class="card"><h2>Öppna det skyddade läget</h2>
      ${fel ? `<p class="gp" role="alert"><b>${esc(fel)}</b></p>` : ""}
      <form id="lForm">
        <p><label for="lAdr">Ingångens adress</label><br><input id="lAdr" type="url" required autocomplete="off" inputmode="url" style="width:100%;font-size:16px;padding:.6rem" value="${esc(localStorage.getItem("arbetsko_ingang") || "")}"></p>
        <p><label for="lNyckel">Din nyckel</label><br><input id="lNyckel" type="password" required autocomplete="off" style="width:100%;font-size:16px;padding:.6rem"></p>
        <p><button class="btn" type="submit">Visa läget</button></p>
      </form>
      <p class="gp">Nyckeln skickas bara till ingången och sparas inte. Adressen och nyckeln finns i Nyckelvalvet.</p></div>`;
    document.getElementById("lForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const adr = document.getElementById("lAdr").value.trim().replace(/\/+$/, "");
      if (!/^https:\/\//.test(adr) && !/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(adr)) return inloggning("Adressen måste börja med https://");
      localStorage.setItem("arbetsko_ingang", adr);
      sessionStorage.setItem("arbetsko_nyckel", document.getElementById("lNyckel").value);
      hamta();
    });
  }

  async function hamta() {
    const adr = localStorage.getItem("arbetsko_ingang"), nyckel = sessionStorage.getItem("arbetsko_nyckel");
    if (!adr || !nyckel) return inloggning();
    main.innerHTML = '<div class="card">Hämtar läget …</div>';
    let d;
    try {
      const r = await fetch(adr + "/ingang", { method: "POST", cache: "no-store", headers: { "content-type": "application/json", authorization: "Bearer " + nyckel }, body: JSON.stringify({ atgard: "kontrollrum" }) });
      d = await r.json();
      if (!r.ok || !d.ok) { sessionStorage.removeItem("arbetsko_nyckel"); return inloggning(r.status === 401 ? "Nyckeln är fel eller avstängd." : r.status === 403 ? "Din nyckel får inte se kontrollrummet." : "Ingången svarade med ett fel."); }
    } catch (e) { return inloggning("Ingången gick inte att nå. Kontrollera adressen."); }
    visa(d);
  }

  function visa(d) {
    document.getElementById("lSub").textContent = "Hämtat " + tid(d.hamtat);
    const niv = (n) => d.appar.filter((a) => ["aktiv", "utveckling"].includes(a.status) && a.niva === n).length;
    const b0 = besked; besked = "";
    main.innerHTML = `
      <p><button class="btn" id="lOm">Hämta igen</button> <button class="btn" id="lUt">Stäng och glöm nyckeln</button></p>
      ${b0 ? `<p class="card" id="lBesked" role="status"><b>${esc(b0)}</b></p>` : ""}
      <section class="card" id="lBeslut"><h2>Väntande beslut (${d.vantande_beslut.length})</h2>
        ${lista(d.vantande_beslut, (b) => rad(b.fraga, `${esc(b.app)} · till ${esc(b.till)} · sedan ${esc(tid(b.sedan))} · förslag: ${esc(b.rekommendation)}${b.kod ? ` · <b>din kod: ${esc(b.kod)}</b>` : ""}`, tag(b.status === "otydligt" ? "Otydligt svar" : b.mejl === "skickat" ? "Mejl skickat" : b.mejl === "utkast" ? "Mejlutkast" : "Väntar", b.status === "otydligt" ? "bad" : "warn"),
          b.kod ? knapp("ja", b.begaran, "Ja", ` data-kod="${esc(b.kod)}"`) + " " + knapp("nej", b.begaran, "Nej", ` data-kod="${esc(b.kod)}"`) : ""), "Inga beslut väntar.")}</section>
      <section class="card" id="lStopp"><h2>Misslyckanden och blockeringar (${d.stopp.length})</h2>
        ${lista(d.stopp, (s) => rad(s.rubrik, `${esc(s.app)} · ${esc(s.fel || "ingen orsak angiven")} · försök ${esc(s.forsok)} · ${esc(tid(s.senast))}`, tag(s.kraver_manniska ? "Kräver en människa" : STEG[s.steg] || s.steg, s.kraver_manniska ? "bad" : "warn"),
          (["blockerat", "misslyckat"].includes(s.steg) ? knapp("frigor", s.arende, "Släpp loss") + " " : "") + knapp("avbryt", s.arende, "Avbryt")), "Inget har stannat.")}</section>
      <section class="card" id="lPagaende"><h2>Pågående arbete (${d.pagaende.length})</h2>
        ${lista(d.pagaende, (p) => rad(p.rubrik, `${esc(p.app)} · ${esc(p.agent)} · ${esc(p.regel || "inte klassat")} · nästa: ${esc(p.nasta || "–")} · ${esc(tid(p.senast))}`, tag(STEG[p.steg] || p.steg, p.steg === "publiceras" || p.steg === "redo_att_testa" ? "warn" : "ok"),
          (p.steg === "redo_att_testa" ? knapp("bekrafta", p.arende, "Jag har provat") + " " : "") + knapp("prioritera", p.arende, "Prioritet " + (p.prioritet ?? "?"), ` data-nu="${esc(p.prioritet)}"`) + " " + knapp("avbryt", p.arende, "Avbryt")), "Inget pågår.")}</section>
      <section class="card" id="lKorningar"><h2>Senaste körningar</h2>
        ${lista(d.korningar, (k) => { const x = KORNING[k.status] || [k.status, "ej"]; return rad(`${k.sort === "granska" ? "Granskning" : "Utveckling"} · ${k.app}`, `${esc(k.agent)} · ${esc(tid(k.skapad))}${k.fel ? " · " + esc(k.fel) : ""}`, tag(x[0], x[1])); }, "Inga körningar än.")}</section>
      <section class="card" id="lAppar"><h2>Appar</h2>
        <p class="gp">Registrerad ${niv("registrerad")} · Ansluten ${niv("ansluten")} · Automatiserad ${niv("automatiserad")}</p>
        ${lista(d.appar, (a) => rad(a.namn, `${esc(a.agent || "ingen agent")} · feedbacken ägs av ${esc(a.feedback_ags_av === "arbetsko" ? "arbetskön" : a.feedback_ags_av === "ingen" ? "ingen" : "en befintlig körning")}`, tag(a.status === "oklar" ? "Oklar" : NIVA[a.niva] || a.niva, a.niva === "automatiserad" ? "ok" : a.status === "oklar" ? "ej" : "warn")), "Inga appar.")}</section>
      <section class="card" id="lAnsvar"><h2>Agenternas ansvar</h2>
        ${lista(d.ansvar, (m) => rad(m.agent, `${esc(m.roll)} · ${m.app === "*" ? "alla appar" : esc(m.app)}`, ""), "Inga mandat är registrerade.")}</section>
      <section class="card" id="lAndringar"><h2>Skyddade ändringar</h2>
        <p class="gp">Ändringar av nycklar, mandat, regler och lägen, och bevis som lagts in utan att gå genom arbetsköns funktioner.</p>
        ${lista(d.skyddade_andringar || [], (x) => rad(`${x.tabell} · ${x.vad}`, `${esc(x.rad)} · ${esc(tid(x.nar))}`, tag(x.via === "DIREKT" ? "Direkt i databasen" : "Via funktion", x.via === "DIREKT" ? "bad" : "ok")), "Inga ändringar.")}</section>
      <section class="card" id="lKostnad"><h2>Kostnader och krediter</h2>
        ${d.kostnader && d.kostnader.verifierad_kalla ? "" : `<p>${tag("Inte verifierat", "warn")}</p>${tom((d.kostnader && d.kostnader.not) || "Ingen källa ansluten.")}`}</section>
      <section class="card" id="lLagen"><h2>Lägen</h2>
        ${rad("Beslut via mejl", "", tag(d.lagen.mejlbeslut === "aktivt" ? "Aktivt" : d.lagen.mejlbeslut === "skugga" ? "Skuggläge" : "Av", d.lagen.mejlbeslut === "aktivt" ? "ok" : "warn"))}
        ${rad("Utskick av beslutsmejl", "", tag(d.lagen.mejlutskick === "aktivt" ? "Aktivt" : "Bara utkast", d.lagen.mejlutskick === "aktivt" ? "ok" : "warn"))}</section>`;
    document.getElementById("lOm").onclick = hamta;
    document.getElementById("lUt").onclick = () => { sessionStorage.removeItem("arbetsko_nyckel"); inloggning(); };
  }
  hamta();
})();

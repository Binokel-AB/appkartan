// Kontrollrummets skyddade läge. Sidan ligger öppet men innehåller inga uppgifter: allt hämtas från arbetsköns ingång
// med din personliga nyckel. Nyckeln finns bara i den här fliken (sessionStorage) och försvinner när fliken stängs.
// Adressen till ingången sparas i webbläsaren, aldrig i repot.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const main = document.getElementById("lMain");
  const STEG = { inkommet: "Inkommet", klassificerat: "Klassificerat", tilldelat: "Tilldelat", pagar: "Pågår", testas: "Testas", granskas: "Granskas",
    publiceras: "Väntar på publicering", redo_att_testa: "Redo att testa", vantar_beslut: "Väntar på beslut", blockerat: "Blockerat", misslyckat: "Misslyckat", aterupptas: "Återupptas" };
  const KORNING = { ko: ["Väntar på start", "warn"], startad: ["Igång", "ok"], klar: ["Klar", "ok"], hanterad: ["Klar", "ok"], misslyckad: ["Gick inte att starta", "bad"], tidsgrans: ["Svarade inte", "bad"] };
  const NIVA = { registrerad: "Registrerad", ansluten: "Ansluten", automatiserad: "Automatiserad", ej_registrerad: "Ej registrerad" };
  const tid = (t) => (t ? new Date(t).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" }) : "");
  const tag = (text, farg) => `<span class="tag g-${farg}">${esc(text)}</span>`;
  const tom = (text) => `<p class="gp">${esc(text)}</p>`;
  const lista = (rader, f, tomtext) => (rader.length ? rader.map(f).join("") : tom(tomtext));
  const rad = (rubrik, under, hoger) => `<div class="row"><div><b>${esc(rubrik)}</b><p class="gp">${under}</p></div><div>${hoger}</div></div>`;

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
    main.innerHTML = `
      <p><button class="btn" id="lOm">Hämta igen</button> <button class="btn" id="lUt">Stäng och glöm nyckeln</button></p>
      <section class="card" id="lBeslut"><h2>Väntande beslut (${d.vantande_beslut.length})</h2>
        ${lista(d.vantande_beslut, (b) => rad(b.fraga, `${esc(b.app)} · till ${esc(b.till)} · sedan ${esc(tid(b.sedan))} · förslag: ${esc(b.rekommendation)}`, tag(b.status === "otydligt" ? "Otydligt svar" : b.mejl === "skickat" ? "Mejl skickat" : b.mejl === "utkast" ? "Mejlutkast" : "Väntar", b.status === "otydligt" ? "bad" : "warn")), "Inga beslut väntar.")}</section>
      <section class="card" id="lStopp"><h2>Misslyckanden och blockeringar (${d.stopp.length})</h2>
        ${lista(d.stopp, (s) => rad(s.rubrik, `${esc(s.app)} · ${esc(s.fel || "ingen orsak angiven")} · försök ${esc(s.forsok)} · ${esc(tid(s.senast))}`, tag(s.kraver_manniska ? "Kräver en människa" : STEG[s.steg] || s.steg, s.kraver_manniska ? "bad" : "warn")), "Inget har stannat.")}</section>
      <section class="card" id="lPagaende"><h2>Pågående arbete (${d.pagaende.length})</h2>
        ${lista(d.pagaende, (p) => rad(p.rubrik, `${esc(p.app)} · ${esc(p.agent)} · ${esc(p.regel || "inte klassat")} · nästa: ${esc(p.nasta || "–")} · ${esc(tid(p.senast))}`, tag(STEG[p.steg] || p.steg, p.steg === "publiceras" || p.steg === "redo_att_testa" ? "warn" : "ok")), "Inget pågår.")}</section>
      <section class="card" id="lKorningar"><h2>Senaste körningar</h2>
        ${lista(d.korningar, (k) => { const x = KORNING[k.status] || [k.status, "ej"]; return rad(`${k.sort === "granska" ? "Granskning" : "Utveckling"} · ${k.app}`, `${esc(k.agent)} · ${esc(tid(k.skapad))}${k.fel ? " · " + esc(k.fel) : ""}`, tag(x[0], x[1])); }, "Inga körningar än.")}</section>
      <section class="card" id="lAppar"><h2>Appar</h2>
        <p class="gp">Registrerad ${niv("registrerad")} · Ansluten ${niv("ansluten")} · Automatiserad ${niv("automatiserad")}</p>
        ${lista(d.appar, (a) => rad(a.namn, `${esc(a.agent || "ingen agent")} · feedbacken ägs av ${esc(a.feedback_ags_av === "arbetsko" ? "arbetskön" : a.feedback_ags_av === "ingen" ? "ingen" : "en befintlig körning")}`, tag(a.status === "oklar" ? "Oklar" : NIVA[a.niva] || a.niva, a.niva === "automatiserad" ? "ok" : a.status === "oklar" ? "ej" : "warn")), "Inga appar.")}</section>
      <section class="card" id="lAnsvar"><h2>Agenternas ansvar</h2>
        ${lista(d.ansvar, (m) => rad(m.agent, `${esc(m.roll)} · ${m.app === "*" ? "alla appar" : esc(m.app)}`, ""), "Inga mandat är registrerade.")}</section>
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

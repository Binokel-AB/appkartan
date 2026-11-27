// Webbläsartest för kontrollrummets skyddade läge, på dator och mobil. Starta först: python3 -m http.server 8765
// Ingången ersätts av ett sparat svar (PROVDATA, t.ex. kontrollrum_exempel ur motortestets resultat).
// NODE_PATH ska peka på en mapp där Playwright finns.
import { createRequire } from "node:module"; import { readFileSync } from "node:fs";
const require = createRequire((process.env.NODE_PATH || process.cwd()) + "/"); const { chromium } = require("playwright");
const prov = JSON.parse(readFileSync(process.env.PROVDATA, "utf8")); const svar = prov.kontrollrum_exempel || prov;
// Åtgärderna: en fråga med kod (ägarens personliga nyckel), en utan kod, ett blockerat ärende och ett som är redo att testa.
svar.vantande_beslut = [{ ...(svar.vantande_beslut[0] || {}), begaran: "b-1", fraga: "Får ändringen publiceras? Beslutet gäller regeln ny_funktion, 1 fil och kodversion abc1234.", kod: "ABC234", app: "academy", till: "daniel", status: "oppen" },
  { begaran: "b-2", fraga: "En fråga till någon annan", kod: null, app: "academy", till: "christian", status: "oppen", rekommendation: "Ja" }];
svar.stopp = [{ arende: "s-1", app: "academy", rubrik: "Blockerat ärende", steg: "blockerat", fel: "PR:en stängdes utan att mergas.", forsok: 0, senast: svar.hamtat, kraver_manniska: true }];
svar.pagaende = [{ arende: "p-1", app: "academy", rubrik: "Redo att testa", steg: "redo_att_testa", agent: "a", regel: "r", nasta: "n", senast: svar.hamtat, prioritet: 3 }];
svar.pagaende.push({ arende: "x", app: "academy", rubrik: '<img src=x onerror="window.XSS=1">', steg: "pagar", agent: "a", regel: "r", nasta: "n", senast: svar.hamtat });
const b = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const out = [];
for (const [namn, vp, mobil] of [["dator", { width: 1280, height: 900 }, false], ["mobil", { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobil, hasTouch: mobil });
  const p = await ctx.newPage(); const fel = []; let skickat = null; const atgarder = []; let nastaFel = null;
  p.on("console", (m) => m.type() === "error" && fel.push(m.text())); p.on("pageerror", (e) => fel.push(String(e)));
  await p.route("https://ingang.test/**", (r) => { const q = r.request(); skickat = { auth: q.headers().authorization, kropp: q.postData() };
    const fel401 = q.headers().authorization !== "Bearer ratt-nyckel";
    const kropp = JSON.parse(q.postData() || "{}");
    if (!fel401 && kropp.atgard !== "kontrollrum") { atgarder.push({ ...kropp, nyckel: q.headers()["idempotency-key"] });
      const f = nastaFel; nastaFel = null;
      return r.fulfill({ status: f ? 400 : 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(f ? { ok: false, kod: f } : { ok: true }) }); }
    r.fulfill({ status: fel401 ? 401 : 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(fel401 ? { ok: false, fel: "obehorig" } : svar) }); });
  await p.goto("http://127.0.0.1:8765/kontrollrum-live.html", { waitUntil: "load" });
  await p.fill("#lAdr", "https://ingang.test"); await p.fill("#lNyckel", "fel-nyckel"); await p.click("#lForm button");
  await p.waitForSelector('[role="alert"]'); const felNyckel = await p.textContent('[role="alert"]');
  await p.fill("#lNyckel", "ratt-nyckel"); await p.click("#lForm button"); await p.waitForSelector("#lLagen");
  const m = await p.evaluate(() => ({ bredd: document.documentElement.scrollWidth, fonster: innerWidth, delar: [...document.querySelectorAll("section.card")].map((s) => s.id).join(","),
    rader: document.querySelectorAll(".row").length, xss: window.XSS === 1, nyckelISidan: document.documentElement.innerHTML.includes("ratt-nyckel"),
    sparadNyckel: localStorage.getItem("arbetsko_nyckel"), flikNyckel: !!sessionStorage.getItem("arbetsko_nyckel") }));
  // Åtgärder: inget skickas förrän man bekräftat, Ångra skickar inget, och rätt uppgifter går iväg.
  const A = {};
  A.knappar = await p.evaluate(() => [...document.querySelectorAll("button[data-atgard]")].map((b) => b.dataset.atgard + ":" + b.dataset.id).join(" "));
  A.minstaKnapp = await p.evaluate(() => Math.min(...[...document.querySelectorAll("button[data-atgard]")].map((b) => b.getBoundingClientRect().height)));
  await p.click('button[data-atgard="ja"]'); await p.waitForSelector(".fraga");
  A.fragaText = await p.textContent(".fraga b"); A.foreBekraftelse = atgarder.length;
  await p.click(".fraga [data-angra]"); A.efterAngra = `${atgarder.length} skickade, ruta kvar: ${await p.locator(".fraga").count()}`;
  await p.screenshot({ path: `/tmp/krlive-${namn}-fore.png` });
  await p.click('button[data-atgard="ja"]'); await p.screenshot({ path: `/tmp/krlive-${namn}-fraga.png` }); await p.click(".fraga [data-gor]"); await p.waitForSelector("#lBesked");
  A.ja = JSON.stringify(atgarder.at(-1).data) + " " + (await p.textContent("#lBesked")); A.idempotensnyckel = /^[0-9a-f-]{36}$/.test(atgarder.at(-1).nyckel);
  await p.click('button[data-atgard="frigor"]'); await p.fill(".fraga input", "PR:en är öppnad igen"); await p.click(".fraga [data-gor]"); await p.waitForFunction((n) => true, 0); await p.waitForSelector("#lBesked");
  A.frigor = JSON.stringify(atgarder.at(-1));
  await p.click('button[data-atgard="prioritera"]'); A.forvald = await p.inputValue(".fraga select"); await p.selectOption(".fraga select", "1"); await p.click(".fraga [data-gor]"); await p.waitForSelector("#lBesked");
  A.prioritera = JSON.stringify({ atgard: atgarder.at(-1).atgard, data: atgarder.at(-1).data });
  await p.click('button[data-atgard="bekrafta"]'); nastaFel = "E_BARA_RAPPORTOREN"; await p.click(".fraga [data-gor]"); await p.waitForFunction(() => /gick inte/.test(document.getElementById("lBesked")?.textContent || ""));
  A.felsvar = await p.textContent("#lBesked");
  await p.click('button[data-atgard="avbryt"]'); nastaFel = "E_NYTT_OKANT"; await p.click(".fraga [data-gor]"); await p.waitForFunction(() => /E_NYTT_OKANT/.test(document.getElementById("lBesked")?.textContent || ""));
  A.okantFel = await p.textContent("#lBesked"); A.antalSkickade = atgarder.length;
  A.unikaNycklar = new Set(atgarder.map((a) => a.nyckel)).size; A.sidledEfter = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await p.screenshot({ path: `/tmp/krlive-${namn}.png` });
  await p.click("#lUt"); const efterUt = await p.evaluate(() => ({ nyckelKvar: !!sessionStorage.getItem("arbetsko_nyckel"), formular: !!document.getElementById("lForm"), dataKvar: !!document.getElementById("lBeslut") }));
  out.push({ namn, felNyckel, atgarder: A, ...m, sidled: m.bredd > m.fonster, skickat, efterUt, fel: fel.filter((f) => !/401/.test(f)) });
  await ctx.close();
}
await b.close(); console.log(JSON.stringify(out, null, 1));

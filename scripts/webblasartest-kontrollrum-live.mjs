// Webbläsartest för kontrollrummets skyddade läge, på dator och mobil. Starta först: python3 -m http.server 8765
// Ingången ersätts av ett sparat svar (PROVDATA, t.ex. kontrollrum_exempel ur motortestets resultat).
// NODE_PATH ska peka på en mapp där Playwright finns.
import { createRequire } from "node:module"; import { readFileSync } from "node:fs";
const require = createRequire((process.env.NODE_PATH || process.cwd()) + "/"); const { chromium } = require("playwright");
const prov = JSON.parse(readFileSync(process.env.PROVDATA, "utf8")); const svar = prov.kontrollrum_exempel || prov;
svar.pagaende.push({ arende: "x", app: "academy", rubrik: '<img src=x onerror="window.XSS=1">', steg: "pagar", agent: "a", regel: "r", nasta: "n", senast: svar.hamtat });
const b = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const out = [];
for (const [namn, vp, mobil] of [["dator", { width: 1280, height: 900 }, false], ["mobil", { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobil, hasTouch: mobil });
  const p = await ctx.newPage(); const fel = []; let skickat = null;
  p.on("console", (m) => m.type() === "error" && fel.push(m.text())); p.on("pageerror", (e) => fel.push(String(e)));
  await p.route("https://ingang.test/**", (r) => { const q = r.request(); skickat = { auth: q.headers().authorization, kropp: q.postData() };
    const fel401 = q.headers().authorization !== "Bearer ratt-nyckel";
    r.fulfill({ status: fel401 ? 401 : 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(fel401 ? { ok: false, fel: "obehorig" } : svar) }); });
  await p.goto("http://127.0.0.1:8765/kontrollrum-live.html", { waitUntil: "load" });
  await p.fill("#lAdr", "https://ingang.test"); await p.fill("#lNyckel", "fel-nyckel"); await p.click("#lForm button");
  await p.waitForSelector('[role="alert"]'); const felNyckel = await p.textContent('[role="alert"]');
  await p.fill("#lNyckel", "ratt-nyckel"); await p.click("#lForm button"); await p.waitForSelector("#lLagen");
  const m = await p.evaluate(() => ({ bredd: document.documentElement.scrollWidth, fonster: innerWidth, delar: [...document.querySelectorAll("section.card")].map((s) => s.id).join(","),
    rader: document.querySelectorAll(".row").length, xss: window.XSS === 1, nyckelISidan: document.documentElement.innerHTML.includes("ratt-nyckel"),
    sparadNyckel: localStorage.getItem("arbetsko_nyckel"), flikNyckel: !!sessionStorage.getItem("arbetsko_nyckel") }));
  await p.screenshot({ path: `/tmp/krlive-${namn}.png` });
  await p.click("#lUt"); const efterUt = await p.evaluate(() => ({ nyckelKvar: !!sessionStorage.getItem("arbetsko_nyckel"), formular: !!document.getElementById("lForm"), dataKvar: !!document.getElementById("lBeslut") }));
  out.push({ namn, felNyckel, ...m, sidled: m.bredd > m.fonster, skickat, efterUt, fel: fel.filter((f) => !/401/.test(f)) });
  await ctx.close();
}
await b.close(); console.log(JSON.stringify(out, null, 1));

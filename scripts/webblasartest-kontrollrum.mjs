// Webbläsartest för kontrollrummet på dator och mobil. Kräver Playwright och Chrome. Starta först: python3 -m http.server 8765
import { createRequire } from "node:module"; const require = createRequire("/home/claude/.npm-global/lib/node_modules/"); const { chromium } = require("playwright");
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const out = [];
for (const [namn, vp, mobil] of [["dator", { width: 1280, height: 900 }, false], ["mobil", { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobil, hasTouch: mobil, deviceScaleFactor: mobil ? 2 : 1 });
  const p = await ctx.newPage(); const fel = [];
  p.on("console", (m) => m.type() === "error" && fel.push(m.text())); p.on("pageerror", (e) => fel.push(String(e)));
  await p.route("**/fonts.googleapis.com/**", (r) => r.abort()); await p.route("**/fonts.gstatic.com/**", (r) => r.abort());
  await p.goto("http://127.0.0.1:8765/kontrollrum.html", { waitUntil: "load" }); await p.waitForSelector("#resurser", { timeout: 8000 });
  const m = await p.evaluate(() => ({ bredd: document.documentElement.scrollWidth, fonster: innerWidth, vyer: ["oversikt","agenter","beslut","arkitektur","resurser"].filter((i) => document.getElementById(i)).length,
    rader: document.querySelectorAll(".row").length, trasigaBilder: [...document.images].filter((i) => i.complete && !i.naturalWidth).length, hojd: document.documentElement.scrollHeight }));
  await p.screenshot({ path: `/tmp/kr-${namn}.png` });
  await p.click('nav.tabs a[href="#beslut"]'); await p.waitForTimeout(600);
  const y = await p.evaluate(() => Math.round(document.getElementById("beslut").getBoundingClientRect().top));
  await p.screenshot({ path: `/tmp/kr-${namn}-beslut.png` });
  out.push({ namn, ...m, sidled: m.bredd > m.fonster, beslutTopp: y, fel: fel.filter((f) => !/fonts|ERR_FAILED/.test(f)) });
  await ctx.close();
}
await b.close(); console.log(JSON.stringify(out, null, 1));

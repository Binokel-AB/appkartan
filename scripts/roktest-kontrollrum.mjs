// Röktest för kontrollrummet: ritar sidan utan webbläsare och kontrollerar de fem vyerna. Kör: node scripts/roktest-kontrollrum.mjs
import { readFileSync } from "node:fs";
const el = { innerHTML: "", textContent: "" };
globalThis.document = { getElementById: () => el };
globalThis.fetch = async (u) => ({ ok: true, json: async () => JSON.parse(readFileSync(u, "utf8")) });
await import(process.cwd() + "/kontrollrum.js");
await new Promise((r) => setTimeout(r, 200));
const h = el.innerHTML;
const need = ["id=\"oversikt\"", "id=\"agenter\"", "id=\"beslut\"", "id=\"arkitektur\"", "id=\"resurser\"", "Ej ansluten", "Inte verifierat", "Källa: Blueprints frågekö"];
for (const n of need) if (!h.includes(n)) { console.error("SAKNAS: " + n); process.exit(1); }
if (/undefined|NaN|\[object Object\]/.test(h)) { console.error("Trasig utskrift: " + h.match(/.{40}(undefined|NaN|\[object Object\]).{40}/)?.[0]); process.exit(1); }
const utan = [...h.matchAll(/<div class="pt p-(warn|ej)">[\s\S]*?<\/div>\s*<\/div>|<div class="pt p-(warn|ej)">[\s\S]*?<\/div>/g)].filter((m) => /class="kv">/.test(m[0]));
const bad = h.split('<div class="pt ').slice(1).filter((c) => /^p-(warn|ej)/.test(c) && c.includes('class="kv">'));
if (bad.length) { console.error("En ruta utan verifierad källa visar en siffra."); process.exit(1); }
console.log("Röktest OK: 5 vyer, " + (h.match(/class="row/g) || []).length + " rader, ingen siffra utan källa.");

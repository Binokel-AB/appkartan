// Kontrollerar data/appar.json innan sidan publiceras. Kör: node scripts/kontrollera.mjs
import { readFileSync, existsSync } from "node:fs";

const fel = [];
let D;
try {
  D = JSON.parse(readFileSync("data/appar.json", "utf8"));
} catch (e) {
  console.error("data/appar.json är inte giltig JSON: " + e.message);
  process.exit(1);
}

const STATUS = ["drift", "pilot", "bygg", "byggs", "avveckl"];
const GRUPP = ["kundresan", "personal", "bakom"];
const ids = new Set();
const ikon = (f, var_) => { if (!existsSync("icons/" + f)) fel.push(`${var_}: ikonen icons/${f} saknas`); };

for (const a of D.appar ?? []) {
  const v = `App "${a.namn ?? a.id}"`;
  for (const k of ["id", "namn", "grupp", "status", "ikon", "kort", "gor", "varfor", "anvands_av", "inloggning", "databas", "varfor_kort"]) {
    if (!a[k]) fel.push(`${v}: fältet ${k} saknas`);
  }
  if (ids.has(a.id)) fel.push(`${v}: id ${a.id} finns två gånger`);
  ids.add(a.id);
  if (!STATUS.includes(a.status)) fel.push(`${v}: okänd status ${a.status}`);
  if (!GRUPP.includes(a.grupp)) fel.push(`${v}: okänd grupp ${a.grupp}`);
  if (!Array.isArray(a.kopplingar) || !Array.isArray(a.pagar)) fel.push(`${v}: kopplingar och pagar ska vara listor`);
  if (a.ikon) ikon(a.ikon, v);
}
for (const g of D.gemensamt ?? []) {
  if (!STATUS.includes(g.lage)) fel.push(`Gemensamt "${g.namn}": okänt läge ${g.lage}`);
  for (const id of [...(g.har ?? []), ...(g.pa_vag ?? [])]) if (!ids.has(id)) fel.push(`Gemensamt "${g.namn}": okänd app ${id}`);
}
for (const r of D.resan ?? []) ikon(r[0], "Resan");
for (const r of D.ikonbyten ?? []) { ikon(r[0], "Ikonbyte"); ikon(r[1], "Ikonbyte"); }
for (const r of D.glasflow_forslag ?? []) ikon(r[0], "GlasFlow-förslag");

// Sidan kan vara publik: inga personuppgifter, hemligheter eller databas-id:n.
const text = readFileSync("data/appar.json", "utf8");
const SPARR = [
  [/\b\d{6}[-+]?\d{4}\b/, "något som liknar ett personnummer"],
  [/\b07\d[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/, "något som liknar ett mobilnummer"],
  [/[\w.+-]+@[\w-]+\.[\w.]+/, "en e-postadress"],
  [/\b[a-z]{20}\b/, "något som liknar ett Supabase-projekt-id"],
  [/\b(sk|pk|rk|ik)_[A-Za-z0-9]{8,}/, "något som liknar en nyckel"],
  [/eyJ[A-Za-z0-9_-]{10,}/, "något som liknar en token"],
];
for (const [re, vad] of SPARR) if (re.test(text)) fel.push(`data/appar.json innehåller ${vad}. Ta bort det, sidan kan vara publik.`);

if (fel.length) {
  console.error("Kontrollen hittade " + fel.length + " fel:\n- " + fel.join("\n- "));
  process.exit(1);
}
console.log(`OK: ${ids.size} appar, ${D.gemensamt.length} gemensamma delar, alla ikoner finns.`);

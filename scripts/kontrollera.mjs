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

// Byggd och skyddad: data/sakerhet.json ska ha alla appar, kända lägen och aldrig peka ut enskilda luckor.
const LAGE = ["ok", "atgard", "risk", "ej"];
let Sk = null;
try { Sk = JSON.parse(readFileSync("data/sakerhet.json", "utf8")); } catch (e) { fel.push("data/sakerhet.json är inte giltig JSON: " + e.message); }
if (Sk) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(Sk.kontrollerad ?? "")) fel.push("sakerhet.json: kontrollerad ska vara ett datum (ÅÅÅÅ-MM-DD)");
  for (const id of ids) if (!Sk.appar?.[id]) fel.push(`sakerhet.json: appen ${id} saknas`);
  for (const [id, s] of Object.entries(Sk.appar ?? {})) {
    if (!ids.has(id)) fel.push(`sakerhet.json: okänd app ${id}`);
    if (!Array.isArray(s.teknik) || !Array.isArray(s.granskning)) fel.push(`sakerhet.json ${id}: teknik och granskning ska vara listor`);
    for (const k of Sk.ordning ?? []) {
      const p = s.punkter?.[k];
      if (!Sk.rubriker?.[k]) fel.push(`sakerhet.json: rubrik saknas för ${k}`);
      if (!Array.isArray(p) || !LAGE.includes(p[0]) || !p[1]) fel.push(`sakerhet.json ${id}: punkten ${k} ska vara [läge, text]`);
    }
  }
}

// Sidan kan vara publik: inga personuppgifter, hemligheter eller databas-id:n.
// Roller och beslut: data/roller.json ska ha rollerna ägare och granskare med namn och lista.
let Ro = null;
try { Ro = JSON.parse(readFileSync("data/roller.json", "utf8")); } catch (e) { fel.push("data/roller.json är inte giltig JSON: " + e.message); }
if (Ro) {
  const rid = new Set((Ro.roller ?? []).map((r) => r.id));
  for (const k of ["agare", "granskare"]) if (!rid.has(k)) fel.push(`roller.json: rollen ${k} saknas`);
  for (const r of Ro.roller ?? []) if (!r.namn || !r.person || !r.kort || !Array.isArray(r.godkanner) || !r.godkanner.length) fel.push(`roller.json: rollen ${r.id} saknar namn, person, kort eller godkanner`);
  if (!Array.isArray(Ro.flode) || !Array.isArray(Ro.ta_over)) fel.push("roller.json: flode och ta_over ska vara listor");
}
// Kontrollrum: data/kontrollrum.json får aldrig visa en siffra utan källa och datum.
let Kr = null;
try { Kr = JSON.parse(readFileSync("data/kontrollrum.json", "utf8")); } catch (e) { fel.push("data/kontrollrum.json är inte giltig JSON: " + e.message); }
if (Kr) {
  const KLAGE = ["verifierat", "drift", "planerad", "inte_verifierat", "ej_ansluten"];
  const matt = [...(Kr.oversikt ?? []), ...(Kr.resurser ?? []), ...Object.values(Kr.beslut ?? {}).filter((x) => x && typeof x === "object")];
  for (const m of matt) {
    if (!KLAGE.includes(m.lage)) fel.push(`kontrollrum.json: okänt läge ${m.lage} (${m.namn ?? "beslut"})`);
    if (m.lage === "verifierat" && (!m.kalla || !/^\d{4}-\d{2}-\d{2}$/.test(m.datum ?? ""))) fel.push(`kontrollrum.json: ${m.namn ?? "beslut"} är verifierat men saknar källa eller datum`);
    if (m.lage !== "verifierat" && m.varde !== undefined) fel.push(`kontrollrum.json: ${m.namn ?? "beslut"} har ett värde utan att vara verifierat`);
  }
  for (const id of Object.keys(Kr.organisation?.appagenter ?? {})) if (!ids.has(id)) fel.push(`kontrollrum.json: okänd app ${id}`);
  for (const id of ids) if (!Kr.organisation?.appagenter?.[id]) fel.push(`kontrollrum.json: appagent saknas för ${id}`);
  for (const [id, g] of Object.entries(Kr.organisation?.appagenter ?? {})) if (!["registrerad", "ansluten", "automatiserad"].includes(g.niva)) fel.push(`kontrollrum.json: ${id} saknar nivå`);
  if (!Kr.appregister?.kalla || !/^\d{4}-\d{2}-\d{2}$/.test(Kr.appregister?.datum ?? "")) fel.push("kontrollrum.json: appregistret saknar källa eller datum");
}
const text = readFileSync("data/appar.json", "utf8") + (Sk ? JSON.stringify(Sk) : "") + (Ro ? JSON.stringify(Ro) : "") + (Kr ? JSON.stringify(Kr) : "");
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

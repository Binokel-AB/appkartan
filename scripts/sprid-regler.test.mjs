import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allmanRegeltext, laggInRegler } from "./sprid-regler.mjs";

const kalla = readFileSync(new URL("../CLAUDE.md", import.meta.url), "utf8");
const regler = allmanRegeltext(kalla);
const agenter = {
  ".claude/agents/tester.md": readFileSync(new URL("../.claude/agents/tester.md", import.meta.url), "utf8"),
  ".claude/agents/security-reviewer.md": readFileSync(new URL("../.claude/agents/security-reviewer.md", import.meta.url), "utf8"),
};
const nyDir = () => mkdtempSync(join(tmpdir(), "sprid-test-"));
const f = (d, p) => readFileSync(join(d, p), "utf8");

test("allmän text saknar appkartans egna avsnitt men har reglerna", () => {
  assert.ok(!regler.includes("(appkartan)"));
  assert.ok(!regler.includes("node scripts/kontrollera.mjs"));
  assert.ok(regler.includes("CRM-nattmotorn är FRUSEN"));
  assert.ok(regler.includes("BESLUT BEHÖVS:"));
});

test("repo utan CLAUDE.md får hela filen och agenterna", () => {
  const d = nyDir();
  const gjort = laggInRegler(d, regler, agenter);
  assert.equal(f(d, "CLAUDE.md"), regler);
  assert.ok(existsSync(join(d, ".claude/agents/tester.md")));
  assert.equal(gjort.length, 3);
});

test("repots egen CLAUDE.md skrivs inte över, den får bara en import-rad", () => {
  const d = nyDir();
  const egen = "@AGENTS.md\n\n# Claude\n- Egen regel\n";
  writeFileSync(join(d, "CLAUDE.md"), egen);
  laggInRegler(d, regler, agenter);
  const c = f(d, "CLAUDE.md");
  assert.ok(c.startsWith(egen));
  assert.ok(c.includes("@.claude/binokel-regler.md"));
  assert.equal(f(d, ".claude/binokel-regler.md"), regler);
});

test("andra körningen ändrar ingenting", () => {
  const d = nyDir();
  writeFileSync(join(d, "CLAUDE.md"), "# Egen\n");
  laggInRegler(d, regler, agenter);
  assert.deepEqual(laggInRegler(d, regler, agenter), []);
  const d2 = nyDir();
  laggInRegler(d2, regler, agenter);
  assert.deepEqual(laggInRegler(d2, regler, agenter), []);
});

test("repots egna avsnitt 'Om just det här repot' bevaras vid uppdatering", () => {
  const d = nyDir();
  laggInRegler(d, regler, agenter);
  const med = f(d, "CLAUDE.md") + "Starta med `bun dev`.\n";
  writeFileSync(join(d, "CLAUDE.md"), med);
  const ny = allmanRegeltext(kalla.replace("Svara på svenska", "Svara alltid på svenska"));
  laggInRegler(d, ny, agenter);
  const c = f(d, "CLAUDE.md");
  assert.ok(c.includes("Svara alltid på svenska"));
  assert.ok(c.includes("Starta med `bun dev`."));
});

test("ändrad agentfil uppdateras", () => {
  const d = nyDir();
  laggInRegler(d, regler, agenter);
  mkdirSync(join(d, ".claude/agents"), { recursive: true });
  writeFileSync(join(d, ".claude/agents/tester.md"), "gammal");
  const gjort = laggInRegler(d, regler, agenter);
  assert.deepEqual(gjort, [".claude/agents/tester.md (uppdaterad)"]);
});

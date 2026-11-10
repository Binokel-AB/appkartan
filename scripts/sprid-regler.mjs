// Sprider Binokels gemensamma regler (CLAUDE.md) och agenterna i .claude/agents/ till alla appars repon.
// Öppnar bara PR:er. Mergar ALDRIG och pushar aldrig till main.
//
// Kör i GitHub Actions (.github/workflows/sprid-regler.yml) eller lokalt:
//   SPRID_TOKEN=... node scripts/sprid-regler.mjs [--torrkorning]
// --torrkorning: bygger ändringarna men pushar och öppnar ingen PR.
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const GREN = "claude/sprid-regler";
const ORG = process.env.SPRID_ORG || "Binokel-AB";
const BAS_URL = process.env.SPRID_BAS_URL || `https://github.com/${ORG}`;
const REGELFIL = ".claude/binokel-regler.md";
const IMPORT_RAD = `@${REGELFIL}`;
const AGENTER = [".claude/agents/tester.md", ".claude/agents/security-reviewer.md"];
const EGET_AVSNITT = "## Om just det här repot";
const RUBRIK = "# Binokels gemensamma regler";
const REPO_NAMN = /^[a-z0-9][a-z0-9._-]*$/i;

// Gör appkartans CLAUDE.md allmän: tar bort appkartans egna avsnitt.
export function allmanRegeltext(claudeMd) {
  const i = claudeMd.indexOf(EGET_AVSNITT);
  if (i < 0) throw new Error(`Hittar inte avsnittet "${EGET_AVSNITT}" i CLAUDE.md`);
  return (
    claudeMd
      .slice(0, i)
      .replace(/Lägg samma fil i alla appars repon \(se "Så sprids filen" längst ned\)\./, "Samma fil finns i alla appars repon. Källan är `CLAUDE.md` i repot `appkartan`.")
      .replace("Källa: `data/appar.json` i detta repo (appkartan).", "Källa: `data/appar.json` i repot `appkartan`.") +
    `${EGET_AVSNITT}\n\nLägg här korta fakta om just den här appen (hur den startas, hur den testas, särskilda regler). Huvudkällan för alla appar är repot \`appkartan\`.\n`
  );
}

// Behåller ett repos egna "Om just det här repot"-text när den generade filen skrivs om.
function medEgetAvsnitt(ny, befintlig) {
  const i = befintlig?.indexOf(EGET_AVSNITT) ?? -1;
  if (i < 0) return ny;
  return ny.slice(0, ny.indexOf(EGET_AVSNITT)) + befintlig.slice(i);
}

const les = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
function skriv(p, text) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

// Lägger in reglerna i ett repo (en katalog). Skriver aldrig över ett repos egen CLAUDE.md.
// Returnerar vad som gjordes, för loggen och PR-texten.
export function laggInRegler(dir, regeltext, agenttexter) {
  const gjort = [];
  const claudePath = join(dir, "CLAUDE.md");
  const claude = les(claudePath);

  if (claude === null) {
    skriv(claudePath, regeltext);
    gjort.push("CLAUDE.md (ny)");
  } else if (claude.startsWith(RUBRIK)) {
    // Filen är själv den genererade; uppdatera den men behåll repots egna avsnitt.
    const ny = medEgetAvsnitt(regeltext, claude);
    if (ny !== claude) { skriv(claudePath, ny); gjort.push("CLAUDE.md (uppdaterad)"); }
  } else {
    // Repots egen CLAUDE.md: reglerna ligger i en egen fil som importeras.
    const regelPath = join(dir, REGELFIL);
    const befintlig = les(regelPath);
    const ny = medEgetAvsnitt(regeltext, befintlig);
    if (ny !== befintlig) { skriv(regelPath, ny); gjort.push(`${REGELFIL} (${befintlig === null ? "ny" : "uppdaterad"})`); }
    if (!claude.includes(IMPORT_RAD)) {
      skriv(claudePath, claude.replace(/\n*$/, "\n") + `\n${RUBRIK}\n${IMPORT_RAD}\n`);
      gjort.push("CLAUDE.md (import-rad)");
    }
  }

  for (const f of AGENTER) {
    const p = join(dir, f);
    const fanns = existsSync(p);
    if (les(p) !== agenttexter[f]) { skriv(p, agenttexter[f]); gjort.push(`${f} (${fanns ? "uppdaterad" : "ny"})`); }
  }
  return gjort;
}

// ---- Körning mot GitHub ----
function kor(cmd, args, opt = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opt }).trim();
}

function repoLista() {
  const d = JSON.parse(readFileSync(join(ROT, "data/appar.json"), "utf8"));
  const namn = [...new Set((d.appar ?? []).map((a) => a.repo).filter(Boolean))];
  for (const n of namn) if (!REPO_NAMN.test(n)) throw new Error(`Ogiltigt repo-namn i appar.json: ${n}`);
  return namn.filter((n) => n !== "appkartan");
}

function main() {
  const torr = process.argv.includes("--torrkorning");
  const token = process.env.SPRID_TOKEN;
  if (!token && !process.env.SPRID_BAS_URL) {
    console.error("SPRID_TOKEN saknas. Lägg en åtkomsttoken med Contents och Pull requests (skriv) som hemlighet SPRID_TOKEN i appkartan.");
    process.exit(1);
  }
  const regeltext = allmanRegeltext(readFileSync(join(ROT, "CLAUDE.md"), "utf8"));
  const agenttexter = Object.fromEntries(AGENTER.map((f) => [f, readFileSync(join(ROT, f), "utf8")]));
  const auth = token ? ["-c", `http.extraheader=AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`] : [];
  const ghEnv = { ...process.env, GH_TOKEN: token ?? "" };
  const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? "lokalt";
  const tmp = mkdtempSync(join(tmpdir(), "sprid-"));
  const rapport = [];

  for (const repo of repoLista()) {
    const dir = join(tmp, repo);
    try {
      kor("git", [...auth, "clone", "-q", "--depth", "1", `${BAS_URL}/${repo}`, dir]);
      const bas = kor("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: dir });

      if (!torr && token) {
        // Ett första utrullnings-PR (claude/lagg-till-regler) kan vara öppet: gör inte dubbla PR:er.
        const oppna = kor("gh", ["api", `repos/${ORG}/${repo}/pulls?state=open&per_page=100`, "--jq", ".[].head.ref"], { env: ghEnv });
        if (oppna.split("\n").includes("claude/lagg-till-regler")) { rapport.push(`${repo}: hoppade över (det första regel-PR:et är fortfarande öppet)`); continue; }
      }

      kor("git", ["checkout", "-q", "-B", GREN], { cwd: dir });
      const gjort = laggInRegler(dir, regeltext, agenttexter);
      if (gjort.length === 0) { rapport.push(`${repo}: redan aktuell`); continue; }
      if (torr) { rapport.push(`${repo}: skulle ändra ${gjort.join(", ")}`); continue; }

      kor("git", ["add", "-A"], { cwd: dir });
      kor("git", ["-c", "user.name=binokel-regler[bot]", "-c", "user.email=noreply@users.noreply.github.com", "commit", "-q", "-m",
        `Uppdatera Binokels gemensamma regler och agenter (från appkartan ${sha})`], { cwd: dir });
      // Grenen ägs av spridningen och byggs om från basgrenen varje gång, så en vanlig force-push är rätt här.
      kor("git", [...auth, "push", "-q", "--force", "origin", GREN], { cwd: dir });

      const oppnaPr = kor("gh", ["api", `repos/${ORG}/${repo}/pulls?state=open&head=${ORG}:${GREN}`, "--jq", ".[0].html_url // empty"], { env: ghEnv });
      if (oppnaPr) { rapport.push(`${repo}: uppdaterade ${oppnaPr}`); continue; }
      const kropp =
        `## Vad\nGemensamma regler och agenter från repot \`appkartan\` (commit ${sha}) har ändrats.\n\n` +
        `Ändrat här: ${gjort.join(", ")}.\n\n` +
        `Repots egen \`CLAUDE.md\` skrivs inte över. Reglerna ligger i \`${REGELFIL}\`. Agentfilerna i \`.claude/agents/\` skrivs över med appkartans version.\n\n` +
        `Ingen appkod eller data ändras. Mergas av en människa; spridningen mergar aldrig.\n\n` +
        `🤖 Skapad automatiskt av Sprid regler i appkartan.`;
      const url = kor("gh", ["api", "-X", "POST", `repos/${ORG}/${repo}/pulls`, "-f", `base=${bas}`, "-f", `head=${GREN}`,
        "-f", "title=Uppdatera Binokels gemensamma regler och agenter", "-f", `body=${kropp}`, "--jq", ".html_url"], { env: ghEnv });
      rapport.push(`${repo}: ny PR ${url}`);
    } catch (e) {
      // Aldrig e.message: den innehåller hela kommandoraden, inklusive token-huvudet.
      const fel = String(e.stderr || "").split("\n").find((r) => r.trim()) || `kommandot misslyckades (status ${e.status ?? "okänd"})`;
      rapport.push(`${repo}: FEL ${fel}`);
      process.exitCode = 1;
    }
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(rapport.join("\n"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();

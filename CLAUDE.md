# Binokels gemensamma regler (gäller ALLA Binokels appar)

Den här filen läses av Claude Code i varje Binokel-repo. Lägg samma fil i alla appars repon (se "Så sprids filen" längst ned).

## Så pratar du

- Svara på svenska, med enkla ord. Förklara som för någon som inte är utvecklare.
- Korta svar. Säg vad du gjort, vad som återstår och om något är trasigt.

## Så arbetar du

1. **GitHub först, Lovable sist.** Gör ändringar i koden i GitHub. Använd Lovable bara om det inte går att göra i GitHub, och **aldrig så att betalda Lovable-krediter går åt**. Är du osäker: gör inget i Lovable och fråga.
2. **Allt via PR.** Aldrig push direkt till `main` och aldrig något direkt till produktion. Arbeta på en gren, öppna en PR och låt Daniel godkänna.
3. **Kör `/security-review` innan en PR markeras klar** (se "Säkerhet" nedan).
4. **Inga farliga steg utan Daniels uttryckliga ja:**
   - radera något (filer, rader i databasen, grenar, appar, användare)
   - skicka mejl, SMS eller andra meddelanden
   - göra en betalning eller något som kostar pengar
   Ett ja gäller bara det Daniel just godkände, inte liknande saker senare.
5. **Skriv aldrig hemligheter i kod eller PR.** Inga lösenord, nycklar, tokens, personnummer, kund- eller patientuppgifter. Hemligheter ligger i Nyckelvalvet.
6. **Rapportera ärligt.** Misslyckas ett test, säg det och visa felet. Säg inte "klart" om något inte är verifierat.
7. **Inget "klart" förrän det är provat i produktion.** Ingen får höra att något är rättat (inte Christian, inte personalen, inte Daniel, och ingen feedback sätts till Redo att testa) förrän:
   - ändringen är mergad **och publicerad**. En merge till `main` syns i Lovable men är **inte** ute i den publicerade appen.
   - den publicerade appen kör din version. Jämför `x-deployment-id` eller versionen med din publicering.
   - du själv har provat just det flöde som var trasigt, i den publicerade appen, med ett eget testkonto. Använd aldrig Daniels, Christians eller personalens konton, och använd testdata eller en testlektion, aldrig riktiga kunder.

   Går något av det inte att göra, säg exakt hur långt det har kommit (mergat, publicerat, ej provat) och vad som saknas.
8. **Behörigheter och roller via PR och Daniels ja.** Nya konton, roller, admin-rättigheter, pilotrader, RLS och hemligheter ändras bara som en PR (eller ett granskat SQL-skript i en PR). Fråga Daniel innan den mergas eller körs mot produktionen.

## Beslut: så ber du om ett

När ett beslut behövs som bara Daniel kan fatta, skriv tydligt:

> **BESLUT BEHÖVS:** <en ja/nej-fråga>. Min rekommendation: <ja eller nej, och varför i en mening>.

Fortsätt sedan med annat arbete som inte beror på beslutet. Vänta inte och gissa inte.

## CRM-nattmotorn är FRUSEN

Rör inte dessa delar (i Kunduppföljning/CRM). Ändra inte, flytta inte, döp inte om, kör inte om:

- `sync-legacy`
- `process-jobs`
- `enqueue-daily-jobs`
- `expire-dormant`
- `activate-due-rechecks`
- cron (schemaläggningen)
- `insikt_kund_aggregat`
- `create_store_snapshot`
- `feedback_status_guard`

Behöver en uppgift ändra något av detta: stoppa och skriv **BESLUT BEHÖVS:**.

## Säkerhet

Innan en PR markeras klar, kör `/security-review` och åtgärda det den hittar. Du kan också använda agenten `security-reviewer`. Kontrollera särskilt:

- RLS (radnivåsäkerhet) på varje tabell, och att butiksavgränsning och roller stämmer
- inga nycklar eller hemligheter i koden
- inloggning och behörighet på varje sida och varje edge function

## Agenter i `.claude/agents/`

- `tester` – testar appen, kör tester och rapporterar fel
- `security-reviewer` – granskar säkerhet (RLS, nycklar i kod, inloggning)

Rapporterar de fel: rätta dem eller skriv **BESLUT BEHÖVS:** om rättningen kräver ett val.

## Vilken skill när

Skills ligger i `.claude/skills/<namn>/`. Binokels regler här går **alltid före** en skill. Hela listan och källorna: `verktygslada.md` i repot `appkartan`. En skill som skapar ärenden, stänger ärenden, skickar något eller rör nycklar och behörigheter kräver Daniels ja, precis som annars.

| Läge | Använd |
|---|---|
| Rätta, bygga eller ändra kod i en Binokel-app | `binokel-utveckling` (alltid), och `binokel-feedback` för feedbackpunkter |
| Något ska provas på mobil, iPad eller dator | `binokel-enhetstest` |
| Säkerhetsfråga, RLS, roller, hemligheter | `binokel-sakerhet` och agenten `security-reviewer` |
| Svår bugg eller något som plötsligt går långsamt | `diagnosing-bugs` |
| Ny funktion eller rättning test-först | `tdd` |
| Granska ändringar före PR | `/code-review` och `/security-review`; `pocock-code-review` bara när koden ska mätas mot ett ärende eller en spec |
| Skriva PR-text | `pr` (Binokels PR-regler gäller) |
| Planera större arbete | `grill-with-docs`, sedan `to-spec` och `to-tickets` (de skapar ärenden i GitHub: fråga först); mycket stort arbete: `wayfinder` |
| Genomföra en färdig spec | `implement` eller `implement-spec` |
| Städa upp struktur eller design av moduler | `improve-codebase-architecture`, `codebase-design` |
| Ta reda på något mot pålitliga källor | `research` |
| Snabb prototyp, logik eller en enda skärm | `prototype`; flera olika gränssnittsvarianter: `kowalski-prototype` |
| Rörelse och animation i gränssnittet | `animate` (bygga), `review-animations` (granska), `find-animation-opportunities`, `improve-animations`, `remove-animations`, `animation-performance` (hackar), `choreograph` (flera saker rör sig ihop) |
| Dra, svep, bottenpaneler | `gestures` |
| Känns som en webbsida, inte en app, på mobilen | `mobile-native` |
| Prova att gränssnittet håller för långa namn och konstiga data | `break-ui` |
| Gränssnittets känsla och finish | `emil-design-eng`, `apple-design` |
| Texter, SEO eller sidstruktur (bara `clear-vision-north` och `northern-lens-learning-quest`) | `copywriting`, `copy-editing`, `humanizer`, `seo-audit`, `site-architecture`, `emails` (utkast; skicka aldrig utan Daniels ja) |
| Mejl, svar eller meddelanden i Daniels namn | `binokel-utskick` |

Används **inte** hos oss: `wizard` (finns inte), `write-swift` och `animate-expo` (vi bygger webbappar), `setup-matt-pocock-skills` och `triage` (ändrar repots inställningar eller stänger ärenden: bara efter Daniels ja).

**Nya verktyg och idéer:** Daniel skickar en länk. Claude kollar den och lägger in den i `verktygslada.md` med ett domslut (Använd, Kanske senare eller Undvik). Bara "Använd" byggs in, som en PR efter Daniels ja. Rutinen står i `verktygslada.md`.

## Binokels appar (kort)

Källa: `data/appar.json` i detta repo (appkartan). Står något annorlunda där, gäller appkartan.

**Kundresan**

| App | Repo | Till för |
|---|---|---|
| GlasFlow | `glasflow-order-track` | Varje glasögonorder från foto till leverans; butiker och montörer ser var ordern är. |
| Kunduppföljning (Binokel CRM) | `huggy-beacon` | Vårt CRM: ingen kund glöms bort efter köpet. **Nattmotorn är frusen.** |
| Säljstödet (Vision Builder Pack) | `semantic-mapping-kit` | Rätt glas, paket och pris i alla butiker. |
| Anamnesportalen | `anamnesis-guardian-portal` | Kunden svarar på hälsofrågor hemma före synundersökningen. |
| Förmätningsappen (Optic Measure) | `eye-scan-wizard` | Butiker utan optiker på plats kan ändå ta emot kunder (optikern granskar på distans). |

**Personal och verksamhet**

| App | Repo | Till för |
|---|---|---|
| Personalappen | `staffflow-optimizer` | Schema, tid, frånvaro och lön; talar om vem du är i de andra apparna (whoami). |
| Niemis Academy | `northern-lens-learning-quest` | Utbildning, rutiner och assistenten Iris. |
| Binokel Insikt | `binokel-insikt` | Ledningen ser resultat och nyckeltal per butik utan att leta i fem system. |
| Spargris | `glasost-koll` | Butikerna ser varje dag hur det går mot målet. |
| Niemis Beställning | `inventory-binokel` | Lagret fylls på utan listor och bristmejl. |
| Synpunkten | `opti-care-hub-8b5c98d0` | Avvikelser, reklamationer och förbättringsförslag. |
| Hemsidan och webbshoppen | `clear-vision-north` | Kunder hittar oss, bokar och handlar. |

**Bakom kulisserna**

| Del | Repo | Till för |
|---|---|---|
| Blueprint | `binokel-blueprint` | Agenternas karta över system, beslut och planer. |
| Nyckelvalvet | – | Lösenord och nycklar ligger säkert, inte i Drive. |
| Motorerna | – | AI som kontrollerar drift och säkerhet på natten och sorterar inkorgen. |
| Appkartan | `appkartan` | Denna sida: översikt över alla appar (vanlig HTML, ingen Lovable). |

## Om just det här repot (appkartan)

Vanlig HTML, CSS och JavaScript, inget byggsteg. Innehållet står i `data/appar.json`. Testa med `node scripts/kontrollera.mjs`. Skriv aldrig nycklar, databas-id:n, e-postadresser eller person-/kunduppgifter i `data/`. Mer i `README.md`.

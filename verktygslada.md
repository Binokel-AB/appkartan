# Binokels verktygslåda

Här står vad vi har installerat, vad det är till för och var det finns, och vad vi har bestämt om nya idéer. En rad per sak. Tabellen "Vilken skill när" finns också i `CLAUDE.md`, så att Claude ser den i varje repo.

Senast uppdaterad 2026-11-11. Binokels regler (`CLAUDE.md`) går alltid före alla skills och verktyg. Ingen skill får röra nycklar, behörigheter, utskick eller radering utan Daniels ja.

## Skills

Skills ligger i `.claude/skills/<namn>/` i varje app-repo. Källor, exakta versioner (commit) och licenser står i `.claude/skills/KALLOR.md` i varje repo.

### Binokels egna

| Skill | Till för | Var |
|---|---|---|
| `binokel-utveckling` | Hur vi bygger, rättar, granskar, mergar och publicerar kod. Alltid först vid kodarbete | `.claude/skills/` i app-repona och som kontoskill i Claude |
| `binokel-arbetssatt` | Grunden för allt arbete åt Daniel och Niemis Optik | Kontoskill i Claude |
| `binokel-appandring` | Förstå, läsa kod och data, välja väg och testa en ändring | Kontoskill i Claude |
| `binokel-feedback` | Gå igenom och åtgärda personalens feedback | Kontoskill i Claude |
| `binokel-enhetstest` | Prova mobil, iPad och dator, särskilt Safari och butikernas delade enheter | Kontoskill i Claude |
| `binokel-sakerhet` | Säkerhetskontroll: RLS, roller, hemligheter, patient- och kunddata | Kontoskill i Claude |
| `binokel-utskick` | Regler för mejl och meddelanden i Daniels namn | Kontoskill i Claude |

### Matt Pocock, engineering (MIT, 18 skills) i alla 13 app-repon

Källa: github.com/mattpocock/skills. Utan `wizard`, som hanterar nycklar. `code-review` heter här `pocock-code-review`.

| Skill | Till för |
|---|---|
| `ask-matt` | Vilken skill passar mitt läge? |
| `diagnosing-bugs` | Metod för svåra buggar och prestandaproblem |
| `tdd` | Bygga eller rätta test-först |
| `pocock-code-review` | Granska ändringar mot repots regler och mot ärendet eller specen |
| `pr` | Skriva en bra PR-text |
| `grill-with-docs` | Fråga ut en plan tills den håller, och skriv ADR och ordlista |
| `to-spec` | Göra en spec av samtalet och lägga den i ärendehanteringen |
| `to-tickets` | Dela upp en plan i ärenden |
| `implement` och `implement-spec` | Genomföra arbete utifrån en spec eller ärenden |
| `wayfinder` | Planera mycket stort arbete som en karta av beslut |
| `improve-codebase-architecture` | Hitta ställen att förenkla kodens struktur och rapportera visuellt |
| `codebase-design` | Ord och regler för bra moduler |
| `domain-modeling` | Ordlista och beslutsloggar (ADR) |
| `research` | Undersöka en fråga mot pålitliga källor och spara svaret som fil |
| `prototype` | Kastbar prototyp för att svara på en designfråga |
| `retro` | Se tillbaka på en arbetssession |
| `triage` | Sortera och stäng ärenden (bara efter Daniels ja) |
| `setup-matt-pocock-skills` | Ställer in repot för skillsen (körs bara på begäran, rör `AGENTS.md`) |

### Emil Kowalski (MIT, 18 skills) i alla 13 app-repon

Källa: github.com/emilkowalski/skills. `prototype` heter här `kowalski-prototype`.

| Skill | Till för |
|---|---|
| `emil-design-eng` | Känsla och finish i gränssnitt |
| `apple-design` | Apples sätt att tänka på gränssnitt och rörelse, för webben |
| `animate` | Bygga en animation, i rätt ordning av beslut |
| `review-animations` | Granska rörelse i koden |
| `find-animation-opportunities` | Hitta ställen som borde röra sig (läser bara) |
| `improve-animations` | Genomlysning och plan för rörelsen i en kodbas |
| `remove-animations` | Ta bort rörelse som inte behövs |
| `animation-performance` | Animationer som hackar |
| `animation-vocabulary` | Rätt ord för en rörelse man ser |
| `choreograph` | Flera saker som rör sig ihop |
| `gestures` | Dra, svep och paneler som följer fingret |
| `mobile-native` | Få en webbapp att kännas som en app på mobilen |
| `break-ui` | Prova gränssnitt med värsta tänkbara data |
| `ask-sonner` | Toast-biblioteket Sonner |
| `pick-ui-library` | Välja bibliotek för en frontend-uppgift |
| `kowalski-prototype` | Flera olika versioner av en UI-bit bakom en väljare |
| `animate-expo` och `write-swift` | Hör till mobilappar (Expo, Swift). Vi bygger webbappar, så de används inte |

### Corey Haines, marknadsföring (MIT, 5 skills)

Källa: github.com/coreyhaines31/marketingskills. Bara de fem, inga annons- eller analysskills. **Finns bara i `clear-vision-north` (hemsidan) och `northern-lens-learning-quest` (Academy).**

| Skill | Till för |
|---|---|
| `seo-audit` | Hitta och förklara SEO-problem |
| `copywriting` | Skriva eller skriva om sidtexter |
| `copy-editing` | Putsa och korta befintliga texter |
| `emails` | Utkast till automatiska mejlflöden (skicka aldrig utan Daniels ja) |
| `site-architecture` | Planera sidor, meny och länkar |

### Humanizer v3.1.0 (MIT)

Källa: github.com/blader/humanizer, låst till taggen v3.1.0 (inte v4). `humanizer` skriver om text som låter som AI så att den låter som skribenten. Finns bara i `clear-vision-north` och `northern-lens-learning-quest`.

### Inbyggda i Claude Code

| Skill | Till för |
|---|---|
| `/code-review` | Granska den aktuella ändringen eller en PR |
| `/security-review` | Säkerhetsgranskning. Ska köras innan en PR markeras klar |
| `/simplify` | Städa i ändrad kod |
| `/run` | Starta appen och se att en ändring fungerar |
| `/loop` | Köra något återkommande medan en session pågår |

## Agenter

I `.claude/agents/` i alla repon (från `appkartan`, sprids av Actionen Sprid regler):

| Agent | Till för |
|---|---|
| `tester` | Testar appen, kör tester och rapporterar fel |
| `security-reviewer` | Granskar RLS, nycklar i kod och inloggning |

## Automatiskt

| Vad | Till för | Var |
|---|---|---|
| Publicera appkartan | Kontrollerar och publicerar den här sidan | `.github/workflows/pages.yml` i `appkartan` |
| Sprid regler | Öppnar PR:er i alla repon när reglerna eller agenterna ändras (mergar aldrig) | `.github/workflows/sprid-regler.yml`. Kräver hemligheten `SPRID_TOKEN` |
| Automerge av säkerhetsdata | Mergar PR:er som bara ändrar `data/sakerhet.json` när kontrollen är grön | `.github/workflows/automerge-sakerhet.yml` |
| Rutiner (routines) | Morgonrapport varje vardag, veckogranskning av säkerhet per app, idé- och SEO-genomgång av hemsidan | claude.ai/code/routines |

## Kopplingar (MCP)

| Koppling | Till för |
|---|---|
| GitHub | Läsa och skriva i repona via PR (aldrig direkt till `main`) |
| Binokel Insikt | Verifierade siffror per butik och månad (inga löner, personer, kunder eller patienter) |
| Niemis Academy | Läsa innehåll och feedback, spara utkast (publicerar aldrig) |
| Supabase | Läsa och granska databaser (skrivande ändringar bara via PR och Daniels ja) |
| Lovable | Läsa projekt. Aldrig `send_message` eller `deploy_project` som drar betalda krediter |
| Google (Drive, Gmail, Kalender, Dokument, Kalkylark, Presentationer) | Dokument, kalender och mejlutkast. Inga utskick utan Daniels ja |

## Idéer från videon

Domslut av Daniel (via Grok) 2026-11-11. Claude har inte själv granskat verktygen nedan; rubriken beskriver bara det Claude är säker på. Ett verktyg byggs in först efter en egen granskning enligt rutinen längst ned.

| Verktyg | Domslut | Anteckning |
|---|---|---|
| OpenWhispr | **Använd** | Öppen programvara för att prata in text i stället för att skriva. Programmet installeras på Daniels dator. Ingenting är installerat än, och ingen kod ändras i repona |
| Cap | **Använd** | Öppen programvara för att spela in skärmen (som Loom). Installeras på Daniels dator. Ingenting är installerat än |
| Chatwoot | Kanske senare | Öppen inkorg för kundkontakt. Vänta tills vi vet om vi behöver en gemensam inkorg |
| open-seo | Kanske senare | SEO-verktyg. Vi har redan `seo-audit` |
| morluto/rea | **Undvik** | Bryter troligen mot villkor och upphovsrätt (Daniels bedömning) |
| cal.diy | **Undvik** | |
| OpenProject | **Undvik** | Projektverktyg. Vi har redan GitHub och Blueprint |
| WeKnora | **Undvik** | |
| VoiceStudio | **Undvik** | |
| open-higgsfield | **Undvik** | |

## Rutin för nya idéer

1. **Länk.** Daniel skickar en länk till ett verktyg, en skill eller en idé.
2. **Koll.** Claude läser det, kontrollerar licens, vad det gör, vad det kommer åt (nycklar, data, nätverk, behörigheter) och om det krockar med Binokels regler. Inget körs eller installeras under kollen.
3. **Domslut.** Claude lägger in en rad i tabellen "Idéer" ovan med **Använd**, **Kanske senare** eller **Undvik** och en kort förklaring. Är något oklart skriver Claude det, i stället för att gissa.
4. **Bygg.** Bara "Använd" byggs in, som en PR (skills hamnar i `.claude/skills/` med källa och exakt version i `KALLOR.md`) och bara efter Daniels ja. Det som bara ändrar text, som den här filen, får mergas när det är grönt utan att fråga.
5. **Gränser.** Ingen idé får kräva nycklar, ändra behörigheter eller skicka något åt Daniel utan hans uttryckliga ja. Verktyg som hanterar nycklar byggs inte in.

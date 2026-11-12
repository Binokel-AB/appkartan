# Binokels AI-utvecklingsorganisation (förslag, omgång 1)

Status: **förslag**. Inget här gäller förrän Daniel har godkänt PR:en. Ingen körning, regel eller behörighet är ändrad av det här dokumentet.

Skrivet 2026-11-11 efter en inventering av Agent Core, Blueprint, de schemalagda körningarna, GitHub och Appkartan. Sidan är publik: här står inga nycklar, databas-id:n, personuppgifter eller detaljer om säkerhetsluckor.

## 1. Organisationen

| Nivå | Vem | Gör |
|---|---|---|
| 1 | Daniel och Christian | Beslutar. Daniel: strategi, patientdata, större säkerhetsrisker, ägarbeslut. Christian: verksamhet, ekonomi, större funktioner, prioritering. |
| 2 | Grok Bot | Daniels enda ingång. Tar emot idéer, läser upp beslutsfrågor, visar status. Utvecklar inget och klickar inte i Claude-chattar. |
| 3 | Huvudagenten | En Claude-session med helhetsansvar. Sorterar idéer till rätt app, följer upp att saker blir klara, skickar beslutsfrågor, håller Appkartan aktuell. |
| 4 | Appagenter | En schemalagd Claude-körning per app. Läser appens kö, rättar, testar, publicerar det som är lågrisk och frågar om resten. |
| 5 | Specialister | `tester` och `security-reviewer` i varje repos `.claude/agents/`, plus skills enligt tabellen "Vilken skill när" i `CLAUDE.md`. |

En appagent är inte en chatt. Den är en körning som startar från noll varje gång och läser sitt läge ur repot, appens feedbacktabell och den gemensamma kön. Därför kan vilken agent som helst ta över.

## 2. Var saker bor (inget nytt byggs)

| Behov | Hemvist som redan finns |
|---|---|
| Karta över appar och kopplingar | Appkartan (`data/appar.json`) |
| Arbetskö per app | Appens feedbacktabell och issues/PR:er i appens repo |
| Beslutsfrågor till Daniel och Christian | Blueprints frågekö (`question_queue`) |
| Tidigare beslut | Blueprints `decisions` |
| Historik, överlämningar, vem som gör vad | Agent Core (`sessions`, `events`, `claims`) |
| Lägesbild för statusfrågor | Agent Cores `context_snapshots`, skrivs varje natt |
| Spärr före merge | `scripts/binokel-merge.sh` i varje repo: grön `binokel-check` och en oberoende granskning som börjar med GODKÄND |
| Budget och nödstopp | Agent Cores `workflows` (dags- och månadsbudget) och `circuit_breakers` |

## 3. Flödet

1. Personal trycker på feedbackknappen, eller Daniel säger en idé till Grok.
2. Huvudagenten lägger saken i rätt apps kö. En idé som rör flera appar blir en rad per app med samma ursprung.
3. Appagenten tar de översta sakerna, söker tidigare beslut och liknande ärenden, rättar på en egen gren och kör tester.
4. En oberoende agent granskar. Riskklassen avgör nästa steg (avsnitt 4).
5. Lågrisk: merge med `binokel-merge.sh`, publicering, kontroll i den publicerade appen. Feedbacken sätts till Redo att testa.
6. Bara rapportören sätter Godkänd.
7. Det som kräver beslut blir en fråga i frågekön med bakgrund, alternativ, konsekvens och rekommendation. När svaret är registrerat fortsätter arbetet vid nästa körning.

Händelsestyrt i första hand: ny feedback eller ett registrerat beslut startar appens körning. Det nattliga schemat är reserv.

## 4. Riskpolicy (ersätter "merga aldrig")

| Risk | Exempel | Vem beslutar |
|---|---|---|
| Låg | Avgränsad buggrättning, text, utseende, test. Inga ändringar i data, behörigheter eller serverfunktioner. | Ingen. Går ut själv efter grön kontroll och godkänd oberoende granskning. |
| Medel | Nytt verksamhetsbeteende, större funktion, ändrat arbetsflöde, priser, rutiner. | Christian. |
| Hög | Patientdata, radskydd och roller, nycklar, migrationer, serverfunktioner, radering, utskick, strategiska ändringar. | Daniel. Christian deltar när ekonomi eller behörigheter berörs. |

Villkor för automatisk publicering av lågrisk, alla ska vara uppfyllda:

- `binokel-check` är grön på exakt den commit som mergas.
- En annan agent än den som skrev ändringen har granskat och svarat GODKÄND.
- Ändringen rör inte `supabase/`, `.github/`, `scripts/binokel-*`, serverfunktioner eller behörigheter.
- Appen står inte på undantagslistan.
- Det går att backa: föregående publicerade version är noterad innan publicering.
- Butikernas huvudskärmar publiceras bara 22–06.

Undantagslista tills vidare: GlasFlow (öppna säkerhetspunkter och en väntande rättighetsändring), Anamnesportalen (patientdata) och Kunduppföljningens frysta nattmotor.

## 5. Motstridiga regler som måste rättas

| Nr | Regel A | Regel B | Förslag |
|---|---|---|---|
| 1 | Blueprint-beslut 2026-10-27: godkända rättningar publiceras direkt efter oberoende granskning | De schemalagda körningarna från 2026-11-10: "MERGA ALDRIG och publicera aldrig". `data/roller.json`: agenterna godkänner ingenting | Riskpolicyn i avsnitt 4 gäller. Körningarna och roller.json skrivs om. |
| 2 | Blueprint-beslut 2026-10-27/28 och `CLAUDE.md`: GitHub först, Lovable sist, inga krediter | Skillen `binokel-utveckling` 2.0 (2026-11-04): rätta direkt i Lovable, krediter är ok | En väg: kod via GitHub, Lovable bara för att bygga och publicera. Skillen skrivs om. |
| 3 | Skillarna `binokel-arbetssatt` 4.0 och `binokel-utveckling` 2.0: schemalägg inte granskare eller uppföljningar | Över 20 schemalagda körningar skapade 2026-11-10 | Schemalagda appagenter är tillåtna. Förbudet gäller påminnelser för att "fortsätta senare". |
| 4 | Feedback ägs av "Morgonkoll feedback i alla appar" på ett annat konto (sedan 2026-11-04) | Körningarna "feedback, fel och robusthet" per app på det här kontot (2026-11-10) | En ägare per app. Den ena avvecklas innan något automatiseras. |
| 5 | Blueprint: "Grok Bot är huvudagent" har status förslag. Agent Core: testperiod | `data/roller.json`: "Claude, ledda av Grok" | Grok är ingång, huvudagenten är en Claude-session. Beslutet registreras. |
| 6 | `data/roller.json`: bara Ägaren godkänner behörigheter och roller | Nya uppdraget: Christian ansvarar för behörigheter och användaradministration | Christian: vilka personer som har vilken roll. Daniel: tekniska ändringar i radskydd, roller och nycklar. |
| 7 | PR 16 i appkartan (gröna PR:er går ut utan att fråga) är öppen | `CLAUDE.md` i alla repon säger fortfarande "låt Daniel godkänna" | PR 16 ersätts av riskpolicyn och sprids till alla repon i ett steg. |

## 6. Resurs- och kreditkontroll

Det som finns: Agent Core mäter varje modellanrop via API i kronor, har dags- och månadsbudget per arbetsflöde och ett nödstopp. Senaste 30 dagarna: 0 kr i API-kostnad, eftersom allt arbete går på abonnemang.

Det som saknas: abonnemangen (Claude, Grok, ChatGPT, Lovable) och Lovable-krediterna mäts inte på ett ställe. Blueprint-beslutet "AI-abonnemang och kostnader" har status förslag.

Plan:

1. En rad per leverantör och månad: abonnemang, förbrukade krediter, API-kostnad. Huvudagenten fyller i den första måndagen varje månad.
2. Varje appkörning loggar en rad i Agent Core: app, antal rättningar, antal publiceringar, modell.
3. Tak per app: högst fyra rättningar per körning (gäller redan) och högst en Lovable-publicering per app och natt, så att flera rättningar går ut i samma bygge.
4. Enkel modell för säkerhetsgranskning och läsning, stark modell för kodändringar. Så är körningarna redan uppsatta.
5. Grok läser lägesbilden, inte kodbaser. Statusfrågor ska inte kosta ett nytt modellanrop hos Claude.
6. Nödstopp: lågprioriterade körningar (SEO, idéer, robusthet) pausas först när en gräns nås.

## 7. Nästa steg

1. Daniel och Christian svarar på beslutsfrågorna i slutrapporten.
2. En ägare för feedback per app. Dubbletten stängs.
3. Reglerna skrivs om på ett ställe (`CLAUDE.md` här) och sprids till alla repon. Skillarna och roller.json följer med.
4. Pilot med automatisk publicering av lågrisk i två appar utan patientdata, en vecka.
5. Huvudagentens session och Groks koppling till den, sedan övriga appar.

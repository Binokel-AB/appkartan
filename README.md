# Binokels Appkarta

En enkel webbsida som visar alla Binokels och Niemis Optiks appar: vad de gör, varför de finns, hur de hänger ihop, vilka delar som är gemensamma och vad som pågår. Mobilen först.

Sidan är vanlig HTML, CSS och JavaScript utan byggsteg. Den publiceras gratis med GitHub Pages och använder inte Lovable.

## Så uppdaterar du sidan

1. Öppna `data/appar.json` i GitHub och tryck på pennan.
2. Ändra texten. Varje app har fälten `namn`, `kort`, `gor`, `varfor`, `anvands_av`, `inloggning`, `databas`, `repo`, `adress`, `kopplingar` och `pagar`.
3. Spara (commit). GitHub kontrollerar filen och publicerar sidan på någon minut.

Gemensamma delar står under `gemensamt`. `har` är apparna som använder delen, `pa_vag` är apparna där den kopplas in.

## Regler för innehållet

- Sidan kan vara publik. Skriv aldrig lösenord, nycklar, databas-id:n, e-postadresser eller kund- och personuppgifter här. Tekniska id:n finns i Blueprint, lösenord i Nyckelvalvet.
- `scripts/kontrollera.mjs` stoppar publiceringen om filen är trasig, om en ikon saknas eller om något ser ut som en personuppgift eller nyckel.
- Ny ikon: lägg en SVG i `icons/` i samma stil (512×512, rundad mörkblå ruta `#2D3E66`, Niemis-ögat `#1B5EAA`, orange detalj `#E6670C`).

## Prova lokalt

```sh
node scripts/kontrollera.mjs
python3 -m http.server 8000   # öppna http://localhost:8000
```

## Spridning av regler till alla appar

`CLAUDE.md` och `.claude/agents/` i detta repo är källan för alla Binokels appar. När de ändras på `main` öppnar Actionen **Sprid regler** (`.github/workflows/sprid-regler.yml`, `scripts/sprid-regler.mjs`) en PR per app-repo på grenen `claude/sprid-regler`. Den mergar aldrig något; en människa godkänner varje PR.

- Ett repos egen `CLAUDE.md` skrivs inte över. Reglerna hamnar i `.claude/binokel-regler.md` och importeras med en rad.
- Repon i listan hämtas ur `repo`-fälten i `data/appar.json`.
- **Engångsinställning:** skapa en åtkomsttoken (fine-grained, bara de repon som ska få regler) med *Contents: Read and write* och *Pull requests: Read and write*, ge den *inte* Administration, och spara den som hemligheten `SPRID_TOKEN` i detta repo (Settings → Secrets and variables → Actions). Utan den hoppas körningen över med ett tydligt meddelande (inget ändras och inget blir rött).
- Prova först: Actions → Sprid regler → Run workflow (torrkörning är förvald och ändrar ingenting).
- Är det första regel-PR:et (`claude/lagg-till-regler`) fortfarande öppet i ett repo hoppas det repot över.


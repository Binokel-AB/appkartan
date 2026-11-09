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

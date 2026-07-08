# PassBildPro – Biometrische Passfotos im Browser

Foto hochladen → KI richtet es biometrisch aus → Vorgaben werden live geprüft → Download in Druckqualität (600 dpi).

**100 % clientseitig:** Gesichtserkennung (MediaPipe FaceLandmarker, WebAssembly) und KI-Hintergrundentfernung (@imgly/background-removal, ONNX) laufen vollständig im Browser. Kein Server, kein Upload, keine Datenbank – ideal für statisches Hosting auf Netlify oder Vercel.

## Features

- **Automatischer biometrischer Zuschnitt** – Kopfhöhe 70–80 %, Augenzone, Zentrierung, Auto-Begradigung der Augenlinie
- **8 Live-Prüfungen** – Kopfhöhe, Augenlinie, Zentrierung, Kopfneigung, Auflösung/dpi, Belichtung, Hintergrund-Helligkeit & -Gleichmäßigkeit
- **KI-Hintergrund** – Hintergrund entfernen und durch amtlich zulässiges Hellgrau, Weiß oder Hellblau ersetzen (Modell wird beim ersten Einsatz einmalig von einem CDN geladen; das Foto bleibt lokal)
- **Länderformate** – Deutschland/EU (35×45 mm), Führerschein, Schengen-Visum, USA (2×2 in), UK
- **Kamera-Aufnahme** direkt im Browser mit Positionierungshilfe
- **Export** – Einzelbild als JPG mit eingebetteter 600-dpi-Angabe (827×1063 px bei 35×45 mm) sowie Druckbogen 10×15 cm mit mehreren Bildern und Schnittmarken
- **Datenschutz** – Fotos verlassen das Gerät nie; keine Cookies, kein Tracking

## Umgesetzte amtliche Vorgaben (Foto-Mustertafel BMI / ICAO 9303)

| Kriterium | Vorgabe |
|---|---|
| Format | 35 × 45 mm Hochformat, ohne Rand |
| Kopfhöhe (Kinn–Scheitel) | 32–36 mm = 70–80 % der Bildhöhe |
| Augenlinie | im mittleren oberen Bildbereich, waagerecht |
| Ausrichtung | frontal, zentriert, Kopf nicht geneigt |
| Hintergrund | einfarbig hell (ideal hellgrau), kontrastreich, ohne Schatten |
| Digitale Auflösung | mind. 413 × 531 px (300 dpi), empfohlen 827 × 1063 px (600 dpi) |

> **Hinweis:** Seit Mai 2025 verlangen deutsche Pass-/Ausweisbehörden digital übermittelte Fotos zertifizierter Anbieter. Für Führerschein, viele Visa und Dokumente anderer Länder sind selbst erstellte biometrische Fotos weiterhin geeignet.

## Deployment

Reine statische Seite – kein Build-Schritt.

**Vercel:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/beko2210/passport_photo)

**Netlify:** [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/beko2210/passport_photo)

Oder per CLI:

```bash
# Vercel
npx vercel --prod

# Netlify
npx netlify-cli deploy --prod --dir .
```

## Lokal starten

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

(Ein lokaler Server ist nötig, da die App ES-Module verwendet.)

## Technik

- Vanilla JS (ES-Module), kein Framework, kein Build-Tool
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) – 478 Gesichts-Landmarks zur millimetergenauen Vermessung (Kinn, Scheitel, Iris)
- [@imgly/background-removal](https://github.com/imgly/background-removal-js) – Hintergrundentfernung ohne Server
- Canvas-API für Zuschnitt, Schablonen-Overlay, Druckbogen und JPEG-Export; dpi-Angabe wird direkt in den JFIF-Header geschrieben

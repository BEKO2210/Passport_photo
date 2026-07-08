#!/usr/bin/env python3
"""
Generiert die SEO-Landingpages (eine pro Land/Dokument) sowie sitemap.xml
und robots.txt. Ausführen aus dem Projekt-Root:

    python3 scripts/build_landing.py

Neue Seite hinzufügen: einen Eintrag in PAGES ergänzen und das Skript erneut
ausführen. Die Seiten sind reines statisches HTML (kein Build-Schritt beim Deploy).
"""
import html
import os

SITE = "https://passport-photo-five.vercel.app"
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- Seiten-Daten
PAGES = [
    {
        "slug": "us-passport-photo", "lang": "en", "fmt": "us",
        "title": "US Passport Photo Online – Biometric 2x2 in, Compliant in 30 Seconds",
        "desc": "Create a compliant US passport photo online (2x2 in / 51x51 mm). AI auto-crop, live compliance check and instant HD download. Print at home or any store.",
        "h1": "US Passport Photo Online",
        "lead": "Upload a selfie and get a compliant 2×2 in US passport &amp; visa photo in 30 seconds – AI cropping, live requirement checks and an instant HD download to print or upload.",
        "specs": [("Size", "2 × 2 in (51 × 51 mm)"), ("Head height", "1 – 1⅜ in (50–69% of photo)"),
                  ("Background", "Plain white"), ("Resolution", "600 dpi · 1200 × 1200 px"), ("Expression", "Neutral, both eyes open, mouth closed")],
        "tips": ["Use plain daylight facing a window, no harsh shadows.",
                 "Stand ~1 m in front of a white wall to keep the background clean.",
                 "Look straight into the camera with a neutral expression.",
                 "The tool checks head size, centering and background automatically."],
        "faqs": [
            ("Can I use this photo for a US passport application?", "Yes. The US State Department lets you supply your own photo as long as it meets the official 2×2 in specifications – which this tool checks for you. You can print it or upload the digital file for online applications."),
            ("Does it work for a US visa or ESTA?", "Yes, US visa and ESTA use the same 2×2 in / 51×51 mm specification with a white background."),
            ("How do I print a 2x2 inch photo?", "Download the print sheet and have it printed as a standard 4×6 in photo at any drugstore or photo lab – then cut out the 2×2 in photos."),
            ("Is my photo uploaded to a server?", "No. All processing happens locally in your browser. Your photo never leaves your device."),
        ],
    },
    {
        "slug": "uk-passport-photo", "lang": "en", "fmt": "uk",
        "title": "UK Passport Photo Online – Digital & Printed, Compliant in 30 Seconds",
        "desc": "Make a compliant UK passport photo online (35x45 mm). AI auto-crop, live HMPO requirement check, instant digital and printable HD download.",
        "h1": "UK Passport Photo Online",
        "lead": "Turn a selfie into a compliant UK passport photo (35×45 mm) in 30 seconds – with AI cropping, live requirement checks and an instant HD download for the digital code or for printing.",
        "specs": [("Size", "35 × 45 mm"), ("Head height", "29 – 34 mm (chin to crown)"),
                  ("Background", "Plain light grey or cream"), ("Resolution", "600 dpi · 827 × 1063 px"), ("Expression", "Neutral, eyes open, mouth closed")],
        "tips": ["Plain light grey or cream background works best for UK photos.",
                 "Even, front-facing light – no shadows on the face or behind you.",
                 "No smiling, look straight at the camera.",
                 "The tool measures head height and centering to UK proportions."],
        "faqs": [
            ("Can I use this for an online UK passport application?", "You can create and print a compliant photo, or use the HD file. For the fully digital HMPO route you upload a digital photo that meets the standard – which this tool helps you produce."),
            ("What background does a UK passport photo need?", "A plain light grey or cream background with no patterns or shadows. Use the AI background feature to get a clean, even surface."),
            ("How much does printing cost?", "Download the print sheet and print it as a normal 6×4 in photo at any shop – usually well under £1."),
            ("Are my photos private?", "Yes – everything runs in your browser, nothing is uploaded."),
        ],
    },
    {
        "slug": "canada-passport-photo", "lang": "en", "fmt": "ca",
        "title": "Canada Passport Photo Online – 50x70 mm, Compliant in 30 Seconds",
        "desc": "Create a compliant Canada passport photo online (50x70 mm). AI auto-crop to the 31–36 mm head height, live checks and instant printable HD download.",
        "h1": "Canada Passport Photo Online",
        "lead": "Get a compliant Canadian passport photo (50×70 mm) from a selfie in 30 seconds – AI cropping to the exact 31–36 mm head height, live checks and an instant HD download to print.",
        "specs": [("Size", "50 × 70 mm"), ("Head height", "31 – 36 mm (chin to crown)"),
                  ("Background", "Plain white or light"), ("Resolution", "600 dpi · 1181 × 1654 px"), ("Expression", "Neutral, eyes open, mouth closed")],
        "tips": ["Canada uses a taller 50×70 mm format – the tool crops it precisely.",
                 "Plain white background, evenly lit.",
                 "Neutral expression, face square to the camera.",
                 "Print the sheet and cut to 50×70 mm along the marks."],
        "faqs": [
            ("Is this size correct for a Canadian passport?", "Yes – Canada requires a 50×70 mm photo with a 31–36 mm head height, which this tool crops to automatically."),
            ("Can a Canadian passport photo be taken at home?", "Yes, you may supply your own photo if it meets the official specification. Many applicants print the result and have it verified at the counter."),
            ("What about the guarantor/date requirement?", "Those are handled on the application, not on the photo itself. This tool ensures the image meets the size and quality specs."),
            ("Do you store my photo?", "No, it is processed entirely on your device."),
        ],
    },
    {
        "slug": "australia-passport-photo", "lang": "en", "fmt": "au",
        "title": "Australia Passport Photo Online – 35x45 mm, Compliant in 30 Seconds",
        "desc": "Create a compliant Australia passport or visa photo online (35x45 mm). AI auto-crop, live requirement check and instant printable HD download.",
        "h1": "Australia Passport Photo Online",
        "lead": "Make a compliant Australian passport or visa photo (35×45 mm) from a selfie in 30 seconds – with AI cropping, live checks and an instant HD download to print.",
        "specs": [("Size", "35 × 45 mm"), ("Head height", "32 – 36 mm (chin to crown)"),
                  ("Background", "Plain light, ICAO-compliant"), ("Resolution", "600 dpi · 827 × 1063 px"), ("Expression", "Neutral, eyes open, mouth closed")],
        "tips": ["Plain light background, evenly lit, no shadows.",
                 "Neutral expression, look straight into the camera.",
                 "Keep hair away from the eyes and face outline.",
                 "The tool checks the ICAO proportions automatically."],
        "faqs": [
            ("Is this valid for an Australian passport photo?", "It produces a photo to the 35×45 mm ICAO specification used by Australia. You can print it and have it verified as required."),
            ("Does it work for Australian visas?", "Yes, the same 35×45 mm biometric specification applies to most Australian visa photos."),
            ("Can I take the photo on my phone?", "Yes – a modern smartphone photo has more than enough resolution. Keep some distance and good front light."),
            ("Is my image kept private?", "Yes, all processing is local to your browser."),
        ],
    },
    {
        "slug": "schengen-visa-photo", "lang": "en", "fmt": "schengen",
        "title": "Schengen Visa Photo Online – 35x45 mm, ICAO Compliant in 30 Seconds",
        "desc": "Create a compliant Schengen visa photo online (35x45 mm, ICAO). AI auto-crop, live checks and instant printable HD download. Accepted by all Schengen states.",
        "h1": "Schengen Visa Photo Online",
        "lead": "Get a compliant Schengen visa photo (35×45 mm, ICAO) from a selfie in 30 seconds – AI cropping, live requirement checks and an instant HD download. Accepted by all Schengen states.",
        "specs": [("Size", "35 × 45 mm"), ("Head height", "32 – 36 mm (70–80% of photo)"),
                  ("Background", "Plain light, ideally light grey"), ("Resolution", "600 dpi · 827 × 1063 px"), ("Expression", "Neutral, eyes open, mouth closed")],
        "tips": ["A light grey background is the safest choice for Schengen photos.",
                 "Even front lighting, no shadows behind the head.",
                 "Neutral expression, face centred and straight.",
                 "The tool crops to the 70–80% head-height rule automatically."],
        "faqs": [
            ("Which countries accept this photo?", "The Schengen photo standard (35×45 mm, ICAO) is accepted by all Schengen states, including Germany, France, Italy, Spain, the Netherlands and more."),
            ("What head size does a Schengen visa photo need?", "The head must be 32–36 mm from chin to crown, i.e. 70–80% of the photo height – which the tool measures and crops for you."),
            ("Can I print it at home?", "Yes – download the print sheet and print it at any photo lab or drugstore, then cut out the photos."),
            ("Do you upload my photo anywhere?", "No, it is processed entirely in your browser."),
        ],
    },
    {
        "slug": "china-visa-photo", "lang": "en", "fmt": "cn_visa",
        "title": "China Visa Photo Online – 33x48 mm White Background in 30 Seconds",
        "desc": "Create a compliant China visa photo online (33x48 mm, white background). AI auto-crop, live checks and instant printable HD download.",
        "h1": "China Visa Photo Online",
        "lead": "Make a compliant China visa photo (33×48 mm, white background) from a selfie in 30 seconds – with AI cropping, background replacement, live checks and an instant HD download.",
        "specs": [("Size", "33 × 48 mm"), ("Head height", "28 – 33 mm (chin to crown)"),
                  ("Background", "Pure white"), ("Resolution", "600 dpi · 780 × 1134 px"), ("Expression", "Neutral, eyes open, ears visible")],
        "tips": ["China visa photos need a pure white background – use the AI background feature.",
                 "Glasses are best removed to avoid glare.",
                 "Neutral expression, both ears and eyebrows visible.",
                 "The tool crops to the 33×48 mm format automatically."],
        "faqs": [
            ("What are the China visa photo requirements?", "33×48 mm, pure white background, head 28–33 mm high, neutral expression, no glasses recommended – all handled by this tool."),
            ("Can I use the AI to make the background white?", "Yes – the background feature removes your background and replaces it with a clean pure-white surface as required."),
            ("Can I print and upload the same photo?", "Yes – you get an HD file for online forms plus a print sheet for physical copies."),
            ("Is my photo private?", "Yes, nothing is uploaded – all processing happens on your device."),
        ],
    },
    {
        "slug": "india-visa-photo", "lang": "en", "fmt": "in_visa",
        "title": "India Visa & OCI Photo Online – 2x2 in White Background in 30 Seconds",
        "desc": "Create a compliant India visa or OCI photo online (2x2 in / 51x51 mm, white background). AI auto-crop, live checks and instant printable HD download.",
        "h1": "India Visa &amp; OCI Photo Online",
        "lead": "Get a compliant India visa or OCI photo (2×2 in, white background) from a selfie in 30 seconds – with AI cropping, background replacement, live checks and an instant HD download.",
        "specs": [("Size", "2 × 2 in (51 × 51 mm)"), ("Head height", "Face centred, large in frame"),
                  ("Background", "Plain white"), ("Resolution", "600 dpi · 1200 × 1200 px"), ("Expression", "Neutral, front-facing")],
        "tips": ["India visa/OCI photos are square (2×2 in) with a white background.",
                 "Center the face and keep it large in the frame.",
                 "Use the AI background feature for a clean white surface.",
                 "Even lighting, neutral expression, no shadows."],
        "faqs": [
            ("What size is an India visa photo?", "2×2 inches (51×51 mm), square, with a plain white background – the same format used for OCI applications."),
            ("Does this work for OCI card applications?", "Yes, OCI uses the same 2×2 in square white-background photo, which this tool produces."),
            ("How do I get a white background?", "Use the AI background feature to replace your background with a clean white surface."),
            ("Are my photos stored?", "No – everything is processed locally in your browser."),
        ],
    },
    {
        "slug": "biometrisches-passbild", "lang": "de", "fmt": "de_pass",
        "title": "Biometrisches Passbild online erstellen – 35x45 mm in 30 Sekunden",
        "desc": "Biometrisches Passbild online erstellen (35x45 mm): KI-Zuschnitt, Live-Prüfung nach amtlichen Vorgaben und HD-Download zum Ausdrucken. Für Vorbereitung, Führerschein, Bewerbung & Visa.",
        "h1": "Biometrisches Passbild online erstellen",
        "lead": "Aus einem Selfie in 30 Sekunden ein biometrisches Passbild (35×45 mm) – mit KI-Zuschnitt, Live-Prüfung aller Vorgaben und HD-Download zum Ausdrucken. Ideal zur Vorbereitung sowie für Führerschein, Bewerbung und Visa.",
        "specs": [("Format", "35 × 45 mm"), ("Kopfhöhe", "32 – 36 mm (70–80% der Höhe)"),
                  ("Hintergrund", "Einfarbig hell, ideal hellgrau"), ("Auflösung", "600 dpi · 827 × 1063 px"), ("Ausdruck", "Neutral, Augen offen, Mund zu")],
        "tips": ["Tageslicht von vorn, keine Schatten im Gesicht.",
                 "Heller, einfarbiger Hintergrund (KI-Hintergrund nutzbar).",
                 "Neutraler Blick, nicht lächeln.",
                 "Kopfhöhe und Zentrierung prüft das Tool automatisch."],
        "faqs": [
            ("Kann ich das Bild für den deutschen Reisepass verwenden?", "Deutsche Pass- und Ausweisbehörden verlangen seit Mai 2025 digital übermittelte Fotos zertifizierter Anbieter. Zur Vorbereitung sowie für Führerschein, viele Visa und Dokumente anderer Länder sind selbst erstellte biometrische Fotos weiterhin geeignet."),
            ("Wofür eignet sich das Tool sicher?", "Für Führerschein, Bewerbungsfotos, Visa-Anträge und Ausweisdokumente vieler Länder – sowie zur Vorbereitung und Probe vor dem Amtsbesuch."),
            ("Werden meine Fotos hochgeladen?", "Nein. Gesichtserkennung, Zuschnitt und Hintergrund laufen komplett lokal im Browser – Ihr Foto verlässt Ihr Gerät nie."),
            ("Was kostet der Ausdruck?", "Den Druckbogen als normales 10×15-Foto im Drogeriemarkt drucken lassen – meist 0,10–0,25 € für mehrere Passbilder."),
        ],
    },
    {
        "slug": "fuehrerschein-foto", "lang": "de", "fmt": "de_fs",
        "title": "Führerschein Foto online erstellen – 35x45 mm biometrisch in 30 Sekunden",
        "desc": "Führerschein-Foto online erstellen (35x45 mm, biometrisch): KI-Zuschnitt, Live-Prüfung und HD-Download zum Ausdrucken. Schnell, günstig, datenschutzfreundlich.",
        "h1": "Führerschein-Foto online erstellen",
        "lead": "Biometrisches Führerschein-Foto (35×45 mm) aus einem Selfie in 30 Sekunden – mit KI-Zuschnitt, Live-Prüfung und HD-Download zum Ausdrucken. Selbst gemachte biometrische Fotos sind für den Führerschein weiterhin zulässig.",
        "specs": [("Format", "35 × 45 mm"), ("Kopfhöhe", "32 – 36 mm (70–80% der Höhe)"),
                  ("Hintergrund", "Einfarbig hell, ideal hellgrau"), ("Auflösung", "600 dpi · 827 × 1063 px"), ("Ausdruck", "Neutral, Augen offen, Mund zu")],
        "tips": ["Gleiche biometrische Vorgaben wie beim Reisepass.",
                 "Heller Hintergrund, gleichmäßiges Licht.",
                 "Neutraler Blick, Mund geschlossen.",
                 "Das Tool schneidet automatisch biometrisch zu."],
        "faqs": [
            ("Darf ich ein selbst erstelltes Foto für den Führerschein nutzen?", "Ja. Für den Führerschein sind selbst erstellte biometrische Fotos (35×45 mm) weiterhin zulässig – anders als beim Reisepass."),
            ("Welche Maße braucht ein Führerschein-Foto?", "35×45 mm mit einer Kopfhöhe von 32–36 mm (70–80% der Bildhöhe) – genau darauf schneidet das Tool zu."),
            ("Wie drucke ich das Foto?", "Den Druckbogen als normales 10×15-Foto im Drogeriemarkt oder Fotolabor drucken lassen und an den Schnittmarken schneiden."),
            ("Sind meine Fotos privat?", "Ja – die gesamte Verarbeitung läuft lokal im Browser, es wird nichts hochgeladen."),
        ],
    },
]

STRINGS = {
    "en": {"cta": "Create my photo", "cta_note": "Free preview · no sign-up · photos never leave your device",
           "how": "How it works", "how_sub": "Three steps, about 30 seconds – no account, no upload of your photo.",
           "s1t": "Upload or snap", "s1b": "Drop in a selfie or use your camera. The AI finds your face instantly.",
           "s2t": "Auto-align & check", "s2b": "It crops to the official size and checks every requirement live.",
           "s3t": "Download HD", "s3b": "Get a print-ready HD photo and a print sheet with cut marks.",
           "specs_h": "Photo requirements", "tips_h": "Tips for a photo that passes", "faq_h": "Frequently asked questions",
           "band_h": "Ready in 30 seconds", "band_p": "Free preview – you only pay to unlock the clean HD download.",
           "related_h": "Other formats", "priv": "No photo uploads", "local": "Processed on your device", "free": "Free preview"},
    "de": {"cta": "Foto jetzt erstellen", "cta_note": "Gratis-Vorschau · ohne Anmeldung · Fotos bleiben auf Ihrem Gerät",
           "how": "So funktioniert's", "how_sub": "Drei Schritte, etwa 30 Sekunden – ohne Konto, ohne Upload Ihres Fotos.",
           "s1t": "Hochladen oder aufnehmen", "s1b": "Selfie ablegen oder Kamera nutzen. Die KI erkennt Ihr Gesicht sofort.",
           "s2t": "Auto-Zuschnitt & Prüfung", "s2b": "Zuschnitt auf das amtliche Maß und Live-Prüfung aller Vorgaben.",
           "s3t": "HD herunterladen", "s3b": "Druckfertiges HD-Foto plus Druckbogen mit Schnittmarken.",
           "specs_h": "Foto-Vorgaben", "tips_h": "Tipps für ein gültiges Foto", "faq_h": "Häufige Fragen",
           "band_h": "In 30 Sekunden fertig", "band_p": "Gratis-Vorschau – bezahlt wird nur der saubere HD-Download.",
           "related_h": "Weitere Formate", "priv": "Keine Foto-Uploads", "local": "Verarbeitung auf Ihrem Gerät", "free": "Gratis-Vorschau"},
}

CHECK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
LOCK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
LOGO = '<svg viewBox="0 0 100 100" width="24" height="24" aria-hidden="true"><rect width="100" height="100" rx="22" fill="currentColor" opacity="0.15"/><circle cx="50" cy="40" r="15" fill="currentColor"/><path d="M24 86c0-15 12-25 26-25s26 10 26 25" fill="currentColor"/></svg>'
FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E"
           "%3Crect width='100' height='100' rx='20' fill='%2317549c'/%3E%3Ccircle cx='50' cy='40' r='16' fill='white'/%3E"
           "%3Cpath d='M22 88c0-16 12.5-26 28-26s28 10 28 26' fill='white'/%3E%3C/svg%3E")


def esc_attr(s):
    return html.escape(s, quote=True)


def render(page):
    L = STRINGS[page["lang"]]
    url = f"{SITE}/{page['slug']}"
    app_url = f"/?format={page['fmt']}#upload-section"

    faq_ld = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in page["faqs"]],
    }
    import json
    faq_json = json.dumps(faq_ld, ensure_ascii=False)
    breadcrumb = json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": page["h1"].replace("&amp;", "&"), "item": url},
    ]}, ensure_ascii=False)

    specs = "\n".join(f"          <tr><th>{k}</th><td>{v}</td></tr>" for k, v in page["specs"])
    tips = "\n".join(f"          <li>{t}</li>" for t in page["tips"])
    faqs = "\n".join(
        f'        <details><summary>{q}</summary><p>{a}</p></details>' for q, a in page["faqs"])
    related = "\n".join(
        f'        <a href="/{p["slug"]}">{p["h1"].replace("&amp;", "&")}</a>'
        for p in PAGES if p["slug"] != page["slug"])

    return f"""<!DOCTYPE html>
<html lang="{page['lang']}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc_attr(page['title'])}</title>
  <meta name="description" content="{esc_attr(page['desc'])}" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{esc_attr(page['title'])}" />
  <meta property="og:description" content="{esc_attr(page['desc'])}" />
  <meta property="og:url" content="{url}" />
  <meta name="robots" content="index, follow" />
  <link rel="icon" href="{FAVICON}" />
  <link rel="stylesheet" href="/css/landing.css" />
  <script type="application/ld+json">{faq_json}</script>
  <script type="application/ld+json">{breadcrumb}</script>
</head>
<body>
  <header class="lp-header">
    <div class="container">
      <a class="lp-brand" href="/">{LOGO}<span>PassBild<b>Pro</b></span></a>
      <a class="lp-header-cta" href="{app_url}">{L['cta']}</a>
    </div>
  </header>

  <section class="lp-hero">
    <div class="container">
      <div class="lp-eyebrow">{CHECK} {page['h1']}</div>
      <h1>{page['h1']}</h1>
      <p class="lead">{page['lead']}</p>
      <div class="lp-cta-row">
        <a class="btn btn-primary btn-lg" href="{app_url}">{L['cta']}</a>
        <span class="lp-cta-note">{L['cta_note']}</span>
      </div>
      <div class="lp-trust">
        <span>{LOCK} {L['priv']}</span>
        <span>{CHECK} {L['local']}</span>
        <span>{CHECK} {L['free']}</span>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <h2 class="lp-section-h">{L['how']}</h2>
      <p class="lp-section-sub">{L['how_sub']}</p>
      <div class="lp-steps">
        <div class="lp-step"><h3>{L['s1t']}</h3><p>{L['s1b']}</p></div>
        <div class="lp-step"><h3>{L['s2t']}</h3><p>{L['s2b']}</p></div>
        <div class="lp-step"><h3>{L['s3t']}</h3><p>{L['s3b']}</p></div>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <h2 class="lp-section-h">{L['specs_h']}</h2>
      <div class="lp-specs">
        <table>
{specs}
        </table>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <h2 class="lp-section-h">{L['tips_h']}</h2>
      <ul class="lp-tips">
{tips}
      </ul>
    </div>
  </section>

  <section class="lp-faq">
    <div class="container">
      <h2 class="lp-section-h">{L['faq_h']}</h2>
{faqs}
    </div>
  </section>

  <section>
    <div class="container">
      <div class="lp-cta-band">
        <h2>{L['band_h']}</h2>
        <p>{L['band_p']}</p>
        <a class="btn btn-lg" href="{app_url}">{L['cta']}</a>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <h2 class="lp-section-h">{L['related_h']}</h2>
      <div class="lp-related">
{related}
      </div>
    </div>
  </section>

  <footer class="lp-footer">
    <div class="container">
      <a class="lp-brand" href="/">{LOGO}<span>PassBild<b>Pro</b></span></a>
      <span>{L['priv']} · {L['local']}</span>
    </div>
  </footer>
</body>
</html>
"""


def build():
    slugs = []
    for page in PAGES:
        out = os.path.join(OUT, page["slug"] + ".html")
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(render(page))
        slugs.append(page["slug"])
        print("wrote", page["slug"] + ".html")

    # sitemap
    urls = [f"  <url><loc>{SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>"]
    for s in slugs:
        urls.append(f"  <url><loc>{SITE}/{s}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>")
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "\n".join(urls) + "\n</urlset>\n")
    with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write(sitemap)
    print("wrote sitemap.xml")

    robots = f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n"
    with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as fh:
        fh.write(robots)
    print("wrote robots.txt")


if __name__ == "__main__":
    build()

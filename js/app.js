/* ============================================================
   PassBildPro – Biometrische Passfotos im Browser
   Gesichtserkennung: MediaPipe FaceLandmarker (WASM, lokal)
   Hintergrund: @imgly/background-removal (ONNX, lokal)
   ============================================================ */

// MediaPipe ist lokal gebündelt (vendor/) – kein CDN, keine Fremd-Requests fürs Gesicht.
const VISION_BUNDLE_URL = new URL("../vendor/tasks-vision/vision_bundle.mjs", import.meta.url).href;
const WASM_URL = new URL("../vendor/tasks-vision/wasm", import.meta.url).href;
const MODEL_URL = new URL("../vendor/models/face_landmarker.task", import.meta.url).href;
// KI-Hintergrundentfernung (~40 MB Modell) wird nur bei Bedarf vom CDN geladen.
const BG_LIB_URL = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm";

// Anteil, der oberhalb von Landmark 10 (Stirn) für Schädeldecke/Haar angesetzt wird
const CROWN_FACTOR = 0.20;

/* ---------------- Formate (amtliche Vorgaben) ---------------- */
const FORMATS = {
  de_pass: {
    label: { de: "Deutschland / EU – Reisepass & Personalausweis (35 × 45 mm)", en: "Germany / EU – Passport & ID card (35 × 45 mm)" },
    wmm: 35, hmm: 45, dpi: 600,
    faceMin: 0.70, faceMax: 0.80, faceTarget: 0.755,
    eyeMin: 0.50, eyeMax: 0.66,
    hint: { de: "Kopfhöhe (Kinn bis Scheitel) 32–36 mm = 70–80 % der Bildhöhe. Hintergrund einfarbig hell, ideal hellgrau.", en: "Head height (chin to crown) 32–36 mm = 70–80% of image height. Plain light background, ideally light grey." },
  },
  de_fs: {
    label: { de: "Deutschland – Führerschein (35 × 45 mm)", en: "Germany – Driving licence (35 × 45 mm)" },
    wmm: 35, hmm: 45, dpi: 600,
    faceMin: 0.70, faceMax: 0.80, faceTarget: 0.755,
    eyeMin: 0.50, eyeMax: 0.66,
    hint: { de: "Gleiche biometrische Vorgaben wie beim Reisepass (35 × 45 mm).", en: "Same biometric requirements as the passport (35 × 45 mm)." },
  },
  schengen: {
    label: { de: "Schengen-Visum (35 × 45 mm)", en: "Schengen visa (35 × 45 mm)" },
    wmm: 35, hmm: 45, dpi: 600,
    faceMin: 0.70, faceMax: 0.80, faceTarget: 0.755,
    eyeMin: 0.50, eyeMax: 0.66,
    hint: { de: "ICAO-konform, 35 × 45 mm, heller Hintergrund. Von allen Schengen-Staaten akzeptiert.", en: "ICAO-compliant, 35 × 45 mm, light background. Accepted by all Schengen states." },
  },
  us: {
    label: { de: "USA – Passport / Visa / ESTA (2 × 2 in, 51 × 51 mm)", en: "USA – Passport / Visa / ESTA (2 × 2 in, 51 × 51 mm)" },
    wmm: 50.8, hmm: 50.8, dpi: 600,
    faceMin: 0.50, faceMax: 0.69, faceTarget: 0.60,
    eyeMin: 0.56, eyeMax: 0.69,
    hint: { de: "Quadratisch 2 × 2 Zoll, Kopfhöhe 1–1⅜ in (50–69 %), Hintergrund weiß. Digital: 600–1200 px Kantenlänge.", en: "Square 2 × 2 in, head height 1–1⅜ in (50–69%), white background. Digital: 600–1200 px per side." },
  },
  uk: {
    label: { de: "Großbritannien – Passport (35 × 45 mm)", en: "United Kingdom – Passport (35 × 45 mm)" },
    wmm: 35, hmm: 45, dpi: 600,
    faceMin: 0.64, faceMax: 0.76, faceTarget: 0.70,
    eyeMin: 0.52, eyeMax: 0.70,
    hint: { de: "Kopfhöhe (Kinn bis Scheitel) 29–34 mm, heller grauer oder cremefarbener Hintergrund.", en: "Head height (chin to crown) 29–34 mm, light grey or cream background." },
  },
  ca: {
    label: { de: "Kanada – Passport (50 × 70 mm)", en: "Canada – Passport (50 × 70 mm)" },
    wmm: 50, hmm: 70, dpi: 600,
    faceMin: 0.44, faceMax: 0.52, faceTarget: 0.48,
    eyeMin: 0.55, eyeMax: 0.70,
    hint: { de: "Format 50 × 70 mm, Kopfhöhe (Kinn bis Scheitel) 31–36 mm, weißer oder heller Hintergrund.", en: "Size 50 × 70 mm, head height (chin to crown) 31–36 mm, white or light background." },
  },
  au: {
    label: { de: "Australien – Passport / Visa (35 × 45 mm)", en: "Australia – Passport / Visa (35 × 45 mm)" },
    wmm: 35, hmm: 45, dpi: 600,
    faceMin: 0.70, faceMax: 0.80, faceTarget: 0.755,
    eyeMin: 0.50, eyeMax: 0.66,
    hint: { de: "35 × 45 mm, Kopfhöhe 32–36 mm, hell einfarbiger Hintergrund. ICAO-konform.", en: "35 × 45 mm, head height 32–36 mm, plain light background. ICAO-compliant." },
  },
  in_visa: {
    label: { de: "Indien – Visum / OCI (2 × 2 in, 51 × 51 mm)", en: "India – Visa / OCI (2 × 2 in, 51 × 51 mm)" },
    wmm: 50.8, hmm: 50.8, dpi: 600,
    faceMin: 0.60, faceMax: 0.75, faceTarget: 0.68,
    eyeMin: 0.55, eyeMax: 0.70,
    hint: { de: "Quadratisch 2 × 2 Zoll, Gesicht zentriert und groß im Bild, weißer Hintergrund.", en: "Square 2 × 2 in, face centred and large in frame, white background." },
  },
  cn_visa: {
    label: { de: "China – Visum (33 × 48 mm)", en: "China – Visa (33 × 48 mm)" },
    wmm: 33, hmm: 48, dpi: 600,
    faceMin: 0.58, faceMax: 0.69, faceTarget: 0.64,
    eyeMin: 0.55, eyeMax: 0.70,
    hint: { de: "Format 33 × 48 mm, Kopfhöhe 28–33 mm, rein weißer Hintergrund, keine Brille empfohlen.", en: "Size 33 × 48 mm, head height 28–33 mm, pure white background, glasses not recommended." },
  },
};

/* ============================================================
   BEZAHLUNG (Stripe) – hier eintragen und fertig.
   1. Stripe-Konto anlegen (stripe.com), Produkt "HD-Passbild" erstellen.
   2. Einen "Payment Link" erzeugen und unten bei paymentLink einfügen.
   3. Im Payment Link als Erfolgs-URL die eigene Domain mit ?paid=1 setzen,
      z. B. https://passport-photo-five.vercel.app/?paid=1
   Solange paymentLink leer ist, läuft ein DEMO-MODUS (schaltet ohne Zahlung frei).
   ============================================================ */
const PAYMENTS = {
  paymentLink: "",          // <-- Stripe Payment Link hier einfügen
  priceLabel: "2,99 €",     // nur Anzeige – der echte Preis steht im Stripe-Link
};

/* Freischalt-Status: nach Zahlung dauerhaft im Browser gemerkt */
let paidUnlocked = false;
try { paidUnlocked = localStorage.getItem("pbp_hd_unlocked") === "1"; } catch (e) {}
function isUnlocked() { return paidUnlocked; }
function setUnlocked(v) {
  paidUnlocked = !!v;
  try { localStorage.setItem("pbp_hd_unlocked", v ? "1" : "0"); } catch (e) {}
  document.body.classList.toggle("is-unlocked", paidUnlocked);
}

/* ============================================================
   Sprache (DE / EN) – Übersetzungen stehen direkt im HTML (data-en /
   data-en-html), dynamische JS-Texte über L("de", "en").
   ============================================================ */
function detectLang() {
  try { const s = localStorage.getItem("pbp_lang"); if (s === "de" || s === "en") return s; } catch (e) {}
  return (navigator.language || "de").toLowerCase().startsWith("de") ? "de" : "en";
}
let LANG = detectLang();
function L(de, en) { return LANG === "en" ? en : de; }

function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-en], [data-en-html]").forEach((el) => {
    if (el._origHTML === undefined) el._origHTML = el.innerHTML;
    if (LANG === "en") {
      if (el.dataset.enHtml !== undefined) el.innerHTML = el.dataset.enHtml;
      else if (el.dataset.en !== undefined) el.textContent = el.dataset.en;
    } else {
      el.innerHTML = el._origHTML;
    }
  });
  const tb = $("lang-toggle");
  if (tb) { tb.textContent = LANG === "de" ? "EN" : "DE"; tb.setAttribute("aria-label", LANG === "de" ? "Switch to English" : "Auf Deutsch umstellen"); }
  document.title = L("PassBild Pro – Biometrische Passfotos online erstellen", "PassBild Pro – Create biometric passport photos online");
  const ov = $("btn-overlay");
  if (ov) ov.textContent = L("Schablone: ", "Guide: ") + (state.overlayOn ? L("an", "on") : L("aus", "off"));
  if (typeof buildFormatOptions === "function") buildFormatOptions();
  if (typeof applyFormat === "function") applyFormat();
}
function setLang(l) {
  LANG = l;
  try { localStorage.setItem("pbp_lang", l); } catch (e) {}
  applyLang();
}

/* ---------------- State ---------------- */
const state = {
  srcBitmap: null,      // Original (EXIF-korrigiert)
  cutoutBitmap: null,   // Original ohne Hintergrund (KI)
  baked: null,          // Arbeits-Canvas: Rotation + ggf. Hintergrund angewendet
  face: null,           // Erkennungs-Ergebnis in baked-Koordinaten
  crop: { x: 0, y: 0, w: 100, h: 129 },
  formatKey: "de_pass",
  rotationDeg: 0,
  bgMode: "original",
  overlayOn: true,
  zoomBounds: { min: 100, max: 1000 },
  detector: null,
  bgBusy: false,
};

/* ---------------- DOM ---------------- */
const $ = (id) => document.getElementById(id);
const dropzone = $("dropzone");
const fileInput = $("file-input");
const previewCanvas = $("preview-canvas");
const ctx = previewCanvas.getContext("2d");

/* ---------------- Helpers ---------------- */
function toast(msg, ms = 4200) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), ms);
}

function fmt() { return FORMATS[state.formatKey]; }
function ratio() { const f = fmt(); return f.wmm / f.hmm; }
function exportPx() {
  const f = fmt();
  return {
    w: Math.round((f.wmm / 25.4) * f.dpi),
    h: Math.round((f.hmm / 25.4) * f.dpi),
  };
}

function setLoading(on, text) {
  $("upload-loading").hidden = !on;
  if (text) $("loading-text").textContent = text;
}

/* ============================================================
   Gesichtserkennung
   ============================================================ */
async function ensureDetector() {
  if (state.detector) return state.detector;
  setLoading(true, L("KI-Modell wird geladen … (nur beim ersten Mal)", "Loading AI model … (first time only)"));
  const vision = await import(VISION_BUNDLE_URL);
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
  state.detector = await vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "IMAGE",
    numFaces: 1,
  });
  return state.detector;
}

function detectFace() {
  const c = state.baked;
  if (!c || !state.detector) return null;
  let res;
  try {
    res = state.detector.detect(c);
  } catch (e) {
    console.error(e);
    return null;
  }
  const lm = res?.faceLandmarks?.[0];
  if (!lm || lm.length < 468) return null;

  const px = (p) => ({ x: p.x * c.width, y: p.y * c.height });
  const chin = px(lm[152]);
  const forehead = px(lm[10]);
  // Augen: Iris-Landmarks (468/473), Fallback äußere Augenwinkel
  const eyeR = px(lm.length > 473 ? lm[473] : lm[263]);
  const eyeL = px(lm.length > 468 ? lm[468] : lm[33]);

  const faceCore = chin.y - forehead.y;
  const crownY = forehead.y - faceCore * CROWN_FACTOR; // Schätzung Schädeldecke inkl. Haaransatz
  const eyeMid = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 };
  const angleDeg = (Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x) * 180) / Math.PI;

  return { chinY: chin.y, crownY, eyeL, eyeR, eyeMid, angleDeg, faceH: chin.y - crownY };
}

/* ============================================================
   Arbeits-Canvas (Rotation + Hintergrund) neu aufbauen
   ============================================================ */
function bake() {
  const src = state.srcBitmap;
  if (!src) return;
  const rad = (state.rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  const w = Math.round(src.width * cos + src.height * sin);
  const h = Math.round(src.width * sin + src.height * cos);

  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const cx = c.getContext("2d");
  cx.imageSmoothingQuality = "high";

  const useBg = state.bgMode !== "original" && state.cutoutBitmap;
  if (useBg) { cx.fillStyle = state.bgMode; cx.fillRect(0, 0, w, h); }

  cx.translate(w / 2, h / 2);
  cx.rotate(rad);
  const drawSrc = useBg ? state.cutoutBitmap : src;
  cx.drawImage(drawSrc, -src.width / 2, -src.height / 2);

  state.baked = c;
  state.face = detectFace();
}

/* ============================================================
   Automatischer biometrischer Zuschnitt
   ============================================================ */
function autoCrop() {
  const c = state.baked;
  if (!c) return;
  const f = fmt();
  const face = state.face;

  let cropH, cx, cy;
  if (face) {
    cropH = face.faceH / f.faceTarget;
    const topGap = (cropH - face.faceH) * 0.45; // etwas mehr Raum unter dem Kinn
    cy = face.crownY - topGap;
    cx = face.eyeMid.x - (cropH * ratio()) / 2;
  } else {
    cropH = c.height * 0.85;
    cy = c.height * 0.05;
    cx = (c.width - cropH * ratio()) / 2;
  }
  setCrop(cx, cy, cropH * ratio(), cropH);

  // Zoom-Grenzen um den Auto-Zuschnitt herum definieren
  const maxFitH = Math.min(c.height, c.width / ratio());
  state.zoomBounds = {
    min: Math.min(cropH * 0.6, maxFitH),
    max: Math.min(cropH * 1.9, maxFitH),
  };
  syncZoomSlider();
}

function setCrop(x, y, w, h) {
  const c = state.baked;
  // Seitenverhältnis fixieren, im Bild halten
  const maxH = Math.min(c.height, c.width / ratio());
  h = Math.max(40, Math.min(h, maxH));
  w = h * ratio();
  x = Math.max(0, Math.min(x, c.width - w));
  y = Math.max(0, Math.min(y, c.height - h));
  state.crop = { x, y, w, h };
}

function syncZoomSlider() {
  const { min, max } = state.zoomBounds;
  const t = max > min ? 1 - (state.crop.h - min) / (max - min) : 0.5;
  const tc = Math.max(0, Math.min(1, t));
  $("zoom-slider").value = (tc * 100).toFixed(1);
  $("zoom-value").textContent = `${Math.round(tc * 100)} %`;
}

/* ============================================================
   Rendering (Vorschau + Schablone)
   ============================================================ */
function render() {
  const c = state.baked;
  if (!c) return;
  const { x, y, w, h } = state.crop;
  const W = previewCanvas.width, H = previewCanvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(c, x, y, w, h, 0, 0, W, H);

  if (!state.overlayOn) return;
  const f = fmt();

  // Mittelachse
  ctx.save();
  ctx.strokeStyle = "rgba(59,91,219,0.75)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();

  // Augenzone (zulässiger Bereich)
  const eyeTop = H * (1 - f.eyeMax);
  const eyeBot = H * (1 - f.eyeMin);
  ctx.fillStyle = "rgba(18,184,134,0.10)";
  ctx.fillRect(0, eyeTop, W, eyeBot - eyeTop);
  ctx.strokeStyle = "rgba(18,184,134,0.85)";
  ctx.setLineDash([7, 6]);
  ctx.beginPath(); ctx.moveTo(0, eyeTop); ctx.lineTo(W, eyeTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, eyeBot); ctx.lineTo(W, eyeBot); ctx.stroke();
  ctx.setLineDash([]);

  // Erkannte Merkmale einzeichnen
  const face = state.face;
  if (face) {
    const mapX = (v) => ((v - x) / w) * W;
    const mapY = (v) => ((v - y) / h) * H;

    // Augenlinie
    ctx.strokeStyle = "#12b886";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapX(face.eyeL.x) - 26, mapY(face.eyeL.y));
    ctx.lineTo(mapX(face.eyeR.x) + 26, mapY(face.eyeR.y));
    ctx.stroke();
    for (const e of [face.eyeL, face.eyeR]) {
      ctx.beginPath();
      ctx.arc(mapX(e.x), mapY(e.y), 4, 0, Math.PI * 2);
      ctx.fillStyle = "#12b886";
      ctx.fill();
    }

    // Kinn- und Scheitellinie
    ctx.strokeStyle = "#f08c00";
    ctx.lineWidth = 2;
    for (const yy of [face.chinY, face.crownY]) {
      const py = mapY(yy);
      ctx.beginPath();
      ctx.moveTo(W * 0.18, py); ctx.lineTo(W * 0.82, py);
      ctx.stroke();
    }

    // Kopfhöhen-Anzeige rechts
    const pTop = mapY(face.crownY), pBot = mapY(face.chinY);
    const pct = Math.round((face.faceH / h) * 100);
    const ok = pct >= f.faceMin * 100 && pct <= f.faceMax * 100;
    ctx.strokeStyle = ok ? "#12b886" : "#e03131";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W - 22, pTop); ctx.lineTo(W - 22, pBot); ctx.stroke();
    for (const py of [pTop, pBot]) {
      ctx.beginPath(); ctx.moveTo(W - 30, py); ctx.lineTo(W - 14, py); ctx.stroke();
    }
    ctx.font = "700 22px Inter, sans-serif";
    ctx.fillStyle = ok ? "#12b886" : "#e03131";
    ctx.textAlign = "right";
    ctx.fillText(`${pct} %`, W - 34, (pTop + pBot) / 2 + 8);
  }
  ctx.restore();
}

/* ============================================================
   Live-Prüfungen
   ============================================================ */
function sampleCrop() {
  const s = document.createElement("canvas");
  s.width = 80; s.height = Math.round(80 / ratio());
  const sx = s.getContext("2d", { willReadFrequently: true });
  const { x, y, w, h } = state.crop;
  sx.drawImage(state.baked, x, y, w, h, 0, 0, s.width, s.height);
  return { data: sx.getImageData(0, 0, s.width, s.height), w: s.width, h: s.height };
}

function meanLuma(img, x0, y0, x1, y1) {
  const d = img.data.data;
  let sum = 0, n = 0;
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * img.w + xx) * 4;
      sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      n++;
    }
  }
  return n ? sum / n : 0;
}

function runChecks() {
  const f = fmt();
  const face = state.face;
  const { w, h } = state.crop;
  const checks = [];
  const P = "pass", W_ = "warn", F = "fail";

  // 1. Gesicht erkannt
  checks.push({
    label: L("Gesicht erkannt", "Face detected"),
    state: face ? P : F,
    detail: face ? L("Automatische Vermessung aktiv.", "Automatic measurement active.") : L("Kein Gesicht gefunden – bitte anderes Foto verwenden.", "No face found – please use a different photo."),
  });

  if (face) {
    // 2. Kopfhöhe
    const pct = face.faceH / h;
    const inRange = pct >= f.faceMin && pct <= f.faceMax;
    const near = pct >= f.faceMin - 0.02 && pct <= f.faceMax + 0.02;
    checks.push({
      label: L(`Kopfhöhe ${Math.round(pct * 100)} %`, `Head height ${Math.round(pct * 100)}%`),
      state: inRange ? P : near ? W_ : F,
      detail: L(`Zulässig: ${Math.round(f.faceMin * 100)}–${Math.round(f.faceMax * 100)} % (Kinn bis Scheitel). Mit dem Zoom-Regler anpassen.`, `Allowed: ${Math.round(f.faceMin * 100)}–${Math.round(f.faceMax * 100)}% (chin to crown). Adjust with the zoom slider.`),
    });

    // 3. Augenhöhe
    const eyeFromBottom = 1 - (face.eyeMid.y - state.crop.y) / h;
    const eyeOk = eyeFromBottom >= f.eyeMin && eyeFromBottom <= f.eyeMax;
    checks.push({
      label: L("Augenlinie in der Zone", "Eye line in the zone"),
      state: eyeOk ? P : W_,
      detail: eyeOk ? L("Augen liegen im zulässigen Bereich (grünes Band).", "Eyes are within the allowed band (green).") : L("Bild vertikal verschieben, bis die Augen im grünen Band liegen.", "Move the image vertically until the eyes sit in the green band."),
    });

    // 4. Zentrierung
    const dx = Math.abs(face.eyeMid.x - (state.crop.x + w / 2)) / w;
    checks.push({
      label: L("Horizontal zentriert", "Horizontally centred"),
      state: dx <= 0.04 ? P : dx <= 0.08 ? W_ : F,
      detail: dx <= 0.04 ? L("Gesicht liegt mittig.", "Face is centred.") : L("Bild seitlich verschieben, bis das Gesicht auf der Mittelachse liegt.", "Move the image sideways until the face is on the centre line."),
    });

    // 5. Kopfneigung
    const a = Math.abs(face.angleDeg);
    checks.push({
      label: L(`Kopf gerade (${a.toFixed(1)}°)`, `Head level (${a.toFixed(1)}°)`),
      state: a <= 3 ? P : a <= 5 ? W_ : F,
      detail: a <= 3 ? L("Augenlinie ist waagerecht.", "Eye line is horizontal.") : L("Mit dem Drehungs-Regler begradigen.", "Straighten with the rotation slider."),
    });
  }

  // 6. Auflösung
  const need600 = exportPx().w;
  const need300 = need600 / 2;
  checks.push({
    label: L("Auflösung / Druckqualität", "Resolution / print quality"),
    state: w >= need600 ? P : w >= need300 ? W_ : F,
    detail:
      w >= need600
        ? L(`Ausschnitt ${Math.round(w)} px breit – ausgezeichnet für ${f.dpi} dpi.`, `Crop ${Math.round(w)} px wide – excellent for ${f.dpi} dpi.`)
        : w >= need300
        ? L(`Ausschnitt ${Math.round(w)} px – für 300 dpi ausreichend, näher aufgenommenes Foto wäre besser.`, `Crop ${Math.round(w)} px – enough for 300 dpi, a closer photo would be better.`)
        : L(`Ausschnitt nur ${Math.round(w)} px breit – Foto mit höherer Auflösung verwenden.`, `Crop only ${Math.round(w)} px wide – use a higher-resolution photo.`),
  });

  // 7 & 8. Belichtung + Hintergrund (Pixel-Analyse)
  try {
    const img = sampleCrop();
    const fw = img.w, fh = img.h;
    const faceLuma = meanLuma(img, Math.round(fw * 0.35), Math.round(fh * 0.3), Math.round(fw * 0.65), Math.round(fh * 0.6));
    checks.push({
      label: L("Belichtung des Gesichts", "Face exposure"),
      state: faceLuma >= 70 && faceLuma <= 220 ? P : W_,
      detail: faceLuma < 70 ? L("Gesicht wirkt zu dunkel – helleres Foto verwenden.", "Face looks too dark – use a brighter photo.") : faceLuma > 220 ? L("Gesicht wirkt überbelichtet.", "Face looks overexposed.") : L("Helligkeit im guten Bereich.", "Brightness is in a good range."),
    });

    const tl = meanLuma(img, 0, 0, Math.round(fw * 0.14), Math.round(fh * 0.12));
    const tr = meanLuma(img, Math.round(fw * 0.86), 0, fw, Math.round(fh * 0.12));
    const bgLuma = (tl + tr) / 2;
    const uniform = Math.abs(tl - tr) < 34;
    checks.push({
      label: L("Hintergrund hell & gleichmäßig", "Background light & even"),
      state: bgLuma >= 150 && uniform ? P : bgLuma >= 115 ? W_ : F,
      detail:
        bgLuma < 115
          ? L("Hintergrund zu dunkel – KI-Hintergrund (hellgrau) verwenden.", "Background too dark – use the AI background (light grey).")
          : !uniform
          ? L("Hintergrund ungleichmäßig (Schatten?) – KI-Hintergrund empfohlen.", "Uneven background (shadows?) – AI background recommended.")
          : L("Einfarbig heller Hintergrund erkannt.", "Plain light background detected."),
    });
  } catch (e) { /* Sampling optional */ }

  renderChecks(checks);
}

function renderChecks(checks) {
  const ul = $("check-list");
  ul.innerHTML = "";
  let pass = 0, fail = 0;
  for (const ch of checks) {
    if (ch.state === "pass") pass++;
    if (ch.state === "fail") fail++;
    const li = document.createElement("li");
    li.className = ch.state;
    const icon = ch.state === "pass" ? "✓" : ch.state === "warn" ? "!" : "✕";
    li.innerHTML = `<span class="ci">${icon}</span><span><b>${ch.label}</b><small>${ch.detail}</small></span>`;
    ul.appendChild(li);
  }
  const badge = $("score-badge");
  badge.textContent = `${pass}/${checks.length}`;
  badge.className = "score-badge " + (fail > 0 ? "fail" : pass === checks.length ? "ok" : "warn");

  const warning = $("export-warning");
  if (fail > 0) {
    warning.hidden = false;
    warning.textContent = L("Hinweis: Es gibt noch rot markierte Kriterien – das Foto wird so voraussichtlich nicht akzeptiert. Bitte oben nachjustieren.", "Note: some criteria are still marked red – the photo is unlikely to be accepted as is. Please adjust above.");
  } else {
    warning.hidden = true;
  }
}

/* ============================================================
   Update-Pipeline
   ============================================================ */
let checksTimer = null;
function update({ recheck = true } = {}) {
  render();
  updateExportThumbs();
  if (recheck) {
    clearTimeout(checksTimer);
    checksTimer = setTimeout(runChecks, 120);
  }
}

/* ============================================================
   Bild laden
   ============================================================ */
async function loadImage(blob) {
  try {
    setLoading(true, L("Bild wird analysiert …", "Analysing image …"));
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    if (bitmap.width < 300 || bitmap.height < 300) {
      toast(L("Das Bild ist sehr klein – bitte ein Foto mit höherer Auflösung verwenden.", "This image is very small – please use a higher-resolution photo."));
    }
    state.srcBitmap = bitmap;
    state.cutoutBitmap = null;
    state.rotationDeg = 0;
    state.bgMode = "original";
    document.querySelectorAll(".bg-chip").forEach((b) => b.classList.toggle("active", b.dataset.bg === "original"));
    $("rotate-slider").value = 0;
    $("rotate-value").textContent = "0°";

    await ensureDetector();
    setLoading(true, L("Gesicht wird vermessen …", "Measuring face …"));
    bake();

    // Automatisch begradigen, wenn der Kopf leicht geneigt ist
    if (state.face && Math.abs(state.face.angleDeg) > 1 && Math.abs(state.face.angleDeg) <= 10) {
      state.rotationDeg = -state.face.angleDeg;
      $("rotate-slider").value = state.rotationDeg.toFixed(1);
      $("rotate-value").textContent = `${state.rotationDeg.toFixed(1)}°`;
      bake();
    }

    if (!state.face) {
      toast(L("Kein Gesicht erkannt. Sie können den Ausschnitt manuell setzen – oder ein frontales Portraitfoto verwenden.", "No face detected. You can position the crop manually – or use a front-facing portrait photo."));
    }

    autoCrop();
    setLoading(false);

    $("editor-section").hidden = false;
    $("export-section").hidden = false;
    update();
    $("editor-section").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    console.error(e);
    setLoading(false);
    toast(L("Dieses Bild konnte nicht geladen werden. Bitte JPG, PNG oder WEBP verwenden (HEIC wird nicht von allen Browsern unterstützt).", "This image could not be loaded. Please use JPG, PNG or WEBP (HEIC is not supported by all browsers)."));
  }
}

/* ============================================================
   Upload / Drag & Drop / Kamera
   ============================================================ */
$("btn-choose").addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
fileInput.addEventListener("change", () => { if (fileInput.files[0]) loadImage(fileInput.files[0]); fileInput.value = ""; });

["dragover", "dragenter"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); })
);
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); })
);
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file && file.type.startsWith("image/")) loadImage(file);
  else toast(L("Bitte eine Bilddatei ablegen (JPG, PNG, WEBP).", "Please drop an image file (JPG, PNG, WEBP)."));
});

/* Kamera */
let cameraStream = null;
$("btn-camera").addEventListener("click", async (e) => {
  e.stopPropagation();
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 2560 }, height: { ideal: 1920 } },
      audio: false,
    });
    $("camera-video").srcObject = cameraStream;
    $("camera-modal").hidden = false;
  } catch {
    toast(L("Kamera konnte nicht geöffnet werden – bitte Berechtigung erteilen oder ein Foto hochladen.", "Could not open the camera – please grant permission or upload a photo."));
  }
});
function closeCamera() {
  cameraStream?.getTracks().forEach((t) => t.stop());
  cameraStream = null;
  $("camera-modal").hidden = true;
}
$("btn-camera-cancel").addEventListener("click", closeCamera);
$("btn-camera-shoot").addEventListener("click", async () => {
  const v = $("camera-video");
  const c = document.createElement("canvas");
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  closeCamera();
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  loadImage(blob);
});

/* ============================================================
   Interaktion: Ziehen, Zoomen, Drehen
   ============================================================ */
let drag = null;
previewCanvas.addEventListener("pointerdown", (e) => {
  if (!state.baked) return;
  previewCanvas.setPointerCapture(e.pointerId);
  previewCanvas.classList.add("grabbing");
  drag = { x: e.clientX, y: e.clientY, cx: state.crop.x, cy: state.crop.y };
});
previewCanvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const rect = previewCanvas.getBoundingClientRect();
  const scale = state.crop.w / rect.width; // Canvas-px → Bild-px
  setCrop(
    drag.cx - (e.clientX - drag.x) * scale,
    drag.cy - (e.clientY - drag.y) * scale,
    state.crop.w, state.crop.h
  );
  update();
});
["pointerup", "pointercancel"].forEach((ev) =>
  previewCanvas.addEventListener(ev, () => { drag = null; previewCanvas.classList.remove("grabbing"); })
);

previewCanvas.addEventListener("wheel", (e) => {
  if (!state.baked) return;
  e.preventDefault();
  const factor = e.deltaY > 0 ? 1.045 : 1 / 1.045;
  zoomAround(factor, e);
}, { passive: false });

function zoomAround(factor, e) {
  const { x, y, w, h } = state.crop;
  const rect = previewCanvas.getBoundingClientRect();
  const fx = e ? (e.clientX - rect.left) / rect.width : 0.5;
  const fy = e ? (e.clientY - rect.top) / rect.height : 0.5;
  const newH = Math.max(state.zoomBounds.min * 0.5, Math.min(h * factor, state.zoomBounds.max * 1.4));
  const newW = newH * ratio();
  setCrop(x + (w - newW) * fx, y + (h - newH) * fy, newW, newH);
  syncZoomSlider();
  update();
}

$("zoom-slider").addEventListener("input", (e) => {
  const t = 1 - e.target.value / 100;
  const { min, max } = state.zoomBounds;
  const newH = min + t * (max - min);
  const { x, y, w, h } = state.crop;
  setCrop(x + (w - newH * ratio()) / 2, y + (h - newH) / 2, newH * ratio(), newH);
  $("zoom-value").textContent = `${Math.round((1 - t) * 100)} %`;
  update();
});

$("rotate-slider").addEventListener("input", (e) => {
  state.rotationDeg = parseFloat(e.target.value);
  $("rotate-value").textContent = `${state.rotationDeg.toFixed(1)}°`;
  // Ankerpunkt (Augenmitte) merken, damit der Ausschnitt sitzen bleibt
  const before = state.face ? { ...state.face.eyeMid } : null;
  const rel = before
    ? { x: (before.x - state.crop.x) / state.crop.w, y: (before.y - state.crop.y) / state.crop.h }
    : null;
  bake();
  if (state.face && rel) {
    setCrop(
      state.face.eyeMid.x - rel.x * state.crop.w,
      state.face.eyeMid.y - rel.y * state.crop.h,
      state.crop.w, state.crop.h
    );
  }
  update();
});

$("btn-auto").addEventListener("click", () => { autoCrop(); update(); });
$("btn-new").addEventListener("click", () => {
  $("upload-section").scrollIntoView({ behavior: "smooth" });
  fileInput.click();
});
$("btn-overlay").addEventListener("click", (e) => {
  state.overlayOn = !state.overlayOn;
  e.target.textContent = L("Schablone: ", "Guide: ") + (state.overlayOn ? L("an", "on") : L("aus", "off"));
  e.target.setAttribute("aria-pressed", state.overlayOn);
  render();
});

/* ============================================================
   Format
   ============================================================ */
const sel = $("format-select");
function buildFormatOptions() {
  const cur = sel.value || state.formatKey;
  sel.innerHTML = "";
  for (const [key, f] of Object.entries(FORMATS)) {
    const o = document.createElement("option");
    o.value = key; o.textContent = f.label[LANG] || f.label.de;
    sel.appendChild(o);
  }
  sel.value = cur;
}
buildFormatOptions();
sel.addEventListener("change", () => {
  state.formatKey = sel.value;
  applyFormat();
});
function applyFormat() {
  const f = fmt();
  $("format-hint").textContent = f.hint[LANG] || f.hint.de;
  // Canvas-Seitenverhältnis anpassen
  const W = 700;
  previewCanvas.width = W;
  previewCanvas.height = Math.round(W / ratio());
  const px = exportPx();
  $("export-single-desc").textContent =
    `${f.wmm % 1 ? f.wmm.toFixed(1) : f.wmm} × ${f.hmm % 1 ? f.hmm.toFixed(1) : f.hmm} mm · ${px.w} × ${px.h} px · ${f.dpi} dpi · JPG`;
  if (state.baked) { autoCrop(); update(); }
}

/* ============================================================
   KI-Hintergrund
   ============================================================ */
document.querySelectorAll(".bg-chip").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (!state.srcBitmap || state.bgBusy) return;
    const mode = btn.dataset.bg;

    if (mode !== "original" && !state.cutoutBitmap) {
      state.bgBusy = true;
      $("bg-progress").hidden = false;
      try {
        const lib = await import(BG_LIB_URL);
        // Quelle als Blob übergeben
        const sc = document.createElement("canvas");
        sc.width = state.srcBitmap.width; sc.height = state.srcBitmap.height;
        sc.getContext("2d").drawImage(state.srcBitmap, 0, 0);
        const srcBlob = await new Promise((r) => sc.toBlob(r, "image/png"));
        const cutBlob = await lib.removeBackground(srcBlob, {
          model: "isnet_quint8",
          output: { format: "image/png" },
        });
        state.cutoutBitmap = await createImageBitmap(cutBlob);
      } catch (e) {
        console.error(e);
        toast(L("KI-Hintergrundentfernung fehlgeschlagen (Netzwerk/Browser). Das Original bleibt erhalten.", "AI background removal failed (network/browser). The original is kept."));
        state.bgBusy = false;
        $("bg-progress").hidden = true;
        return;
      }
      state.bgBusy = false;
      $("bg-progress").hidden = true;
    }

    state.bgMode = mode;
    document.querySelectorAll(".bg-chip").forEach((b) => b.classList.toggle("active", b === btn));
    bake();
    update();
  });
});

/* ============================================================
   Export
   ============================================================ */
function renderCrop(wpx, hpx, watermark = false) {
  const out = document.createElement("canvas");
  out.width = wpx; out.height = hpx;
  const ox = out.getContext("2d");
  ox.imageSmoothingQuality = "high";
  ox.fillStyle = "#ffffff";
  ox.fillRect(0, 0, wpx, hpx);
  const { x, y, w, h } = state.crop;
  ox.drawImage(state.baked, x, y, w, h, 0, 0, wpx, hpx);
  if (watermark) stampWatermark(ox, wpx, hpx);
  return out;
}

/** Diagonales „MUSTER · SPECIMEN"-Wasserzeichen für die Gratis-Vorschau. */
function stampWatermark(cx, w, h) {
  cx.save();
  cx.translate(w / 2, h / 2);
  cx.rotate(-Math.atan2(h, w));
  const step = Math.max(w, h) * 0.16;
  cx.font = `700 ${Math.round(w * 0.075)}px system-ui, sans-serif`;
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  const diag = Math.hypot(w, h);
  for (let y = -diag; y < diag; y += step) {
    cx.fillStyle = "rgba(20,28,45,0.16)";
    cx.fillText("MUSTER · SPECIMEN · MUSTER", 0, y);
  }
  cx.restore();
}

/** Setzt die dpi-Angabe im JFIF-Header eines JPEG-Blobs. */
async function jpegWithDpi(canvas, dpi, quality = 0.93) {
  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
  const buf = new Uint8Array(await blob.arrayBuffer());
  // JFIF-APP0 direkt nach SOI: FF D8 FF E0 .. .. 'JFIF' 00 vv vv units xd xd yd yd
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff && buf[3] === 0xe0) {
    buf[13] = 1; // Einheit: dpi
    buf[14] = (dpi >> 8) & 0xff; buf[15] = dpi & 0xff;
    buf[16] = (dpi >> 8) & 0xff; buf[17] = dpi & 0xff;
  }
  return new Blob([buf], { type: "image/jpeg" });
}

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function doDownloadSingle(watermark) {
  const f = fmt();
  const px = exportPx();
  const blob = await jpegWithDpi(renderCrop(px.w, px.h, watermark), f.dpi);
  downloadBlob(blob, `passbild-${state.formatKey}-${px.w}x${px.h}-${f.dpi}dpi${watermark ? "-vorschau" : ""}.jpg`);
  toast(watermark ? L("Vorschau mit Wasserzeichen heruntergeladen.", "Watermarked preview downloaded.") : L("HD-Passbild wurde heruntergeladen.", "HD passport photo downloaded."));
}

$("btn-download-single").addEventListener("click", () => {
  if (!state.baked) return;
  if (isUnlocked()) doDownloadSingle(false);
  else openPaywall("single");
});

function buildSheet(watermark = false) {
  const f = fmt();
  const dpi = f.dpi;
  // 15 × 10 cm Querformat
  const sheetW = Math.round((150 / 25.4) * dpi);
  const sheetH = Math.round((100 / 25.4) * dpi);
  const px = exportPx();
  const gap = Math.round(dpi * 0.04); // ~1 mm Schnittluft
  const cols = Math.max(1, Math.floor((sheetW + gap) / (px.w + gap)));
  const rows = Math.max(1, Math.floor((sheetH + gap) / (px.h + gap)));
  const gridW = cols * px.w + (cols - 1) * gap;
  const gridH = rows * px.h + (rows - 1) * gap;
  const offX = Math.round((sheetW - gridW) / 2);
  const offY = Math.round((sheetH - gridH) / 2);

  const sheet = document.createElement("canvas");
  sheet.width = sheetW; sheet.height = sheetH;
  const sx = sheet.getContext("2d");
  sx.fillStyle = "#ffffff";
  sx.fillRect(0, 0, sheetW, sheetH);

  const photo = renderCrop(px.w, px.h, watermark);
  sx.strokeStyle = "#b6b6b6";
  sx.lineWidth = Math.max(1, Math.round(dpi / 300));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const X = offX + c * (px.w + gap);
      const Y = offY + r * (px.h + gap);
      sx.drawImage(photo, X, Y);
      sx.strokeRect(X + 0.5, Y + 0.5, px.w, px.h);
    }
  }
  return { sheet, count: rows * cols };
}

async function doDownloadSheet(watermark) {
  const f = fmt();
  const { sheet, count } = buildSheet(watermark);
  const blob = await jpegWithDpi(sheet, f.dpi);
  downloadBlob(blob, `passbild-druckbogen-10x15-${count}stk${watermark ? "-vorschau" : ""}.jpg`);
  toast(L(`Druckbogen mit ${count} Bildern wurde heruntergeladen.`, `Print sheet with ${count} photos downloaded.`));
}

$("btn-download-sheet").addEventListener("click", () => {
  if (!state.baked) return;
  if (isUnlocked()) doDownloadSheet(false);
  else openPaywall("sheet");
});

/* Vorschau-Thumbnails im Export-Bereich */
let thumbTimer = null;
function updateExportThumbs() {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(() => {
    if (!state.baked) return;
    const single = renderCrop(140, Math.round(140 / ratio()));
    $("export-thumb-single").style.backgroundImage = `url(${single.toDataURL("image/jpeg", 0.7)})`;
    const { sheet, count } = buildSheetPreview();
    $("export-thumb-sheet").style.backgroundImage = `url(${sheet})`;
    const desc = document.querySelector("#export-thumb-sheet + h3 + p");
    if (desc) desc.textContent = L(
      `${count} Passbilder mit Schnittmarken – im Drogeriemarkt oder Fotolabor als normales 10×15-Foto (ca. 0,10–0,25 €) ausdrucken lassen.`,
      `${count} photos with cut marks – print as a standard 4×6 in / 10×15 cm photo at any drugstore or photo lab (approx. €0.10–0.25).`);
  }, 200);
}
function buildSheetPreview() {
  const { sheet, count } = buildSheet();
  const p = document.createElement("canvas");
  p.width = 360; p.height = 240;
  p.getContext("2d").drawImage(sheet, 0, 0, 360, 240);
  return { sheet: p.toDataURL("image/jpeg", 0.7), count };
}

/* ============================================================
   Paywall
   ============================================================ */
let pendingDownload = null; // "single" | "sheet"

function openPaywall(which) {
  pendingDownload = which;
  $("pay-price").textContent = PAYMENTS.priceLabel;
  $("pay-demo-note").hidden = !!PAYMENTS.paymentLink;
  $("paywall-modal").hidden = false;
}
function closePaywall() { $("paywall-modal").hidden = true; }

function runPendingDownload(watermark) {
  if (pendingDownload === "single") doDownloadSingle(watermark);
  else if (pendingDownload === "sheet") doDownloadSheet(watermark);
}

$("pay-cancel").addEventListener("click", closePaywall);
$("paywall-modal").addEventListener("click", (e) => { if (e.target.id === "paywall-modal") closePaywall(); });

$("pay-preview").addEventListener("click", () => {
  runPendingDownload(true);   // Gratis-Vorschau mit Wasserzeichen
  closePaywall();
});

$("pay-buy").addEventListener("click", () => {
  if (PAYMENTS.paymentLink) {
    // Zur Stripe-Bezahlseite; nach Zahlung Rückkehr mit ?paid=1
    try { sessionStorage.setItem("pbp_pending", pendingDownload || ""); } catch (e) {}
    window.location.href = PAYMENTS.paymentLink;
  } else {
    // DEMO-MODUS: ohne echte Zahlung freischalten
    setUnlocked(true);
    closePaywall();
    toast(L("Demo-Modus: HD freigeschaltet (kein Stripe-Link hinterlegt).", "Demo mode: HD unlocked (no Stripe link configured)."));
    runPendingDownload(false);
  }
});

/* Nach Rückkehr von Stripe: ?paid=1 → freischalten und Download auslösen */
(function handlePaidReturn() {
  const params = new URLSearchParams(location.search);
  if (params.get("paid") === "1") {
    setUnlocked(true);
    // URL säubern
    history.replaceState(null, "", location.pathname);
    let pend = null;
    try { pend = sessionStorage.getItem("pbp_pending"); } catch (e) {}
    toast(L("Zahlung erfolgreich – HD ist freigeschaltet. Danke!", "Payment successful – HD is unlocked. Thank you!"));
  }
})();

setUnlocked(paidUnlocked); // Body-Klasse initial setzen

/* Sprachumschaltung */
const langToggle = $("lang-toggle");
if (langToggle) langToggle.addEventListener("click", () => setLang(LANG === "de" ? "en" : "de"));

/* ============================================================
   Init
   ============================================================ */
applyFormat();
applyLang();

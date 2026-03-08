// ============================================================
//  InfoPal — infopal.js
//  Theme · Constants · PDF/OCR extraction · RAG · Helpers
// ============================================================

// ── Theme colors ────────────────────────────────────────────
export const C = {
  bg:         "#212121",
  sidebar:    "#171717",
  surface:    "#2f2f2f",
  surfaceHov: "#3a3a3a",
  input:      "#2f2f2f",
  border:     "#3f3f3f",
  accent:     "#10a37f",
  text:       "#ececec",
  textSub:    "#8e8ea0",
  textMid:    "#b4b4b4",
  nav:        "#171717",
  danger:     "#ef4444",
  success:    "#10a37f",
};

export const DOC_COLORS = [
  "#10a37f", "#6366f1", "#f59e0b", "#ec4899",
  "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
];

// ── System prompt ────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are InfoPal — a smart, friendly AI assistant. You have two modes:

1. DOCUMENT MODE: When document context is provided, answer from those documents and cite the source.
2. GENERAL MODE: When no documents are provided, be a helpful general-purpose AI — answer questions, help with writing, explain concepts, write code, brainstorm, etc.

Be warm, concise, and use markdown formatting (bullet points with -, **bold**, numbered lists, code blocks).`;

// ── Global CSS ───────────────────────────────────────────────
export const GLOBAL_STYLES = `
  @keyframes ip-spin   { to { transform: rotate(360deg) } }
  @keyframes ip-fadein { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } }
  @keyframes ip-blink  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(.5);opacity:.4} }
  * { box-sizing:border-box; margin:0; padding:0; }
  textarea { outline:none !important; }
  button { font-family:inherit; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3f3f3f; border-radius: 10px; }
  textarea::placeholder { color: #8e8ea0; }
`;

// ── PDF.js lazy loader ───────────────────────────────────────
export const loadPdfJs = () => new Promise(resolve => {
  if (window.pdfjsLib) return resolve(window.pdfjsLib);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  s.onload = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    resolve(window.pdfjsLib);
  };
  document.head.appendChild(s);
});

// ── Tesseract OCR lazy loader ────────────────────────────────
export const loadTesseract = () => new Promise(resolve => {
  if (window.Tesseract) return resolve(window.Tesseract);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js";
  s.onload = () => resolve(window.Tesseract);
  document.head.appendChild(s);
});

// ── Run OCR on a canvas element ──────────────────────────────
async function ocrCanvas(canvas) {
  const T = await loadTesseract();
  const { data: { text } } = await T.recognize(canvas, "eng", { logger: () => {} });
  return text;
}

// ── Extract text from a PDF file
//    Digitally created pages → PDF.js text layer
//    Scanned / image-only pages → render to canvas + Tesseract
export async function extractPdf(file, onProgress) {
  const lib = await loadPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  let fullText = "";
  let ocrUsed  = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`Reading page ${i}/${pdf.numPages}…`);
    const page     = await pdf.getPage(i);
    const content  = await page.getTextContent();
    const pageText = content.items.map(x => x.str).join(" ").trim();

    if (pageText.length > 30) {
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    } else {
      ocrUsed = true;
      onProgress?.(`OCR scanning page ${i}/${pdf.numPages}…`);
      const vp     = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width  = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      fullText += `\n--- Page ${i} (OCR) ---\n${await ocrCanvas(canvas)}`;
    }
  }
  return { text: fullText.trim(), ocrUsed };
}

// ── Extract text from any supported file ────────────────────
export async function extractText(file, onProgress) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (ext === ".pdf") return extractPdf(file, onProgress);
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res({ text: e.target.result, ocrUsed: false });
    r.onerror = rej;
    r.readAsText(file);
  });
}

// ── Split document text into overlapping chunks ──────────────
export function chunkText(text, size = 900, lap = 120) {
  const chunks = [];
  let s = 0;
  while (s < text.length) {
    chunks.push(text.slice(s, Math.min(s + size, text.length)));
    s += size - lap;
  }
  return chunks;
}

// ── Keyword-weighted chunk retrieval ────────────────────────
export function retrieveChunks(query, docs, topK = 5) {
  const stop = new Set([
    "the","and","for","are","but","not","you","all","can","was","one","our",
    "out","had","have","has","this","that","with","from","they","will","been",
    "when","who","what","how","which","about","its","also","just","more","into",
    "than","their","there","then","some","other","over","such","your",
  ]);
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length >= 2 && !stop.has(w));
  if (!words.length) return [];

  const scored = [];
  for (const doc of docs) {
    for (let i = 0; i < doc.chunks.length; i++) {
      const ch = doc.chunks[i].toLowerCase();
      let sc = 0;
      for (const w of words) {
        try { sc += (ch.match(new RegExp(w, "gi")) || []).length * Math.max(1, w.length - 2); } catch {}
      }
      if (sc > 0) scored.push({ docName: doc.name, chunk: doc.chunks[i], score: sc });
    }
  }

  // Fallback: return first 2 chunks per doc if nothing scored
  if (!scored.length && docs.length) {
    const fb = [];
    for (const doc of docs)
      for (let i = 0; i < Math.min(2, doc.chunks.length); i++)
        fb.push({ docName: doc.name, chunk: doc.chunks[i], score: 0 });
    return fb.slice(0, topK);
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

// ── Misc helpers ─────────────────────────────────────────────
export const fmtSize = b =>
  b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export const fmtTime = d =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const uid = () => Math.random().toString(36).slice(2);

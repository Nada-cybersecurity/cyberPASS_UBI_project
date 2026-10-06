// In-browser PDF text extraction. Files never leave the browser in demo mode.
// The pdf.js worker runs on the main thread (imported into the bundle) so the app works as a
// single self-contained file under a strict content-security policy (no worker URLs).
import * as pdfjs from 'pdfjs-dist';
import * as pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';

(globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = pdfWorker;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_PAGES = 40;

/** Magic-byte check: a renamed file is rejected even if its extension says .pdf. */
export function isPdf(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  if (!isPdf(bytes)) throw new Error('This file is not a valid PDF. Upload a PDF or a .txt file.');
  const doc = await pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false, // hardening against font-based code execution (CVE-2024-4367 class)
    disableFontFace: true,
    useSystemFonts: false,
  }).promise;
  if (doc.numPages > MAX_PAGES) throw new Error(`This PDF has ${doc.numPages} pages. The demo accepts up to ${MAX_PAGES}.`);
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : '')).join(''));
  }
  await doc.destroy();
  const text = parts.join('\n');
  if (text.trim().length < 40) throw new Error('No readable text found. Scanned images need OCR, which is on the roadmap.');
  return text;
}

export function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

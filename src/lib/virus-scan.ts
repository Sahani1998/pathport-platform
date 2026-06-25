// Lightweight virus/malware pre-check before file acceptance.
//
// Two layers:
//   1. Magic byte validation — free, instant, no external dependency.
//      Rejects files whose binary header does not match the claimed MIME type
//      (defence-in-depth on top of extension + MIME checks in upload routes).
//   2. Optional external scan API — set VIRUS_SCAN_API_URL and
//      VIRUS_SCAN_API_KEY env vars to enable. Expects multipart/form-data
//      POST with field "file"; responds with JSON { clean: boolean, threat?: string }.
//      If not configured, this layer is skipped (fail-open by design — magic
//      byte check still runs).

export type ScanStatus = "clean" | "threat" | "error";

export interface ScanResult {
  status: ScanStatus;
  threat?: string;
}

// ─── Magic byte signatures ────────────────────────────────────────────────────
const SIGNATURES: { mimes: string[]; magic: number[] }[] = [
  { mimes: ["application/pdf"],              magic: [0x25, 0x50, 0x44, 0x46] },           // %PDF
  { mimes: ["image/jpeg"],                   magic: [0xff, 0xd8, 0xff] },                  // JPEG SOI
  { mimes: ["image/png"],                    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a] }, // PNG
];

function checkMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const sig = SIGNATURES.find(s => s.mimes.includes(mimeType));
  if (!sig) return true; // unknown type — don't block
  const readLen = Math.min(buffer.byteLength, sig.magic.length + 4);
  const bytes = new Uint8Array(buffer, 0, readLen);
  return sig.magic.every((b, i) => bytes[i] === b);
}

// ─── External scan ────────────────────────────────────────────────────────────
async function callExternalScanner(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<ScanResult> {
  const apiUrl = process.env.VIRUS_SCAN_API_URL;
  const apiKey = process.env.VIRUS_SCAN_API_KEY;
  if (!apiUrl) return { status: "clean" };

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), fileName);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      body: form,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(`[VirusScan] scanner API returned ${res.status}`);
      return { status: "error" };
    }

    const json = await res.json() as { clean: boolean; threat?: string };
    if (!json.clean) {
      return { status: "threat", threat: json.threat ?? "unknown" };
    }
    return { status: "clean" };
  } catch (err) {
    console.error("[VirusScan] scanner request failed:", err);
    return { status: "error" };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function scanFile(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<ScanResult> {
  // Layer 1: magic byte check
  if (!checkMagicBytes(buffer, mimeType)) {
    console.warn(`[VirusScan] magic byte mismatch: claimed=${mimeType} file=${fileName}`);
    return { status: "threat", threat: "file_content_mismatch" };
  }

  // Layer 2: external scanner (skip if not configured)
  return callExternalScanner(buffer, fileName, mimeType);
}

// Sniffs the real file type from its magic bytes.
//
// The browser-supplied Content-Type is only a hint: a .txt renamed to .jpg
// arrives declaring image/jpeg. Nothing is stored until these bytes agree.

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function ascii(buffer: Buffer, offset: number, length: number): string {
  if (buffer.length < offset + length) return "";
  return buffer.subarray(offset, offset + length).toString("ascii");
}

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export type AllowedMime = (typeof IMAGE_MIME_TYPES)[number] | (typeof VIDEO_MIME_TYPES)[number];

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export function isAllowedMime(mime: string): mime is AllowedMime {
  return (
    (IMAGE_MIME_TYPES as readonly string[]).includes(mime) ||
    (VIDEO_MIME_TYPES as readonly string[]).includes(mime)
  );
}

export function kindForMime(mime: string): "image" | "video" {
  return mime.startsWith("image/") ? "image" : "video";
}

/** Returns the detected mime type, or null when the bytes match nothing known. */
export function detectMime(buffer: Buffer): AllowedMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    return "image/png";
  }

  const gif = ascii(buffer, 0, 6);
  if (gif === "GIF87a" || gif === "GIF89a") {
    return "image/gif";
  }

  if (ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 4) === "WEBP") {
    return "image/webp";
  }

  // ISO base media container: brand at bytes 8-12 decides the flavour.
  if (ascii(buffer, 4, 4) === "ftyp") {
    const brand = ascii(buffer, 8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "qt  ") return "video/quicktime";
    if (
      [
        "isom",
        "iso2",
        "iso4",
        "iso5",
        "iso6",
        "mp41",
        "mp42",
        "avc1",
        "dash",
        "M4V ",
        "mmp4",
      ].includes(brand)
    ) {
      return "video/mp4";
    }
    return null;
  }

  // Matroska / WebM EBML header.
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }

  return null;
}

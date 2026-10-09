import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import type { AllowedMime } from "./file-signature.js";

/** Uploads are re-encoded at this width, so a 12MP phone photo never ships as-is. */
const MAIN_MAX_WIDTH = 1600;
/** The card-sized copy used by story cards and the studio library. */
const THUMB_MAX_WIDTH = 800;
const QUALITY = 82;

export type ProcessedImage = {
  width: number;
  height: number;
  sizeBytes: number;
  /** Absolute path of the smaller copy, or null when the image is already small. */
  thumbFilePath: string | null;
};

function encoder(mime: AllowedMime): (pipeline: Sharp) => Sharp {
  switch (mime) {
    case "image/jpeg":
      return (pipeline) => pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
    case "image/png":
      return (pipeline) => pipeline.png({ compressionLevel: 9, effort: 7 });
    case "image/webp":
      return (pipeline) => pipeline.webp({ quality: QUALITY });
    case "image/avif":
      return (pipeline) => pipeline.avif({ quality: 55, effort: 4 });
    default:
      return (pipeline) => pipeline;
  }
}

/**
 * Re-encodes an uploaded image in place at a web-friendly width, strips its
 * metadata (including GPS), and writes an 800px copy beside it. The source is
 * buffered first because sharp cannot read and write the same path.
 */
export async function processImage(filePath: string, mime: AllowedMime): Promise<ProcessedImage> {
  const source = await readFile(filePath);
  const encode = encoder(mime);

  const { data, info } = await encode(
    sharp(source).rotate().resize({ width: MAIN_MAX_WIDTH, withoutEnlargement: true }),
  ).toBuffer({ resolveWithObject: true });
  await writeFile(filePath, data);

  let thumbFilePath: string | null = null;
  if (info.width > THUMB_MAX_WIDTH) {
    const parsed = path.parse(filePath);
    thumbFilePath = path.join(parsed.dir, `${parsed.name}-800${parsed.ext}`);
    await encode(
      sharp(source).rotate().resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true }),
    ).toFile(thumbFilePath);
  }

  const stats = await stat(filePath);
  return { width: info.width, height: info.height, sizeBytes: stats.size, thumbFilePath };
}

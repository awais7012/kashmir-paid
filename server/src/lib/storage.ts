import { open } from "node:fs/promises";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";

export const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);

export async function ensureUploadRoot(): Promise<void> {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
}

/** "2026/09" — keeps directories from growing without bound. */
export function monthSegment(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}`;
}

export async function ensureMonthDir(segment: string): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, segment);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** Public path stored on the row and returned to clients, e.g. /uploads/2026/09/x.jpg */
export function publicUrlFor(relativePath: string): string {
  return `/uploads/${relativePath.split(path.sep).join("/")}`;
}

/** Inverse of publicUrlFor, for rows that only store the public URL. */
export function relativePathFromPublicUrl(url: string): string | null {
  const prefix = "/uploads/";
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export function absolutePathFor(relativePath: string): string {
  const full = path.resolve(UPLOAD_ROOT, relativePath);
  if (full !== UPLOAD_ROOT && !full.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error("Resolved path escapes the upload root");
  }
  return full;
}

export async function removeStoredFile(relativePath: string): Promise<void> {
  try {
    await fs.unlink(absolutePathFor(relativePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

/** Reads only the first bytes so sniffing never loads a whole video into memory. */
export async function readFileHead(filePath: string, bytes = 32): Promise<Buffer> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

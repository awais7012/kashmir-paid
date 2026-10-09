import { rename } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { env } from "../../env.js";
import { detectMime, EXTENSION_BY_MIME, kindForMime } from "../../lib/file-signature.js";
import { HttpError } from "../../lib/http-error.js";
import { processImage } from "../../lib/image-processing.js";
import { publicUrlFor, readFileHead, removeStoredFile, UPLOAD_ROOT } from "../../lib/storage.js";
import { uploadFieldsSchema } from "./media.schema.js";
import * as service from "./media.service.js";

export async function upload(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    throw new HttpError(400, "Attach a file in the 'file' field");
  }

  let storedPath = file.path;
  let relativePath = path.relative(UPLOAD_ROOT, storedPath);
  let thumbRelativePath: string | null = null;

  try {
    // Trust the bytes, not the label. A text file renamed .jpg dies here.
    const head = await readFileHead(storedPath, 32);
    const detected = detectMime(head);

    if (!detected) {
      throw new HttpError(
        415,
        "That file is not a recognised image or video. Its contents do not match any supported format.",
      );
    }

    const kind = kindForMime(detected);
    const limit = kind === "image" ? env.maxImageBytes : env.maxVideoBytes;

    if (file.size > limit) {
      const limitMb = Math.round(limit / (1024 * 1024));
      throw new HttpError(413, `That ${kind} is larger than the ${limitMb} MB limit`);
    }

    // multer names the file from the declared mime; when the sniffed bytes
    // disagree, rename so extension, Content-Type and content all match.
    const detectedExtension = EXTENSION_BY_MIME[detected];
    const declaredExtension = path.extname(storedPath).toLowerCase();
    if (detectedExtension && detectedExtension !== declaredExtension) {
      const correctedPath = `${storedPath.slice(0, -declaredExtension.length)}${detectedExtension}`;
      await rename(storedPath, correctedPath);
      storedPath = correctedPath;
      relativePath = path.relative(UPLOAD_ROOT, storedPath);
    }

    const fields = uploadFieldsSchema.safeParse(req.body);

    let width = fields.success ? (fields.data.width ?? null) : null;
    let height = fields.success ? (fields.data.height ?? null) : null;
    let sizeBytes = file.size;

    // GIFs keep their bytes: re-encoding would flatten an animation.
    if (kind === "image" && detected !== "image/gif") {
      const processed = await processImage(storedPath, detected).catch((error: unknown) => {
        console.error("[media] image processing failed:", error);
        throw new HttpError(422, "That image could not be processed. Try a different file.");
      });

      width = processed.width;
      height = processed.height;
      sizeBytes = processed.sizeBytes;
      if (processed.thumbFilePath) {
        thumbRelativePath = path.relative(UPLOAD_ROOT, processed.thumbFilePath);
      }
    }

    const row = await service.createMedia({
      filename: relativePath,
      originalName: file.originalname,
      mime: detected,
      sizeBytes,
      width,
      height,
      thumbUrl: thumbRelativePath ? publicUrlFor(thumbRelativePath) : null,
      createdBy: req.admin?.id ?? null,
    });

    res.status(201).json({ data: service.toMediaDto(row) });
  } catch (error) {
    // Never leave a stray file behind when validation rejects the upload.
    await removeStoredFile(relativePath).catch(() => undefined);
    if (thumbRelativePath) {
      await removeStoredFile(thumbRelativePath).catch(() => undefined);
    }
    throw error;
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated.query as { kind?: "image" | "video"; limit: number; offset: number };

  const [rows, total] = await Promise.all([
    service.listMedia({ kind: query.kind, limit: query.limit, offset: query.offset }),
    service.countMedia(query.kind),
  ]);

  res.json({
    data: rows.map(service.toMediaDto),
    meta: { total, limit: query.limit, offset: query.offset },
  });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.validated.params as { id: string };
  const outcome = await service.deleteMedia(id);

  if (outcome.status === "not_found") {
    throw new HttpError(404, "Media not found");
  }

  if (outcome.status === "in_use") {
    throw new HttpError(409, outcome.message);
  }

  res.status(204).send();
}

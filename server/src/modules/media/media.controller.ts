import path from "node:path";
import type { Request, Response } from "express";
import { env } from "../../env.js";
import { detectMime, kindForMime } from "../../lib/file-signature.js";
import { HttpError } from "../../lib/http-error.js";
import { readFileHead, removeStoredFile, UPLOAD_ROOT } from "../../lib/storage.js";
import { uploadFieldsSchema } from "./media.schema.js";
import * as service from "./media.service.js";

export async function upload(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    throw new HttpError(400, "Attach a file in the 'file' field");
  }

  const relativePath = path.relative(UPLOAD_ROOT, file.path);

  try {
    // Trust the bytes, not the label. A text file renamed .jpg dies here.
    const head = await readFileHead(file.path, 32);
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

    const fields = uploadFieldsSchema.safeParse(req.body);

    const row = await service.createMedia({
      filename: relativePath,
      originalName: file.originalname,
      mime: detected,
      sizeBytes: file.size,
      width: fields.success ? (fields.data.width ?? null) : null,
      height: fields.success ? (fields.data.height ?? null) : null,
      createdBy: req.admin?.id ?? null,
    });

    res.status(201).json({ data: service.toMediaDto(row) });
  } catch (error) {
    // Never leave a stray file behind when validation rejects the upload.
    await removeStoredFile(relativePath).catch(() => undefined);
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
    throw new HttpError(
      409,
      `Still used by “${outcome.storyTitle}”. Remove it from that story first.`,
    );
  }

  res.status(204).send();
}

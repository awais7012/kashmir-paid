import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../env.js";
import { HttpError } from "../lib/http-error.js";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ER_DUP_ENTRY"
  );
}

function isMulterError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "MulterError"
  );
}

function isMulterLimitError(error: unknown): boolean {
  return isMulterError(error) && (error as { code?: unknown }).code === "LIMIT_FILE_SIZE";
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  let status = 500;
  let message = "Internal server error";
  let details: unknown;

  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    status = 422;
    message = "Validation failed";
    details = error.flatten();
  } else if (isDuplicateKeyError(error)) {
    status = 409;
    message = "A record with that value already exists";
  } else if (isMulterLimitError(error)) {
    status = 413;
    message = `That file is larger than the ${env.MAX_VIDEO_MB} MB upload limit`;
  } else if (isMulterError(error)) {
    status = 400;
    message = "That upload could not be read";
  } else if (error instanceof Error) {
    message = env.isProduction ? "Internal server error" : error.message;
  }

  if (status >= 500) {
    console.error("[api] unhandled error:", error);
  }

  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}

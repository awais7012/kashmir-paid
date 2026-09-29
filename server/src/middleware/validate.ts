import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { HttpError } from "../lib/http-error.js";

export type ValidationSource = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, source: ValidationSource = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(new HttpError(422, "Validation failed", result.error.flatten()));
      return;
    }

    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}

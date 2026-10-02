import type { Request, Response } from "express";
import * as service from "./settings.service.js";
import type { UpdateSettingsInput } from "./settings.schema.js";

// Everything in settings is public-facing copy, so the public read returns it all.
export async function read(_req: Request, res: Response): Promise<void> {
  res.json({ data: service.withDerivedVideo(await service.getSettings()) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const patch = req.validated.body as UpdateSettingsInput;
  res.json({ data: service.withDerivedVideo(await service.updateSettings(patch)) });
}

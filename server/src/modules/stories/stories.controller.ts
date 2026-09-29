import type { Request, Response } from "express";
import { HttpError } from "../../lib/http-error.js";
import type { CreateStoryInput, ListStoriesQuery, UpdateStoryInput } from "./stories.schema.js";
import * as service from "./stories.service.js";

function readListQuery(req: Request): ListStoriesQuery {
  return req.validated.query as ListStoriesQuery;
}

async function respondWithList(
  res: Response,
  query: ListStoriesQuery,
  includeUnpublished: boolean,
): Promise<void> {
  const [rows, total] = await Promise.all([
    service.listStories(query, { includeUnpublished }),
    service.countStories(query, { includeUnpublished }),
  ]);

  res.json({
    data: rows.map(service.toStoryDto),
    meta: { total, limit: query.limit, offset: query.offset },
  });
}

export async function listPublished(req: Request, res: Response): Promise<void> {
  await respondWithList(res, readListQuery(req), false);
}

export async function listAll(req: Request, res: Response): Promise<void> {
  await respondWithList(res, readListQuery(req), true);
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  res.json({ data: await service.listCategories() });
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.validated.params as { slug: string };

  const row = await service.getPublishedStoryBySlug(slug);
  if (!row) {
    throw new HttpError(404, "Story not found");
  }

  res.json({ data: service.toStoryDto(row) });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.validated.params as { id: string };

  const row = await service.getStoryById(id);
  if (!row) {
    throw new HttpError(404, "Story not found");
  }

  res.json({ data: service.toStoryDto(row) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = req.validated.body as CreateStoryInput;

  const existing = await service.getStoryBySlug(input.slug);
  if (existing) {
    throw new HttpError(409, "A story with that slug already exists");
  }

  const row = await service.createStory(input);
  res.status(201).json({ data: service.toStoryDto(row) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.validated.params as { id: string };
  const input = req.validated.body as UpdateStoryInput;

  const row = await service.updateStory(id, input);
  if (!row) {
    throw new HttpError(404, "Story not found");
  }

  res.json({ data: service.toStoryDto(row) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.validated.params as { id: string };

  const deleted = await service.deleteStory(id);
  if (!deleted) {
    throw new HttpError(404, "Story not found");
  }

  res.status(204).send();
}

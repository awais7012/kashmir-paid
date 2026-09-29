import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./stories.controller.js";
import {
  createStorySchema,
  listStoriesQuerySchema,
  storyIdParamSchema,
  storySlugParamSchema,
  updateStorySchema,
} from "./stories.schema.js";

// Public, read-only. Only stories with published_at <= now are visible.
export const storiesRouter = Router();

storiesRouter.get("/", validate(listStoriesQuerySchema, "query"), controller.listPublished);
storiesRouter.get("/categories", controller.listCategories);
storiesRouter.get("/:slug", validate(storySlugParamSchema, "params"), controller.getBySlug);

// Admin CRUD. Requires a valid Bearer JWT from POST /api/auth/login.
export const adminStoriesRouter = Router();

adminStoriesRouter.use(requireAuth);
adminStoriesRouter.get("/", validate(listStoriesQuerySchema, "query"), controller.listAll);
adminStoriesRouter.post("/", validate(createStorySchema), controller.create);
adminStoriesRouter.get("/:id", validate(storyIdParamSchema, "params"), controller.getById);
adminStoriesRouter.put(
  "/:id",
  validate(storyIdParamSchema, "params"),
  validate(updateStorySchema),
  controller.update,
);
adminStoriesRouter.delete("/:id", validate(storyIdParamSchema, "params"), controller.remove);

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./media.controller.js";
import { listMediaQuerySchema, mediaIdParamSchema } from "./media.schema.js";
import { uploadSingleFile } from "./media.upload.js";

export const adminMediaRouter = Router();

adminMediaRouter.use(requireAuth);
adminMediaRouter.get("/", validate(listMediaQuerySchema, "query"), controller.list);
adminMediaRouter.post("/", uploadSingleFile, controller.upload);
adminMediaRouter.delete("/:id", validate(mediaIdParamSchema, "params"), controller.remove);

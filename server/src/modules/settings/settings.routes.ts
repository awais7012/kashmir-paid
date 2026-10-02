import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./settings.controller.js";
import { updateSettingsSchema } from "./settings.schema.js";

export const settingsRouter = Router();

settingsRouter.get("/", controller.read);

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAuth);
adminSettingsRouter.get("/", controller.read);
adminSettingsRouter.put("/", validate(updateSettingsSchema, "body"), controller.update);

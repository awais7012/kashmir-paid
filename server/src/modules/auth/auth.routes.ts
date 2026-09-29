import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema } from "./auth.schema.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema, "body"), controller.login);
authRouter.get("/me", requireAuth, controller.me);

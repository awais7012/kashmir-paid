import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import { changePasswordSchema, loginSchema } from "./auth.schema.js";

export const authRouter = Router();

// Only the routes that verify a password are throttled, so a guess cannot be
// brute-forced through either endpoint. Other routes share this router, and
// limiting /me would sign editors out during ordinary page loads.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", credentialLimiter, validate(loginSchema, "body"), controller.login);
authRouter.get("/me", requireAuth, controller.me);
authRouter.put(
  "/password",
  credentialLimiter,
  requireAuth,
  validate(changePasswordSchema, "body"),
  controller.changePassword,
);

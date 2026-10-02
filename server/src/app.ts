import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { pool } from "./db/client.js";
import { env } from "./env.js";
import { UPLOAD_ROOT } from "./lib/storage.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminMediaRouter } from "./modules/media/media.routes.js";
import { adminSettingsRouter, settingsRouter } from "./modules/settings/settings.routes.js";
import { adminStoriesRouter, storiesRouter } from "./modules/stories/stories.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // crossOriginResourcePolicy must be relaxed: uploads are served from this
  // origin and embedded by the site on another origin, which the default
  // "same-origin" policy silently blocks.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  app.use(
    cors({
      origin: env.CORS_ORIGINS.includes("*") ? true : env.CORS_ORIGINS,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  // Uploaded media. express.static answers Range requests, so video seeking works.
  app.use(
    "/uploads",
    express.static(UPLOAD_ROOT, {
      maxAge: "1y",
      immutable: true,
      index: false,
      dotfiles: "deny",
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.isProduction ? "combined" : "dev"));

  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("select 1");
      res.json({ status: "ok", database: "up", uptime: process.uptime() });
    } catch (error) {
      console.error("[api] health check failed:", error);
      res.status(503).json({ status: "degraded", database: "down" });
    }
  });

  app.use("/api/auth", authRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/stories", storiesRouter);
  app.use("/api/admin/stories", adminStoriesRouter);
  app.use("/api/admin/media", adminMediaRouter);
  app.use("/api/admin/settings", adminSettingsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

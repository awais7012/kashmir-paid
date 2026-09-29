import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { pool } from "./db/client.js";
import { env } from "./env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminStoriesRouter, storiesRouter } from "./modules/stories/stories.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.includes("*") ? true : env.CORS_ORIGINS,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/stories", storiesRouter);
  app.use("/api/admin/stories", adminStoriesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

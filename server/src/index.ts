import { createApp } from "./app.js";
import { closePool } from "./db/client.js";
import { env } from "./env.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(
    `[api] Kashmir Connect API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[api] ${signal} received, shutting down`);

  server.close(() => {
    void closePool()
      .catch((error) => console.error("[api] error closing database pool:", error))
      .finally(() => process.exit(0));
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

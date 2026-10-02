import { createApp } from "./app.js";
import { closePool } from "./db/client.js";
import { env } from "./env.js";
import { ensureUploadRoot, UPLOAD_ROOT } from "./lib/storage.js";

async function main(): Promise<void> {
  // The upload directory has to exist before the static handler serves from it.
  await ensureUploadRoot();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(
      `[api] Kashmir Connect API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
    );
    console.log(`[api] uploads served from ${UPLOAD_ROOT}`);
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
}

main().catch((error) => {
  console.error("[api] failed to start:", error);
  process.exit(1);
});

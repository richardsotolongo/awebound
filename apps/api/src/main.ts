import { buildContainer } from "./container";
import { loadEnv } from "./infrastructure/config/env";
import { createLogger } from "./infrastructure/logger";
import { createApp } from "./interface/http/app";

// Load apps/api/.env when present (Node 20.12+). Real environments set variables directly.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the environment.
}

const env = loadEnv();
const logger = createLogger(env);
const container = buildContainer(env, logger);
const app = createApp(container, env, logger);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "awebound api listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

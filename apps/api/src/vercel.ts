import type { IncomingMessage, ServerResponse } from "node:http";
import { buildContainer } from "./container";
import { loadEnv } from "./infrastructure/config/env";
import { createLogger } from "./infrastructure/logger";
import { createApp } from "./interface/http/app";

/**
 * Vercel Function entry (see tsup.vercel.config.ts). Same app as main.ts, without listen():
 * Vercel hands each request to the default export. Variables come from the Vercel project.
 */
type Handler = (req: IncomingMessage, res: ServerResponse) => void;

function boot(): Handler {
  try {
    const env = loadEnv();
    const logger = createLogger(env);
    const app = createApp(buildContainer(env, logger), env, logger);
    logger.info("awebound api ready (vercel)");
    return (req, res) => app(req, res);
  } catch (err) {
    // Usually a missing or invalid environment variable. Log it and answer every request with a
    // 500 so the cause shows in the function logs instead of a crash loop.
    console.error(err);
    return (_req, res) => {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          error: { code: "misconfigured", message: "The API is not configured. Check the logs." },
        }),
      );
    };
  }
}

const handler = boot();
export default handler;

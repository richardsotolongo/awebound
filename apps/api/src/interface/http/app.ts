import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { Container } from "../../container";
import type { Env } from "../../infrastructure/config/env";
import type { AppLogger } from "../../infrastructure/logger";
import { errorHandler, notFound, requestLogger } from "./middleware";
import { v1Routes } from "./routes";

/** Builds the Express app from wired use cases. No adapters are created here. */
export function createApp(container: Container, env: Env, logger: AppLogger) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY ? 1 : false);
  app.set("query parser", "extended");

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      methods: ["GET", "POST", "PATCH"],
      allowedHeaders: ["content-type", "authorization"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(requestLogger(logger));

  app.get("/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, service: "awebound-api", time: new Date().toISOString() });
  });
  app.use("/v1", v1Routes(container));

  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}

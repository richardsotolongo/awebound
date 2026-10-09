import { pino } from "pino";
import type { Env } from "./config/env";

export function createLogger(env: Pick<Env, "LOG_LEVEL" | "NODE_ENV">) {
  return pino({
    level: env.LOG_LEVEL,
    base: { service: "awebound-api" },
    redact: { paths: ["req.headers.authorization", "*.email", "email"], censor: "[redacted]" },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type AppLogger = ReturnType<typeof createLogger>;

import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import type { ApiErrorBody, ErrorCode } from "@awebound/shared";
import type { AuthenticatedUser, Logger, TokenVerifier } from "../../application/ports";
import { DomainError, UnauthorizedError } from "../../domain/errors";

/** The signed-in user that requireUser/optionalUser put on res.locals. */
export function currentUser(res: Response): AuthenticatedUser | undefined {
  return (res.locals as { user?: AuthenticatedUser }).user;
}

function setUser(res: Response, user: AuthenticatedUser) {
  (res.locals as { user?: AuthenticatedUser }).user = user;
}

function sendError(res: Response, status: number, code: ErrorCode, message: string, fields?: Record<string, string[]>) {
  const body: ApiErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  res.status(status).json(body);
}

const KIND_TO_HTTP: Record<DomainError["kind"], [number, ErrorCode]> = {
  validation: [400, "bad_request"],
  not_found: [404, "not_found"],
  unauthorized: [401, "unauthorized"],
  forbidden: [403, "forbidden"],
  unavailable: [503, "unavailable"],
};

/** Maps domain errors to the shared error shape; anything unexpected becomes a logged 500. */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err: unknown, req, res, _next) => {
    if (err instanceof DomainError) {
      const [status, code] = KIND_TO_HTTP[err.kind];
      if (status >= 500) logger.error({ err, cause: (err as { cause?: unknown }).cause, path: req.path }, err.message);
      const fields = "fields" in err ? (err.fields as Record<string, string[]> | undefined) : undefined;
      return sendError(res, status, code, err.message, fields);
    }
    const status = (err as { status?: number; type?: string }).status;
    if (status === 400 || status === 413) {
      return sendError(res, status, "bad_request", status === 413 ? "That request is too large." : "That request wasn’t valid JSON.");
    }
    logger.error({ err, path: req.path }, "unhandled error");
    sendError(res, 500, "internal", "Something went wrong on our side.");
  };
}

export const notFound: RequestHandler = (_req, res) => sendError(res, 404, "not_found", "No such endpoint.");

function bearer(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7).trim() || null : null;
}

/** Requires a valid Supabase session; puts the user on res.locals.user. */
export function requireUser(tokens: TokenVerifier): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = bearer(req);
    if (!token) return next(new UnauthorizedError());
    setUser(res, await tokens.verify(token));
    next();
  };
}

/** Attaches the user when a valid token is present; never blocks guests. */
export function optionalUser(tokens: TokenVerifier): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = bearer(req);
    if (token) {
      try {
        setUser(res, await tokens.verify(token));
      } catch {
        // Expired or invalid sessions fall back to guest.
      }
    }
    next();
  };
}

/** Per-IP limits for endpoints that send email or will one day charge money. */
export function limiter(windowMinutes: number, limit: number): RequestHandler {
  return rateLimit({
    windowMs: windowMinutes * 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => sendError(res, 429, "rate_limited", "Too many tries. Wait a few minutes and try again."),
  });
}

/** Lets CDNs and browsers cache public catalog reads briefly. */
export function publicCache(seconds: number): RequestHandler {
  return (_req, res, next) => {
    res.setHeader("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
    next();
  };
}

export function requestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const started = performance.now();
    res.on("finish", () => {
      logger.info(
        { method: req.method, path: req.path, status: res.statusCode, ms: Math.round(performance.now() - started) },
        "request",
      );
    });
    next();
  };
}

/**
 * Domain errors. The HTTP layer maps each kind to a status code; nothing in the domain or
 * application layers knows about HTTP.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: "validation" | "not_found" | "unauthorized" | "forbidden" | "unavailable";
}

export class ValidationError extends DomainError {
  readonly kind = "validation" as const;
  constructor(
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends DomainError {
  readonly kind = "not_found" as const;
  constructor(message = "We couldn’t find that.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends DomainError {
  readonly kind = "unauthorized" as const;
  constructor(message = "Sign in to continue.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  readonly kind = "forbidden" as const;
  constructor(message = "You can’t do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** A dependency (database, email, provider) is not configured or not reachable. */
export class UnavailableError extends DomainError {
  readonly kind = "unavailable" as const;
  constructor(message = "This isn’t available right now. Try again in a moment.") {
    super(message);
    this.name = "UnavailableError";
  }
}

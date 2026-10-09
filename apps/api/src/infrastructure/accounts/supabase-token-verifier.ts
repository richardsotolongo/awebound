import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import type { AuthenticatedUser, TokenVerifier } from "../../application/ports";
import { UnauthorizedError, UnavailableError } from "../../domain/errors";

/**
 * Verifies Supabase Auth access tokens locally, without a network round trip per request.
 * New projects sign with asymmetric keys published at /auth/v1/.well-known/jwks.json; projects on
 * the legacy shared secret pass SUPABASE_JWT_SECRET instead.
 */
export class SupabaseTokenVerifier implements TokenVerifier {
  private readonly issuer: string;
  private readonly key: JWTVerifyGetKey | Uint8Array;

  constructor(supabaseUrl: string, legacySecret?: string) {
    const base = supabaseUrl.replace(/\/$/, "");
    this.issuer = `${base}/auth/v1`;
    this.key = legacySecret
      ? new TextEncoder().encode(legacySecret)
      : createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`));
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    let payload: JWTPayload;
    try {
      const options = { issuer: this.issuer, audience: "authenticated" };
      ({ payload } =
        this.key instanceof Uint8Array
          ? await jwtVerify(token, this.key, options)
          : await jwtVerify(token, this.key, options));
    } catch {
      throw new UnauthorizedError("Your session has expired. Sign in again.");
    }
    if (!payload.sub) throw new UnauthorizedError();
    return { id: payload.sub, email: typeof payload.email === "string" ? payload.email : null };
  }
}

/** Used when Supabase isn't configured: accounts are simply not available yet. */
export class DisabledTokenVerifier implements TokenVerifier {
  async verify(): Promise<AuthenticatedUser> {
    throw new UnavailableError("Accounts aren’t set up yet.");
  }
}

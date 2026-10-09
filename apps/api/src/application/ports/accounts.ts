import type { Profile } from "@awebound/shared";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

/** Verifies a Supabase access token. */
export interface TokenVerifier {
  verify(token: string): Promise<AuthenticatedUser>;
}

export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>;
  /** Creates the row if the sign-up trigger hasn't yet. */
  upsert(user: AuthenticatedUser): Promise<Profile>;
  updateName(id: string, fullName: string): Promise<Profile>;
}

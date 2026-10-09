import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@awebound/shared";
import { z } from "zod";
import type { AuthenticatedUser, ProfileRepository } from "../../application/ports";
import { NotFoundError, UnavailableError } from "../../domain/errors";

const ProfileRow = z.object({
  id: z.string(),
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
});

const COLUMNS = "id, email, full_name, avatar_url, created_at";

function toProfile(row: z.infer<typeof ProfileRow>): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

/** Profiles through the secret-key client. Every query is scoped to the verified user's id. */
export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw Object.assign(new UnavailableError(), { cause: error });
    return data ? toProfile(ProfileRow.parse(data)) : null;
  }

  async upsert(user: AuthenticatedUser): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .upsert({ id: user.id, email: user.email }, { onConflict: "id", ignoreDuplicates: false })
      .select(COLUMNS)
      .single();
    if (error) throw Object.assign(new UnavailableError(), { cause: error });
    return toProfile(ProfileRow.parse(data));
  }

  async updateName(id: string, fullName: string): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw Object.assign(new UnavailableError(), { cause: error });
    if (!data) throw new NotFoundError("We couldn’t find your profile.");
    return toProfile(ProfileRow.parse(data));
  }
}

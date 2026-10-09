import type { Profile } from "@awebound/shared";
import type { AuthenticatedUser, ProfileRepository } from "../ports";

export class GetProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(user: AuthenticatedUser): Promise<Profile> {
    return (await this.profiles.findById(user.id)) ?? this.profiles.upsert(user);
  }
}

export class UpdateProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(user: AuthenticatedUser, fullName: string): Promise<Profile> {
    await this.profiles.upsert(user);
    return this.profiles.updateName(user.id, fullName);
  }
}

import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

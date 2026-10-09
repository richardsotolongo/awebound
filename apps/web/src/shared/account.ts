import { z } from "zod";

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

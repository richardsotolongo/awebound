/** Removes the admin role from the account with this sign-in email. Usage: pnpm --filter @awebound/web revoke:admin <email> */
import { requireEnv } from "./_env";

requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("SUPABASE_SECRET_KEY");
const email = process.argv[2];
if (!email) {
  console.error("Usage: revoke:admin <email>");
  process.exit(1);
}
const { findUserByEmail, revokeRole } = await import("../src/server/archive/roles");
const user = await findUserByEmail(email);
if (!user) {
  console.error("No account signs in with that address.");
  process.exit(1);
}
await revokeRole(user.id, "admin", null);
console.info(`admin revoked from ${user.id} (audited).`);

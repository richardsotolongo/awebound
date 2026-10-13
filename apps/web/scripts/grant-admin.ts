/** Grants the admin role to the account with this sign-in email. Usage: pnpm --filter @awebound/web grant:admin <email> */
import { requireEnv } from "./_env";

requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("SUPABASE_SECRET_KEY");
const email = process.argv[2];
if (!email) {
  console.error("Usage: grant:admin <email>");
  process.exit(1);
}
const { findUserByEmail, grantRole } = await import("../src/server/archive/roles");
const user = await findUserByEmail(email);
if (!user) {
  console.error("No account signs in with that address. The person must sign in once first.");
  process.exit(1);
}
await grantRole(user.id, "admin", null);
console.info(`admin granted to ${user.id} (audited).`);

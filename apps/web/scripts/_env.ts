/**
 * Shared by the command-line scripts: they run outside Next, so `server-only` must be inert
 * (`--conditions=react-server`) and the env comes from .env.local (`--env-file`). See package.json.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} is not set. Add it to apps/web/.env.local and run again.`);
    process.exit(1);
  }
  return value;
}

export function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

export const hasFlag = (flag: string) => process.argv.includes(flag);

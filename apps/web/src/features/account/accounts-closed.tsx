import { Button } from "@awebound/brand";
import type { Release } from "@/shared";

/**
 * What the account and sign-in pages say while accounts are switched off. It follows the
 * latest release's status, so it never promises ordering before ordering is open.
 */
export function accountsClosedCopy(release: Release | null) {
  const intro = !release
    ? "Ordering isn’t open yet. Leave your email and we’ll tell you when it is."
    : release.status === "open"
      ? "You don’t need an account to order. You can check out as a guest."
      : release.status === "partial"
        ? `Some ${release.name} pieces can be ordered now, and you can check out as a guest. The rest are still in preview.`
        : `Ordering for ${release.name} isn’t open yet. Until it is, you can look through the pieces, save the ones you like to your bag and get an email when ordering opens.`;
  return { title: "Accounts open soon", intro };
}

export function AccountsClosedActions({ release }: { release: Release | null }) {
  const status = release?.status ?? "preview";
  return (
    <div className="aw-btn-row">
      {release ? (
        <Button variant="secondary" href="/shop">
          {status === "preview" ? `Explore ${release.name}` : `Shop ${release.name}`}
        </Button>
      ) : null}
      {status === "open" ? null : (
        <Button variant={release ? "link" : "secondary"} href="/#updates">
          Get release updates
        </Button>
      )}
    </div>
  );
}

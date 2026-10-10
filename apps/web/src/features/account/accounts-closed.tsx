import { Button } from "@awebound/brand";
import type { Release } from "@/shared";

/**
 * What the account and sign-in pages say while accounts are switched off. It follows the
 * latest release's status, so it never promises ordering before ordering is open.
 */
export function accountsClosedCopy(release: Release | null) {
  const open = release?.status === "open";
  return {
    title: "Accounts open soon",
    intro: open
      ? "You don’t need an account to order. You can check out as a guest."
      : release
        ? `Ordering for ${release.name} isn’t open yet. Until it is, you can look through the pieces, save the ones you like to your bag and get an email when ordering opens.`
        : "Ordering isn’t open yet. Leave your email and we’ll tell you when it is.",
  };
}

export function AccountsClosedActions({ release }: { release: Release | null }) {
  const open = release?.status === "open";
  return (
    <div className="aw-btn-row">
      {release ? (
        <Button variant="secondary" href="/shop">
          {open ? `Shop ${release.name}` : `Explore ${release.name}`}
        </Button>
      ) : null}
      {open ? null : (
        <Button variant={release ? "link" : "secondary"} href="/#updates">
          Get Release Updates
        </Button>
      )}
    </div>
  );
}

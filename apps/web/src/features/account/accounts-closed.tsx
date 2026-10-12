import { Button } from "@awebound/brand";
import type { Release } from "@/shared";

/** What the account and sign-in pages say while accounts are switched off. */
export function accountsClosedCopy() {
  return {
    title: "Accounts open soon",
    intro: "You don’t need an account to order. You can check out as a guest.",
  };
}

export function AccountsClosedActions({ release }: { release: Release | null }) {
  return (
    <div className="aw-btn-row">
      <Button variant="secondary" href="/shop">
        {release ? `Shop ${release.name}` : "Visit the shop"}
      </Button>
    </div>
  );
}

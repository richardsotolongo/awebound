import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { AccountsClosedActions, accountsClosedCopy } from "@/features/account/accounts-closed";
import { ArchiveNav } from "@/features/archive/archive-nav";
import { accountsEnabled } from "@/lib/env";
import { getLatestRelease, withFallback } from "@/server/catalog";
import { currentUser, hasRole } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

/** My Archive: every account route shares the guard (the proxy is the first) and the navigation. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  if (!accountsEnabled) {
    const release = await withFallback(getLatestRelease, null);
    const copy = accountsClosedCopy();
    return (
      <div className="aw-container" style={{ paddingBottom: "var(--space-24)" }}>
        <PageHeader title={copy.title} intro={copy.intro} />
        <AccountsClosedActions release={release} />
      </div>
    );
  }
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount");
  const admin = await hasRole(user, "admin");
  return (
    <div className="aw-container account">
      <ArchiveNav admin={admin} email={user.email ?? null} />
      {children}
    </div>
  );
}

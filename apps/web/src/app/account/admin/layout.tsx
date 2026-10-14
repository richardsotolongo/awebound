import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminNav } from "@/features/archive/admin/admin-nav";
import { currentUser, hasRole } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

/** The owner’s pages: the admin role or nothing. Every action checks the role again. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user || !(await hasRole(user, "admin"))) notFound();
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}

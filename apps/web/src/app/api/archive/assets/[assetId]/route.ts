import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { signedAssetUrl } from "@/server/archive/assets";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { currentUser } from "@/server/session";

export const dynamic = "force-dynamic";

const PRIVATE = { "cache-control": "private, no-store" };

/** A wallpaper download: the account must own the design, the file must be published. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401, headers: PRIVATE });
  const { assetId } = await params;
  if (!z.uuid().safeParse(assetId).success || !(await getArchiveReadiness()).wallpapers)
    return NextResponse.json({ error: "not found" }, { status: 404, headers: PRIVATE });
  const url = await signedAssetUrl(assetId, user.id);
  if (!url) return NextResponse.json({ error: "not found" }, { status: 404, headers: PRIVATE });
  return NextResponse.redirect(url, { status: 302, headers: PRIVATE });
}

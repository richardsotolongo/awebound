import { NextResponse, type NextRequest } from "next/server";
import { getFoundingForUser } from "@/server/archive/founding";
import {
  renderFoundingWallpaper,
  type FoundingDevice,
  type FoundingTheme,
} from "@/server/archive/founding-wallpaper";
import { UserError } from "@/server/errors";
import { limit } from "@/server/limit";
import { currentUser, hasRole } from "@/server/session";

export const dynamic = "force-dynamic";

const PRIVATE = { "cache-control": "private, no-store" };

/**
 * A Founding Member's own numbered wallpaper, or an honorary member's
 * (?theme=bone|coal&device=phone|desktop). The owner gets a sample: place 12, or Honorary with
 * &honorary=1.
 */
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401, headers: PRIVATE });
  const q = request.nextUrl.searchParams;
  const theme: FoundingTheme = q.get("theme") === "coal" ? "coal" : "bone";
  const device: FoundingDevice = q.get("device") === "desktop" ? "desktop" : "phone";
  const founding = await getFoundingForUser(user.id).catch(() => null);
  let rank: number | null;
  if (founding) rank = founding.rank;
  else if (await hasRole(user, "admin")) rank = q.get("honorary") === "1" ? null : 12;
  else return NextResponse.json({ error: "not found" }, { status: 404, headers: PRIVATE });
  try {
    await limit("founding-wallpaper", 20, 10, user.id);
    const bytes = await renderFoundingWallpaper(rank, theme, device);
    const kind = rank === null ? "honorary" : "founding";
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        ...PRIVATE,
        "content-type": "image/png",
        "content-disposition": `attachment; filename="awebound-${kind}-member-${theme}-${device}.png"`,
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof UserError)
      return NextResponse.json({ error: err.message }, { status: 429, headers: PRIVATE });
    console.error("[founding] wallpaper failed:", err);
    return NextResponse.json({ error: "render failed" }, { status: 500, headers: PRIVATE });
  }
}

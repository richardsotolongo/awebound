import { NextResponse, type NextRequest } from "next/server";
import { ProductSlugSchema } from "@/shared";
import { getOwnedCard } from "@/server/archive/content";
import { designCardPdf } from "@/server/archive/exports";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { UserError } from "@/server/errors";
import { limit } from "@/server/limit";
import { currentUser } from "@/server/session";

export const dynamic = "force-dynamic";

const PRIVATE = { "cache-control": "private, no-store" };

/** The owned design card as a PDF, for the account that owns the design. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401, headers: PRIVATE });
  const { slug } = await params;
  if (!ProductSlugSchema.safeParse(slug).success || !(await getArchiveReadiness()).pdf)
    return NextResponse.json({ error: "not found" }, { status: 404, headers: PRIVATE });
  if (!(await getOwnedCard(user.id, slug))) return NextResponse.json({ error: "not found" }, { status: 404, headers: PRIVATE });
  try {
    await limit("pdf", 20, 10, user.id);
    const bytes = await designCardPdf(slug);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        ...PRIVATE,
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="behold-${slug}-design-card.pdf"`,
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 429, headers: PRIVATE });
    console.error("[archive] pdf failed:", err);
    return NextResponse.json({ error: "render failed" }, { status: 500, headers: PRIVATE });
  }
}

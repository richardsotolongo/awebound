import { NextResponse, type NextRequest } from "next/server";
import { sendCartReminders, sendGuestFollowUps } from "@/server/archive/follow-ups";
import { cronDenied } from "@/server/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The daily follow-up emails (vercel.json crons, after the reconcile): the guest buyers' invitation
 * into My Archive and the cart reminders. Each runs on its own, so one failing doesn't stop the other.
 */
export async function GET(request: NextRequest) {
  const denied = cronDenied(request);
  if (denied) return denied;
  const [guestFollowUps, cartReminders] = await Promise.all(
    [sendGuestFollowUps, sendCartReminders].map((job) =>
      job().catch((err: unknown) => {
        console.error(err);
        return null;
      }),
    ),
  );
  return NextResponse.json(
    { guestFollowUps, cartReminders },
    {
      headers: { "cache-control": "no-store" },
      status: guestFollowUps === null || cartReminders === null ? 500 : 200,
    },
  );
}

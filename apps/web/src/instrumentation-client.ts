import posthog from "posthog-js";
import { publicEnv } from "@/lib/env";

const token = publicEnv.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
// Do Not Track or Global Privacy Control keep PostHog from starting at all: no cookie, no requests.
const optedOut =
  navigator.doNotTrack === "1" ||
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

if (token && !optedOut) {
  posthog.init(token, {
    api_host: publicEnv.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-08-30",
    capture_exceptions: true,
    // Off until it has had a legal review, even if the project setting is switched on.
    disable_session_recording: true,
  });
}

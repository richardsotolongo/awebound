"use server";

import {
  ClaimStartRequestSchema,
  ClaimVerifyRequestSchema,
  ConsentRequestSchema,
  FitGuideRequestSchema,
  FitPreferenceRequestSchema,
  SavePieceRequestSchema,
  type ClaimStartRequest,
  type ClaimVerifyRequest,
  type ConsentRequest,
  type FitPreference,
  type FitPreferenceRequest,
  type SavePieceRequest,
} from "@/shared";
import { startClaim, verifyClaim } from "./archive/claims";
import { setConsent } from "./archive/consents";
import { clearFitPreference, saveFitPreference } from "./archive/fit";
import { getArchiveReadiness } from "./archive/readiness";
import { reconcileOrders } from "./archive/reconcile";
import { savePiece, savedSlugs, unsavePiece } from "./archive/saved";
import { parse, run, UserError, type Result } from "./errors";
import { limit } from "./limit";
import { requireUser } from "./session";

// My Archive's Server Actions: public endpoints, so every input is parsed and the user comes from the session.

export async function savePieceAction(input: SavePieceRequest): Promise<Result<{ saved: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const { slug } = parse(SavePieceRequestSchema, input);
    await limit("save", 60, 10, user.id);
    await savePiece(user.id, slug);
    return { saved: true };
  });
}

export async function unsavePieceAction(input: SavePieceRequest): Promise<Result<{ saved: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const { slug } = parse(SavePieceRequestSchema, input);
    await limit("save", 60, 10, user.id);
    await unsavePiece(user.id, slug);
    return { saved: false };
  });
}

/** The product page asks after mount whether this piece is saved (pages are cached per piece, not per shopper). */
export async function getSavedSlugsAction(): Promise<Result<string[]>> {
  return run(async () => savedSlugs((await requireUser()).id));
}

export async function saveFitPreferenceAction(input: FitPreferenceRequest): Promise<Result<FitPreference>> {
  return run(async () => {
    const user = await requireUser();
    const { guideId, size, note } = parse(FitPreferenceRequestSchema, input);
    return saveFitPreference(user.id, guideId, size, note);
  });
}

export async function clearFitPreferenceAction(input: { guideId: string }): Promise<Result<null>> {
  return run(async () => {
    const user = await requireUser();
    const { guideId } = parse(FitGuideRequestSchema, input);
    await clearFitPreference(user.id, guideId);
    return null;
  });
}

export async function startOrderClaim(input: ClaimStartRequest): Promise<Result<{ claimId: string }>> {
  return run(async () => {
    const user = await requireUser();
    const { friendlyId } = parse(ClaimStartRequestSchema, input);
    if (!(await getArchiveReadiness()).claims)
      throw new UserError("Linking past orders isn’t available yet. Write to us with your order number and we’ll help.");
    await limit("claim-start", 5, 60, user.id);
    return startClaim(user, friendlyId);
  });
}

export async function verifyOrderClaim(input: ClaimVerifyRequest): Promise<Result<{ friendlyId: string }>> {
  return run(async () => {
    const user = await requireUser();
    const { claimId, code } = parse(ClaimVerifyRequestSchema, input);
    await limit("claim-verify", 10, 15, user.id);
    return verifyClaim(user, claimId, code);
  });
}

/** Re-reads the shopper's own pending orders from our checkout partner. */
export async function refreshMyOrders(): Promise<Result<{ checked: number; changed: number }>> {
  return run(async () => {
    const user = await requireUser();
    await limit("refresh", 3, 10, user.id);
    const report = await reconcileOrders({ trigger: "user", userId: user.id });
    return { checked: report.checked, changed: report.changed };
  });
}

export async function setEmailConsent(input: ConsentRequest): Promise<Result<{ consented: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const { topic, consented } = parse(ConsentRequestSchema, input);
    if (!(await getArchiveReadiness()).emails.preferencesUi)
      throw new UserError("Email preferences aren’t available yet.");
    const row = await setConsent(user.id, topic, consented, "settings");
    return { consented: row.consented };
  });
}

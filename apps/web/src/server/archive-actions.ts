"use server";

import {
  ClaimStartRequestSchema,
  ClaimVerifyRequestSchema,
  ConsentRequestSchema,
  DesignAccessRequestSchema,
  GuestOrderRequestSchema,
  IdeaSubmitRequestSchema,
  IdeaUploadRequestSchema,
  SavePieceRequestSchema,
  type ClaimStartRequest,
  type ClaimVerifyRequest,
  type ConsentRequest,
  type DesignAccessRequest,
  type GuestOrderRequest,
  type IdeaSubmitRequest,
  type IdeaUploadRequest,
  type SavePieceRequest,
} from "@/shared";
import { startClaim, verifyClaim } from "./archive/claims";
import { setConsent } from "./archive/consents";
import { getDesignBySlug } from "./archive/designs";
import { getEntitlement } from "./archive/entitlements";
import { getFoundingForUser } from "./archive/founding";
import { guestOrderStatus } from "./archive/guest-orders";
import { getArchiveOffer } from "./archive/offer";
import { createIdeaUploadTarget, submitIdea } from "./archive/ideas";
import { getArchiveReadiness } from "./archive/readiness";
import { pullMyMissingOrders, reconcileOrders } from "./archive/reconcile";
import { savePiece, savedSlugs, unsavePiece } from "./archive/saved";
import { parse, run, UserError, type Result } from "./errors";
import { limit } from "./limit";
import { requireUser } from "./session";

// My Archive's Server Actions: public endpoints, so every input is parsed and the user comes from the session.

export async function savePieceAction(
  input: SavePieceRequest,
): Promise<Result<{ saved: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const { slug } = parse(SavePieceRequestSchema, input);
    await limit("save", 60, 10, user.id);
    await savePiece(user.id, slug);
    return { saved: true };
  });
}

export async function unsavePieceAction(
  input: SavePieceRequest,
): Promise<Result<{ saved: boolean }>> {
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

/**
 * The product page asks after mount whether the shopper owns this design, so its note can link to
 * the card. Only a yes or no leaves the server; the design must be published.
 */
export async function designAccessAction(
  input: DesignAccessRequest,
): Promise<Result<{ owned: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const { slug } = parse(DesignAccessRequestSchema, input);
    const design = await getDesignBySlug(slug);
    if (!design?.published_content_id) return { owned: false };
    return { owned: Boolean(await getEntitlement(user.id, design.design_key)) };
  });
}

/**
 * The band under the header asks, for the carts this browser checked out as a guest, whether an
 * order arrived that an account would open. The cart ids are the only key; nothing about the order
 * leaves the server but the pieces' names.
 */
export async function guestOrderAction(
  input: GuestOrderRequest,
): Promise<Result<{ names: string[]; paid: string[]; waiting: string[] }>> {
  return run(async () => {
    const { cartIds } = parse(GuestOrderRequestSchema, input);
    await limit("guest-orders", 30, 10);
    return guestOrderStatus(cartIds);
  });
}

export async function startOrderClaim(
  input: ClaimStartRequest,
): Promise<Result<{ claimId: string }>> {
  return run(async () => {
    const user = await requireUser();
    const { friendlyId } = parse(ClaimStartRequestSchema, input);
    if (!(await getArchiveReadiness()).claims)
      throw new UserError(
        "Linking past orders isn’t available yet. Write to us with your order number and we’ll help.",
      );
    await limit("claim-start", 5, 60, user.id);
    return startClaim(user, friendlyId);
  });
}

export async function verifyOrderClaim(
  input: ClaimVerifyRequest,
): Promise<Result<{ friendlyId: string }>> {
  return run(async () => {
    const user = await requireUser();
    const { claimId, code } = parse(ClaimVerifyRequestSchema, input);
    await limit("claim-verify", 10, 15, user.id);
    return verifyClaim(user, claimId, code);
  });
}

/** Re-reads the shopper's own pending orders from our checkout partner and brings in missing ones. */
export async function refreshMyOrders(): Promise<Result<{ checked: number; changed: number }>> {
  return run(async () => {
    const user = await requireUser();
    await limit("refresh", 3, 10, user.id);
    const report = await reconcileOrders({ trigger: "user", userId: user.id });
    const pulled = await pullMyMissingOrders(user);
    return { checked: report.checked, changed: report.changed + pulled };
  });
}

export async function setEmailConsent(
  input: ConsentRequest,
): Promise<Result<{ consented: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const { topic, consented } = parse(ConsentRequestSchema, input);
    const { emails } = await getArchiveReadiness();
    if (!(topic === "cart_reminders" ? emails.cartReminder : emails.preferencesUi))
      throw new UserError("Email preferences aren’t available yet.");
    const row = await setConsent(user.id, topic, consented, "settings");
    return { consented: row.consented };
  });
}

/** A one-time upload target for an Idea Submission's image, once the account has a submission open. */
export async function startIdeaUploadAction(
  input: IdeaUploadRequest,
): Promise<Result<{ bucket: string; path: string; token: string }>> {
  return run(async () => {
    const user = await requireUser();
    const { fileName } = parse(IdeaUploadRequestSchema, input);
    await limit("idea-upload", 10, 30, user.id);
    return createIdeaUploadTarget(user, fileName);
  });
}

/** Sends an Idea Submission. The purchase count and the submissions left are checked again here. */
export async function submitIdeaAction(input: IdeaSubmitRequest): Promise<Result<{ id: string }>> {
  return run(async () => {
    const user = await requireUser();
    const { idea, verse, context, imagePath, website } = parse(IdeaSubmitRequestSchema, input);
    if (website) throw new UserError("That didn’t go through.");
    await limit("idea-submit", 3, 30, user.id);
    return submitIdea(user, { idea, verse, context, imagePath });
  });
}

/** Whether the signed-in account holds the Founding Member seal (the header marks My Archive). */
export async function getFoundingMarkAction(): Promise<Result<boolean>> {
  return run(async () => {
    const user = await requireUser();
    return Boolean(await getFoundingForUser(user.id).catch(() => null));
  });
}

/**
 * Whether to invite a signed-out shopper to sign in before checkout: only while Founding Member
 * places remain (orders reach accounts and fewer than 50 are taken). Public booleans only.
 */
export async function getCheckoutInviteAction(): Promise<Result<{ show: boolean }>> {
  return run(async () => ({ show: (await getArchiveOffer()).foundingOpen }));
}

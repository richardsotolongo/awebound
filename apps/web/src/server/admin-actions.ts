"use server";

import {
  ApproveRequestSchema,
  AssetAssignRequestSchema,
  AssetIdRequestSchema,
  AssetRegisterRequestSchema,
  AssetUploadRequestSchema,
  DesignKeyRequestSchema,
  FlagRequestSchema,
  FoundingCorrectionRequestSchema,
  FoundingNoteRequestSchema,
  HonoraryRequestSchema,
  IdeaReviewRequestSchema,
  MapOfferRequestSchema,
  OrderAdjustRequestSchema,
  OrderIdRequestSchema,
  OrderRelinkRequestSchema,
  PublishRequestSchema,
  SaveDraftRequestSchema,
} from "@/shared";
import {
  assignAsset,
  createUploadTarget,
  publishAsset,
  registerAsset,
  retireAsset,
} from "./archive/assets";
import { approveDraft, publishContent, retireContent, saveDraft } from "./archive/content";
import { mapOffer } from "./archive/designs";
import { applySuggestions } from "./archive/suggestions";
import { importDrafts, type ImportReport } from "./archive/drafts";
import { sendQueued } from "./archive/email-outbox";
import { setFlag } from "./archive/flags";
import {
  foundingCorrection,
  sendFoundingNote,
  setHonorary,
  settleFounding,
} from "./archive/founding";
import { reviewIdea } from "./archive/ideas";
import { adjustOrderLines, markOrderReviewed, relinkOrder } from "./archive/orders";
import { reconcileOrders, type ReconcileReport } from "./archive/reconcile";
import { parse, run, type Result } from "./errors";
import { refreshPublicPages } from "./refresh";
import { requireAdmin } from "./session";

// Owner actions for My Archive. Each one checks the admin role from the session and is audited by the module it calls.

export async function importDraftsAction(): Promise<Result<ImportReport>> {
  return run(async () => importDrafts((await requireAdmin()).id));
}

export async function saveDraftAction(
  input: unknown,
): Promise<Result<{ version: number; status: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { designKey, fields } = parse(SaveDraftRequestSchema, input);
    const row = await saveDraft(designKey, fields, actor);
    return { version: row.version, status: row.status };
  });
}

export async function approveDraftAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { designKey } = parse(ApproveRequestSchema, input);
    await approveDraft(designKey, actor);
    return null;
  });
}

export async function publishContentAction(
  input: unknown,
): Promise<Result<{ published: string[] }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { designKeys } = parse(PublishRequestSchema, input);
    const published = await publishContent(designKeys, actor);
    refreshPublicPages();
    return { published };
  });
}

/** Saves, approves and publishes the suggested wording for every design that has some. */
export async function applySuggestionsAction(): Promise<Result<{ published: string[] }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const published = await applySuggestions(actor);
    if (published.length > 0) refreshPublicPages();
    return { published };
  });
}

export async function retireContentAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { designKey } = parse(DesignKeyRequestSchema, input);
    await retireContent(designKey, actor);
    refreshPublicPages();
    return null;
  });
}

export async function createAssetUploadAction(
  input: unknown,
): Promise<Result<{ bucket: string; path: string; token: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { designKey, format, fileName } = parse(AssetUploadRequestSchema, input);
    return createUploadTarget(designKey, format, fileName, actor);
  });
}

export async function registerAssetAction(
  input: unknown,
): Promise<Result<{ id: string; width: number; height: number; mime: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { designKey, format, path, title } = parse(AssetRegisterRequestSchema, input);
    const row = await registerAsset({ designKey, format, path, title, actor });
    return { id: row.id, width: row.width, height: row.height, mime: row.mime };
  });
}

export async function assignAssetAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { assetId, designKey } = parse(AssetAssignRequestSchema, input);
    await assignAsset(assetId, designKey, actor);
    return null;
  });
}

export async function publishAssetAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { assetId } = parse(AssetIdRequestSchema, input);
    await publishAsset(assetId, actor);
    return null;
  });
}

export async function retireAssetAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { assetId } = parse(AssetIdRequestSchema, input);
    await retireAsset(assetId, actor);
    return null;
  });
}

export async function setFlagAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { key, enabled, note } = parse(FlagRequestSchema, input);
    await setFlag(key, enabled, note, actor);
    return null;
  });
}

export async function reconcileNowAction(): Promise<Result<ReconcileReport>> {
  return run(async () => {
    await requireAdmin();
    return reconcileOrders({ trigger: "owner" });
  });
}

export async function settleFoundingAction(): Promise<
  Result<{ settled: number; skipped: string | null }>
> {
  return run(async () => settleFounding("owner", (await requireAdmin()).id));
}

export async function relinkOrderAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { orderId, userId, reason } = parse(OrderRelinkRequestSchema, input);
    await relinkOrder(orderId, userId, reason, actor);
    return null;
  });
}

export async function adjustOrderLinesAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { orderId, lines, reason } = parse(OrderAdjustRequestSchema, input);
    await adjustOrderLines(orderId, lines, reason, actor);
    return null;
  });
}

export async function markOrderReviewedAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { orderId } = parse(OrderIdRequestSchema, input);
    await markOrderReviewed(orderId, actor);
    return null;
  });
}

export async function mapOfferAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { designKey, offerId } = parse(MapOfferRequestSchema, input);
    await mapOffer(designKey, offerId, actor);
    // The catalog matches Fourthwall by the offer id first.
    refreshPublicPages();
    return null;
  });
}

export async function foundingCorrectionAction(
  input: unknown,
): Promise<Result<{ reason: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { userId, action, reason, orderId } = parse(FoundingCorrectionRequestSchema, input);
    const result = await foundingCorrection(userId, action, reason, actor, orderId);
    return { reason: result.reason };
  });
}

export async function sendQueuedEmailsAction(): Promise<Result<{ sent: number }>> {
  return run(async () => {
    await requireAdmin();
    return { sent: await sendQueued() };
  });
}

/** Sets an idea submission's status and the owner's private note. */
export async function reviewIdeaAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { id, status, note } = parse(IdeaReviewRequestSchema, input);
    await reviewIdea(id, status, note, actor);
    return null;
  });
}

/** Richard's note to Founding Members before a release (or a test to the owner first). */
export async function sendFoundingNoteAction(input: unknown): Promise<Result<{ queued: number }>> {
  return run(async () => {
    const owner = await requireAdmin();
    const note = parse(FoundingNoteRequestSchema, input);
    return sendFoundingNote(note, { id: owner.id, email: owner.email ?? null });
  });
}

/** Grants or removes an honorary Founding seal by the account's email. */
export async function setHonoraryAction(input: unknown): Promise<Result<{ email: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { email, action, reason } = parse(HonoraryRequestSchema, input);
    return setHonorary(email, action, reason, actor);
  });
}

"use server";

import {
  CollectionRequestSchema,
  EditPieceRequestSchema,
  ImageRegisterRequestSchema,
  ImageUploadRequestSchema,
  ImportCreateRequestSchema,
  ImportRequestSchema,
  PieceRequestSchema,
  PublishPieceRequestSchema,
  ReorderPiecesRequestSchema,
  SaveCollectionRequestSchema,
  SaveSizeGuideRequestSchema,
  type ZipReport,
} from "@/shared/pieces";
import {
  publishCollection,
  reorderPieces,
  saveCollection,
  unpublishCollection,
} from "./catalog-admin/collections";
import {
  deletePieceDraft,
  editPiece,
  publishPiece,
  replaceImage,
  saveSizeGuide,
  unpublishPiece,
} from "./catalog-admin/pieces";
import { createImageUpload } from "./catalog-admin/storage";
import { checkImport, commitImport, createImport } from "./catalog-admin/zip";
import { parse, run, type Result } from "./errors";
import { refreshPublicPages } from "./refresh";
import { requireAdmin } from "./session";

// Owner actions for the catalog: collections, piece zips, the review page. Each one checks the
// admin role from the session and is audited by the module it calls; whatever shoppers can see
// refreshes the public pages at once.

const refreshIf = (live: boolean) => {
  if (live) refreshPublicPages();
  return null;
};

export async function saveCollectionAction(input: unknown): Promise<Result<{ slug: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { slug, fields } = parse(SaveCollectionRequestSchema, input);
    const row = await saveCollection(slug, fields, actor);
    refreshIf(row.status === "published");
    return { slug: row.slug };
  });
}

export async function publishCollectionAction(input: unknown): Promise<Result<{ pieces: number }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { slug } = parse(CollectionRequestSchema, input);
    const pieces = await publishCollection(slug, actor);
    refreshPublicPages();
    return { pieces: pieces.length };
  });
}

export async function unpublishCollectionAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { slug } = parse(CollectionRequestSchema, input);
    await unpublishCollection(slug, actor);
    refreshPublicPages();
    return null;
  });
}

export async function reorderPiecesAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { collection, pieces } = parse(ReorderPiecesRequestSchema, input);
    return refreshIf(await reorderPieces(collection, pieces, actor));
  });
}

export async function createImportAction(
  input: unknown,
): Promise<Result<{ importId: string; bucket: string; path: string; token: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { fileName } = parse(ImportCreateRequestSchema, input);
    return createImport(fileName, actor);
  });
}

export async function checkImportAction(input: unknown): Promise<Result<ZipReport>> {
  return run(async () => {
    await requireAdmin();
    const { importId, collection } = parse(ImportRequestSchema, input);
    return checkImport(importId, collection);
  });
}

export async function commitImportAction(input: unknown): Promise<Result<{ slug: string }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { importId, collection } = parse(ImportRequestSchema, input);
    return { slug: await commitImport(importId, collection, actor) };
  });
}

export async function editPieceAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { slug, patch } = parse(EditPieceRequestSchema, input);
    return refreshIf(await editPiece(slug, patch, actor));
  });
}

export async function saveSizeGuideAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { id, fields } = parse(SaveSizeGuideRequestSchema, input);
    return refreshIf(await saveSizeGuide(id, fields, actor));
  });
}

export async function createImageUploadAction(
  input: unknown,
): Promise<Result<{ bucket: string; path: string; token: string }>> {
  return run(async () => {
    await requireAdmin();
    const { fileName } = parse(ImageUploadRequestSchema, input);
    return createImageUpload(fileName);
  });
}

export async function replaceImageAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { target, path } = parse(ImageRegisterRequestSchema, input);
    return refreshIf(await replaceImage(target, path, actor));
  });
}

export async function publishPieceAction(input: unknown): Promise<Result<{ live: boolean }>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { slug, archive, wallpapers } = parse(PublishPieceRequestSchema, input);
    const live = await publishPiece(slug, { archive, wallpapers }, actor);
    refreshIf(live);
    return { live };
  });
}

export async function unpublishPieceAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { slug } = parse(PieceRequestSchema, input);
    return refreshIf(await unpublishPiece(slug, actor));
  });
}

export async function deletePieceDraftAction(input: unknown): Promise<Result<null>> {
  return run(async () => {
    const actor = (await requireAdmin()).id;
    const { slug } = parse(PieceRequestSchema, input);
    await deletePieceDraft(slug, actor);
    return null;
  });
}

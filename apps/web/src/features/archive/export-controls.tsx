"use client";

import { Button } from "@awebound/brand";
import { useId, useState } from "react";

/**
 * Share the Story: the public link anyone can open, and for the owner the design card PDF and
 * the story images, made on request and downloaded as real files. Nothing is ever posted for them.
 */
export function ExportControls({
  slug,
  name,
  shareCopy,
  exports,
  siteUrl,
}: {
  slug: string;
  name: string;
  shareCopy: string;
  exports: { pdf: boolean; share: boolean };
  siteUrl: string;
}) {
  const id = useId();
  const link = `${siteUrl}/shop/${slug}#story`;
  const [images, setImages] = useState<{ portrait: string; square: string } | null>(null);
  const [state, setState] = useState<"idle" | "making" | "error">("idle");
  const [copied, setCopied] = useState<"idle" | "copied" | "manual">("idle");
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function make() {
    setState("making");
    try {
      const urls: string[] = [];
      for (const format of ["portrait", "square"] as const) {
        const res = await fetch(`/api/archive/designs/${slug}/share.png?format=${format}`, {
          credentials: "same-origin",
        });
        if (!res.ok || !res.headers.get("content-type")?.startsWith("image/png"))
          throw new Error("render failed");
        urls.push(URL.createObjectURL(await res.blob()));
      }
      setImages({ portrait: urls[0]!, square: urls[1]! });
      setState("idle");
    } catch {
      setState("error");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("copied");
    } catch {
      setCopied("manual");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: name, text: shareCopy, url: link });
    } catch {
      // Dismissed, or not permitted: the copy button stays.
    }
  }

  return (
    <div className="archive-exports">
      <p className="aw-body">
        Share the story: anyone can read the public preview at the link. The images are yours to
        post.
      </p>
      <div className="account-actions">
        {exports.pdf ? (
          <a
            href={`/api/archive/designs/${slug}/card.pdf`}
            download
            className="aw-btn aw-btn-primary"
          >
            Download design card (PDF)
          </a>
        ) : null}
        {exports.share && !images ? (
          <Button variant="secondary" onClick={make} disabled={state === "making"}>
            {state === "making" ? "Preparing your image…" : "Create story image"}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={copy}>
          Copy link
        </Button>
        {canShare ? (
          <Button variant="secondary" onClick={share}>
            Share
          </Button>
        ) : null}
      </div>
      <p className="field-help" role="status" aria-live="polite">
        {copied === "copied" ? "Link copied." : state === "making" ? "Preparing your image…" : ""}
      </p>
      {copied === "manual" ? (
        <div className="field">
          <label htmlFor={`${id}-link`} className="aw-label">
            Link
          </label>
          <input
            id={`${id}-link`}
            className="aw-input"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      ) : null}
      {state === "error" ? (
        <p className="aw-form-error" role="alert">
          We couldn’t make the image. Try again in a moment.
        </p>
      ) : null}
      {images ? (
        <div className="archive-export-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- a blob the shopper just made */}
          <img src={images.portrait} alt={`${name} story image, portrait`} />
          <div
            className="account-actions"
            style={{ flexDirection: "column", alignItems: "flex-start" }}
          >
            <a
              href={images.portrait}
              download={`behold-${slug}-story-portrait.png`}
              className="aw-btn aw-btn-secondary"
            >
              Download for stories (1080 x 1920)
            </a>
            <a
              href={images.square}
              download={`behold-${slug}-story-square.png`}
              className="aw-btn aw-btn-secondary"
            >
              Download square (1080 x 1080)
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

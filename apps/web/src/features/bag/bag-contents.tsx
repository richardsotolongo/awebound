"use client";

import { Button } from "@awebound/brand";
import { formatPrice, type BagIssue } from "@/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { accountsEnabled } from "@/lib/env";
import { useSignedIn } from "@/lib/supabase/browser";
import { startCheckout, validateBag } from "@/server/actions";
import { NotifyForm } from "./notify-form";
import { bagSubtotal, orderable, saved, toLineInput, useBag } from "./bag-store";

/** Re-prices the bag on the server whenever it is shown. */
export function useBagValidation(active: boolean) {
  const lines = useBag((s) => s.lines);
  const reconcile = useBag((s) => s.reconcile);
  const [checked, setChecked] = useState<{ key: string; issues: BagIssue[] }>({
    key: "",
    issues: [],
  });
  const key = lines.map((l) => `${l.sku}:${l.quantity}`).join("|");

  // Forget past notices when the bag is closed, so reopening it starts clean.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setChecked({ key: "", issues: [] });
  }

  useEffect(() => {
    if (!active || lines.length === 0) return;
    let cancelled = false;
    validateBag({ lines: lines.map(toLineInput) })
      .then((result) => {
        // On failure keep the local copy; checkout re-validates anyway.
        if (cancelled || !result.ok) return;
        const bag = result.data;
        // A removal changes the bag, which checks it again; that second check has nothing left
        // to report, so removals already said are kept while the bag stays open.
        setChecked((prev) => ({
          key: bag.lines.map((l) => `${l.sku}:${l.quantity}`).join("|"),
          issues: [
            ...prev.issues.filter(
              (i) => i.kind === "not_found" && !bag.issues.some((b) => b.sku === i.sku),
            ),
            ...bag.issues,
          ],
        }));
        // A new SKU or preview flag means the piece went on sale (or back) since it was saved.
        const changed =
          bag.lines.length !== lines.length ||
          bag.lines.some(
            (l, i) =>
              l.sku !== lines[i]?.sku ||
              l.quantity !== lines[i]?.quantity ||
              l.unitPriceCents !== lines[i]?.snapshot.unitPriceCents ||
              l.available !== lines[i]?.snapshot.available ||
              l.preview !== lines[i]?.snapshot.preview,
          );
        if (changed) reconcile(bag);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when contents change, not on every render
  }, [active, key]);

  // Issues apply only to the bag they were computed for (removed lines drop their messages).
  return active
    ? checked.issues.filter((i) => i.kind === "not_found" || lines.some((l) => l.sku === i.sku))
    : [];
}

export function BagLines({ onNavigate }: { onNavigate?: () => void }) {
  const lines = useBag((s) => s.lines);
  const setQuantity = useBag((s) => s.setQuantity);
  const remove = useBag((s) => s.remove);
  // Beside pieces that can be ordered, a saved preview says why it isn't part of checkout.
  const mixed = orderable(lines).length > 0 && saved(lines).length > 0;

  return (
    <ul className="bag-lines">
      {lines.map(({ sku, quantity, snapshot }) => (
        <li key={sku} className="bag-line" data-available={snapshot.available}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnails from the catalog */}
          <img src={snapshot.image.url} alt="" />
          <div>
            <p className="bag-line-name">
              <Link href={`/shop/${snapshot.productSlug}`} onClick={onNavigate}>
                {snapshot.name}
              </Link>
            </p>
            <p className="aw-small">
              {snapshot.cut} · {snapshot.color} ·{" "}
              {snapshot.size === "One size" ? "One size" : `Size ${snapshot.size}`}
            </p>
            {mixed && snapshot.preview ? (
              <p className="aw-small">Not open for ordering yet. Saved for later.</p>
            ) : null}
            {snapshot.available ? (
              <div className="qty" role="group" aria-label={`Quantity of ${snapshot.name}`}>
                <button
                  type="button"
                  onClick={() => setQuantity(sku, quantity - 1)}
                  aria-label="One fewer"
                >
                  −
                </button>
                <output aria-live="polite">{quantity}</output>
                <button
                  type="button"
                  onClick={() => setQuantity(sku, quantity + 1)}
                  disabled={quantity >= 10}
                  aria-label="One more"
                >
                  +
                </button>
              </div>
            ) : (
              <p className="aw-form-error">Sold out in this size</p>
            )}
            <div>
              <button type="button" className="bag-remove" onClick={() => remove(sku)}>
                Remove
              </button>
            </div>
          </div>
          <span className="aw-meta">{formatPrice(snapshot.unitPriceCents * quantity)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Subtotal and the button that hands the bag to Fourthwall's hosted checkout. Pieces that can
 * be ordered go to checkout; saved previews stay in the bag. A bag of previews only gets the
 * "ordering isn't open yet" notice instead of the button.
 */
export function BagCheckout({ onNavigate }: { onNavigate?: () => void }) {
  const lines = useBag((s) => s.lines);
  const signedIn = useSignedIn();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const subtotal = bagSubtotal(lines);
  const open = orderable(lines);
  const previews = saved(lines);
  const preview = open.length === 0 ? previews[0] : undefined;

  async function checkout() {
    setState("loading");
    setError("");
    const result = await startCheckout({ lines: open.map(toLineInput) }).catch(() => null);
    if (result?.ok) {
      window.location.assign(result.data.url);
    } else {
      setState("error");
      setError(result?.error ?? "Checkout didn’t start. Try again in a moment.");
    }
  }

  return (
    <>
      <div className="bag-total">
        <span className="aw-label">Subtotal</span>
        <span className="aw-meta" style={{ fontSize: 16 }}>
          {formatPrice(subtotal)}
        </span>
      </div>
      {preview ? (
        <div className="notice">
          <p className="buy-preview-title">Not open for ordering yet</p>
          <p className="aw-small">
            Your bag saves your selections on this device. It doesn’t place an order or charge you.
            Leave your email to hear when these pieces can be ordered.
          </p>
          <NotifyForm
            source="product"
            productSlug={preview.snapshot.productSlug}
            label="Email me when they can be ordered"
          />
        </div>
      ) : (
        <>
          {previews.length > 0 ? (
            <p className="field-help">
              The subtotal covers the pieces you can order now. The rest aren’t open for ordering
              yet and stay saved in your bag.
            </p>
          ) : null}
          <p className="field-help">Shipping and tax are calculated at checkout.</p>
          <Button
            variant="primary"
            block
            onClick={checkout}
            disabled={state === "loading" || open.length === 0}
          >
            {state === "loading" ? "Opening checkout…" : "Check out"}
          </Button>
          {accountsEnabled && !signedIn ? (
            <p className="field-help">
              Checking out as a guest. Have an account?{" "}
              <Link href="/sign-in?next=/bag" onClick={onNavigate}>
                Sign in
              </Link>
            </p>
          ) : null}
        </>
      )}
      {state === "error" ? (
        <p className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function BagIssues({ issues }: { issues: BagIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="notice" role="status" style={{ marginBottom: "var(--space-6)" }}>
      {/* Several lines can earn the same notice (two removals); say each thing once. */}
      {[...new Set(issues.map((i) => i.message))].map((message) => (
        <p key={message} className="aw-small">
          {message}
        </p>
      ))}
    </div>
  );
}

export function BagEmpty({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-4)", justifyItems: "start" }}>
      <p className="aw-body">Your bag is empty.</p>
      <Button variant="secondary" href="/shop" onClick={onNavigate}>
        Visit the shop
      </Button>
    </div>
  );
}

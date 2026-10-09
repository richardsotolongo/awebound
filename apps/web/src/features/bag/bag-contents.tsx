"use client";

import { Button } from "@awebound/brand";
import { formatPrice, type BagIssue } from "@/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { startCheckout, validateBag } from "@/server/actions";
import { NotifyForm } from "./notify-form";
import { bagSubtotal, useBag } from "./bag-store";

/** Re-prices the bag on the server whenever it is shown. */
export function useBagValidation(active: boolean) {
  const lines = useBag((s) => s.lines);
  const reconcile = useBag((s) => s.reconcile);
  const [checked, setChecked] = useState<{ key: string; issues: BagIssue[] }>({
    key: "",
    issues: [],
  });
  const key = lines.map((l) => `${l.sku}:${l.quantity}`).join("|");

  useEffect(() => {
    if (!active || lines.length === 0) return;
    let cancelled = false;
    validateBag({ lines: lines.map(({ sku, quantity }) => ({ sku, quantity })) })
      .then((result) => {
        // On failure keep the local copy; checkout re-validates anyway.
        if (cancelled || !result.ok) return;
        const bag = result.data;
        setChecked({
          key: bag.lines.map((l) => `${l.sku}:${l.quantity}`).join("|"),
          issues: bag.issues,
        });
        const changed =
          bag.lines.length !== lines.length ||
          bag.lines.some(
            (l, i) =>
              l.quantity !== lines[i]?.quantity ||
              l.unitPriceCents !== lines[i]?.snapshot.unitPriceCents ||
              l.available !== lines[i]?.snapshot.available,
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

/** Subtotal and the button that hands the bag to Fourthwall's hosted checkout. */
export function BagCheckout() {
  const lines = useBag((s) => s.lines);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const subtotal = bagSubtotal(lines);
  const available = lines.filter((l) => l.snapshot.available);
  const preview = available.find((l) => l.snapshot.preview);

  async function checkout() {
    setState("loading");
    setError("");
    const result = await startCheckout({
      lines: available.map(({ sku, quantity }) => ({ sku, quantity })),
    }).catch(() => null);
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
          <p className="buy-preview-title">Ordering isn’t open yet</p>
          <p className="aw-small">
            Your bag saves your selections on this device. It doesn’t place an order or charge you.
            Leave your email to hear when ordering opens.
          </p>
          <NotifyForm
            source="product"
            productSlug={preview.snapshot.productSlug}
            label="Email me when ordering opens"
          />
        </div>
      ) : (
        <>
          <p className="field-help">Shipping and tax are calculated at checkout.</p>
          <Button
            variant="primary"
            block
            onClick={checkout}
            disabled={state === "loading" || available.length === 0}
          >
            {state === "loading" ? "Opening checkout…" : "Check out"}
          </Button>
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
      {issues.map((i) => (
        <p key={`${i.sku}-${i.kind}`} className="aw-small">
          {i.message}
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

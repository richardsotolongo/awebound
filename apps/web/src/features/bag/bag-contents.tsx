"use client";

import { Button } from "@awebound/brand";
import { ApiError, formatPrice, type BagIssue, type CheckoutResult } from "@awebound/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { bagSubtotal, useBag } from "./bag-store";
import { NotifyForm } from "./notify-form";

/** Re-prices the bag against the API whenever it is shown. */
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
    api
      .validateBag({ lines: lines.map(({ sku, quantity }) => ({ sku, quantity })) })
      .then((bag) => {
        if (cancelled) return;
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
      .catch(() => {
        // Offline: keep the local copy; checkout re-validates anyway.
      });
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
            <span className="aw-meta">{snapshot.code}</span>
            <p className="bag-line-name">
              <Link href={`/shop/${snapshot.productSlug}`} onClick={onNavigate}>
                {snapshot.name}
              </Link>
            </p>
            <p className="aw-small">
              {snapshot.cut} · {snapshot.color} · {snapshot.size}
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

/** Subtotal, checkout and the "opens soon" state while no commerce provider is connected. */
export function BagCheckout() {
  const lines = useBag((s) => s.lines);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState("");
  const subtotal = bagSubtotal(lines);
  const available = lines.filter((l) => l.snapshot.available);

  const checkout = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const outcome = await api.startCheckout({
        lines: available.map(({ sku, quantity }) => ({ sku, quantity })),
      });
      if (outcome.status === "redirect") {
        window.location.assign(outcome.url);
        return;
      }
      setResult(outcome);
      setState("idle");
    } catch (err) {
      setState("error");
      setError(
        err instanceof ApiError ? err.message : "Checkout didn’t start. Try again in a moment.",
      );
    }
  }, [available]);

  return (
    <>
      <div className="bag-total">
        <span className="aw-label">Subtotal</span>
        <span className="aw-meta" style={{ fontSize: 16 }}>
          {formatPrice(subtotal)}
        </span>
      </div>
      <p className="field-help">Shipping and tax are calculated at checkout.</p>
      {result?.status === "unavailable" ? (
        <div className="notice" role="status">
          <p className="aw-small" style={{ color: "var(--ink)" }}>
            {result.message}
          </p>
          <NotifyForm source="checkout" label="Your email" />
        </div>
      ) : (
        <Button
          variant="primary"
          block
          onClick={checkout}
          disabled={state === "loading" || available.length === 0}
        >
          {state === "loading" ? "Opening checkout…" : "Check out"}
        </Button>
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
        Shop the collection
      </Button>
    </div>
  );
}

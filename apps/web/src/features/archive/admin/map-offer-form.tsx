"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { mapOfferAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/** Pins the shop’s offer id a design’s orders arrive under. */
export function MapOfferForm({
  designKey,
  current,
}: {
  designKey: string;
  current: string | null;
}) {
  const id = useId();
  const [offerId, setOfferId] = useState(current ?? "");
  const { busy, message, failed, run } = useOwnerAction();
  const clean = offerId.trim();

  function submit(e: FormEvent) {
    e.preventDefault();
    run(() => mapOfferAction({ designKey, offerId: clean }), "Mapped.");
  }

  return (
    <form onSubmit={submit} className="field" noValidate>
      <div className="admin-inline">
        <input
          id={`${id}-offer`}
          className="aw-input"
          aria-label="Offer id"
          maxLength={80}
          value={offerId}
          onChange={(e) => setOfferId(e.target.value)}
        />
        <Button variant="secondary" type="submit" disabled={busy || !clean || clean === current}>
          Map
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </form>
  );
}

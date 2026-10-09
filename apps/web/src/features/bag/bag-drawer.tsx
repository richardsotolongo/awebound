"use client";

import { Sheet } from "@/components/sheet";
import { bagCount, useBag } from "./bag-store";
import { BagCheckout, BagEmpty, BagIssues, BagLines, useBagValidation } from "./bag-contents";

/** The bag as a right-hand sheet, opened from the header or after "Add to bag". */
export function BagDrawer() {
  const isOpen = useBag((s) => s.isOpen);
  const close = useBag((s) => s.close);
  const lines = useBag((s) => s.lines);
  const issues = useBagValidation(isOpen);
  const count = bagCount(lines);

  return (
    <Sheet
      id="bag"
      open={isOpen}
      onClose={close}
      title={
        <>
          Your bag <span className="aw-header-count">{count}</span>
        </>
      }
      footer={lines.length > 0 ? <BagCheckout /> : undefined}
    >
      <BagIssues issues={issues} />
      {lines.length > 0 ? <BagLines onNavigate={close} /> : <BagEmpty onNavigate={close} />}
    </Sheet>
  );
}

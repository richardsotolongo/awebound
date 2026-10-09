"use client";

import { useEffect, useState } from "react";
import { useBag } from "./bag-store";
import { BagCheckout, BagEmpty, BagIssues, BagLines, useBagValidation } from "./bag-contents";

/** Full-page bag, for direct links and when the drawer isn't wanted. */
export function BagPageContents() {
  const lines = useBag((s) => s.lines);
  const [hydrated, setHydrated] = useState(false);
  const issues = useBagValidation(hydrated);

  useEffect(() => {
    const done = () => setHydrated(true);
    if (useBag.persist.hasHydrated()) done();
    return useBag.persist.onFinishHydration(done);
  }, []);

  if (!hydrated) return <p className="aw-small">Loading your bag…</p>;
  if (lines.length === 0) return <BagEmpty />;

  return (
    <div className="split">
      <div>
        <BagIssues issues={issues} />
        <BagLines />
      </div>
      <aside
        style={{
          display: "grid",
          gap: "var(--space-4)",
          alignContent: "start",
          padding: "var(--space-6)",
          background: "var(--surface-raised)",
        }}
      >
        <BagCheckout />
      </aside>
    </div>
  );
}

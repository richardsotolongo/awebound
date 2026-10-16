"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { refreshMyOrders } from "@/server/archive-actions";

export function RefreshOrdersButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  async function refresh() {
    setState("busy");
    const result = await refreshMyOrders().catch(() => null);
    if (result?.ok) {
      track("orders_refreshed", { changed_order_count: result.data.changed });
      setState("done");
      setMessage(
        result.data.changed > 0
          ? "Your orders are up to date."
          : "Nothing new from our checkout partner.",
      );
      router.refresh();
    } else {
      setState("error");
      setMessage(result?.error ?? "That didn’t work. Try again in a moment.");
    }
  }
  return (
    <div>
      <Button variant="secondary" onClick={refresh} disabled={state === "busy"}>
        {state === "busy" ? "Checking…" : "Refresh orders"}
      </Button>
      <p className="field-help" role="status" aria-live="polite">
        {state === "done" || state === "error" ? message : ""}
      </p>
    </div>
  );
}

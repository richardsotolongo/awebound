"use client";

import { Button } from "@awebound/brand";
import Link from "next/link";
import { useId, useState } from "react";
import { applySuggestionsAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/**
 * Suggested wording waiting for designs: each name opens its page to read it first; one button
 * saves, approves and publishes all of it. Founder notes are never touched.
 */
export function ApplySuggestions({ pending }: { pending: { name: string; slug: string }[] }) {
  const id = useId();
  const [read, setRead] = useState(false);
  const { busy, message, failed, run } = useOwnerAction();
  if (pending.length === 0) return null;
  return (
    <div className="admin-suggestion">
      <p className="aw-h3">Suggested wording for {pending.length} designs</p>
      <p className="field-help">
        Open a design to read its suggestion beside your wording. Founder notes stay exactly as you
        approved them.
      </p>
      <ul className="admin-suggestion-list">
        {pending.map((p) => (
          <li key={p.slug}>
            <Link href={`/account/admin/content/${p.slug}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
      <label htmlFor={`${id}-read`} className="admin-check">
        <input
          id={`${id}-read`}
          type="checkbox"
          checked={read}
          onChange={(e) => setRead(e.target.checked)}
        />
        <span>I’ve read the suggested wording</span>
      </label>
      <div>
        <Button
          variant="secondary"
          disabled={busy || !read}
          onClick={() =>
            run(applySuggestionsAction, (r) => `Published ${r.published.length} designs.`)
          }
        >
          {busy ? "Publishing…" : "Use it for all and publish"}
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}

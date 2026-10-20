"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { setHonoraryAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

export interface HonoraryListRow {
  userId: string;
  email: string | null;
  name: string | null;
  reason: string;
  granted: string;
}

/** The honorary seals, each with a Revoke button that asks for a reason before it acts. */
export function HonoraryList({ rows }: { rows: HonoraryListRow[] }) {
  if (rows.length === 0) return <p className="aw-body">No honorary seals yet.</p>;
  return (
    <div className="admin-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Reason</th>
            <th>Granted</th>
            <th>
              <span className="visually-hidden">Revoke</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <HonoraryRow key={r.userId} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HonoraryRow({ row }: { row: HonoraryListRow }) {
  const id = useId();
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const revoke = useOwnerAction();

  function confirm(e: FormEvent) {
    e.preventDefault();
    if (!row.email) return;
    revoke.run(
      () => setHonoraryAction({ email: row.email!, action: "remove", reason }),
      (r) => {
        router.refresh();
        return `Honorary seal revoked from ${r.email}.`;
      },
    );
  }

  return (
    <tr>
      <td>{row.email ?? row.userId.slice(0, 8)}</td>
      <td>{row.name ?? ""}</td>
      <td>{row.reason}</td>
      <td>{row.granted}</td>
      <td>
        {asking ? (
          <form onSubmit={confirm} className="honorary-revoke" noValidate>
            <label htmlFor={`${id}-reason`} className="visually-hidden">
              Reason for revoking
            </label>
            <input
              id={`${id}-reason`}
              className="aw-input"
              placeholder="Reason"
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              variant="secondary"
              type="submit"
              disabled={revoke.busy || reason.trim().length < 3}
            >
              Confirm revoke
            </Button>
            <Button variant="link" type="button" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Outcome message={revoke.message} failed={revoke.failed} />
          </form>
        ) : (
          <Button
            variant="secondary"
            type="button"
            disabled={!row.email}
            onClick={() => setAsking(true)}
          >
            Revoke
          </Button>
        )}
      </td>
    </tr>
  );
}

/**
 * Grant an honorary Founding seal by the person's account email, with a reason for the audit log.
 * They need a free account first. Revoking is on each row of the list above.
 */
export function HonoraryTools() {
  const id = useId();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const tool = useOwnerAction();

  function submit(e: FormEvent) {
    e.preventDefault();
    tool.run(
      () => setHonoraryAction({ email: email.trim(), action: "grant", reason }),
      (r) => {
        setEmail("");
        setReason("");
        router.refresh();
        return `Honorary seal granted to ${r.email}.`;
      },
    );
  }

  return (
    <form onSubmit={submit} className="admin-editor field" noValidate>
      <label htmlFor={`${id}-email`} className="aw-label">
        Their account email
      </label>
      <input
        id={`${id}-email`}
        className="aw-input"
        type="email"
        autoComplete="off"
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor={`${id}-reason`} className="aw-label">
        Reason (only you see it)
      </label>
      <input
        id={`${id}-reason`}
        className="aw-input"
        maxLength={300}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <p className="field-help">
        They need a free account with this email first. An honorary seal opens everything the
        Founding seal does, with “Honorary” in place of a number.
      </p>
      <div>
        <Button
          variant="secondary"
          type="submit"
          disabled={tool.busy || !email.includes("@") || reason.trim().length < 3}
        >
          Grant honorary seal
        </Button>
      </div>
      <Outcome message={tool.message} failed={tool.failed} />
    </form>
  );
}

/** Helpers for the owner's tables: one date format, and ids shortened with the full id on hover. */
export const when = (iso: string | null | undefined, empty = "–") =>
  iso ? new Date(iso).toLocaleString("en-US") : empty;

export function ShortId({ id }: { id: string | null | undefined }) {
  if (!id) return "–";
  return (
    <code className="admin-code" title={id}>
      {id.length > 12 ? id.slice(0, 8) : id}
    </code>
  );
}

/** An order by the number Fourthwall shows (UATDHT5U), our id on hover; the id if it has none. */
export function OrderNumber({
  id,
  number,
}: {
  id: string | null | undefined;
  number?: string | null;
}) {
  if (!number) return <ShortId id={id} />;
  return (
    <code className="admin-code" title={id ?? undefined}>
      {number}
    </code>
  );
}

/** A person by name with their email beneath (the email alone without a name), user id on hover. */
export function Member({
  userId,
  name,
  email,
}: {
  userId: string | null | undefined;
  name?: string | null;
  email?: string | null;
}) {
  if (!name && !email) return <ShortId id={userId} />;
  return (
    <span className="admin-member" title={userId ?? undefined}>
      <span className="admin-member-name">{name || email}</span>
      {name && email ? <span className="admin-member-email">{email}</span> : null}
    </span>
  );
}

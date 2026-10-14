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

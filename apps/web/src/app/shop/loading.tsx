export default function Loading() {
  return (
    <div className="aw-container" aria-busy="true" aria-live="polite">
      <div className="page-header">
        <p className="aw-label">Shop</p>
        <p className="aw-h1">Behold</p>
      </div>
      <p className="aw-small">Loading the release…</p>
    </div>
  );
}

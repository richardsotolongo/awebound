import { Button, ThornCross } from "@awebound/brand";

export default function NotFound() {
  return (
    <div
      className="aw-container section"
      style={{
        display: "grid",
        justifyItems: "center",
        textAlign: "center",
        gap: "var(--space-6)",
      }}
    >
      <span style={{ color: "var(--line-strong)" }}>
        <ThornCross size="small" height={56} title="" />
      </span>
      <p className="aw-label">404</p>
      <h1 className="aw-h1">This page isn’t here</h1>
      <p className="aw-body">It may have moved, or the link may be mistyped.</p>
      <div className="aw-btn-row" style={{ justifyContent: "center" }}>
        <Button variant="primary" href="/shop">
          Shop the collection
        </Button>
        <Button variant="secondary" href="/">
          Go home
        </Button>
      </div>
    </div>
  );
}

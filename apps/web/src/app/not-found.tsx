import { Button } from "@awebound/brand";

export default function NotFound() {
  return (
    <div className="aw-container section stopped">
      <h1 className="aw-h1">This page isn’t here</h1>
      <p className="aw-body">It may have moved, or the link may be mistyped.</p>
      <div className="aw-btn-row">
        <Button variant="primary" href="/shop">
          Visit the shop
        </Button>
        <Button variant="secondary" href="/">
          Go home
        </Button>
      </div>
    </div>
  );
}

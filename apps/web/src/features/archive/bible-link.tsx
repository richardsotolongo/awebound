import { ArrowUpRightIcon } from "@/components/icons";

/** The passage on Bible Gateway, as a button that says where it goes and that it opens a tab. */
export function BibleLink({ href, reference }: { href: string; reference: string }) {
  return (
    <div className="aw-btn-row">
      <a href={href} target="_blank" rel="noopener noreferrer" className="aw-btn aw-btn-secondary">
        Read {reference} (NIV)
        <ArrowUpRightIcon size={16} />
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    </div>
  );
}

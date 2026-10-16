import { ArrowUpRightIcon } from "@/components/icons";

/**
 * The passage on bible.com, as a button that says where it goes, in which translation (read off
 * the link: server/scripture.ts gives every link in the website's translation) and that it opens
 * a tab.
 */
export function BibleLink({ href, reference }: { href: string; reference: string }) {
  const version = href.match(/bible\.com\/bible\/\d+\/[^/]+\.([A-Z0-9]+)$/i)?.[1]?.toUpperCase();
  return (
    <div className="aw-btn-row">
      <a href={href} target="_blank" rel="noopener noreferrer" className="aw-btn aw-btn-secondary">
        Read {reference}
        {version ? ` (${version})` : ""}
        <ArrowUpRightIcon size={16} />
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
    </div>
  );
}

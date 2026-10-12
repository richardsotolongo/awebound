/* Types for awebound-components.jsx and awebound.umd.js, generated from packages/brand/src by scripts/sync-from-site.mjs. */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ComponentType, KeyboardEvent, ReactNode, JSX } from "react";

/** Joins truthy class names. */
export declare function cx(...parts: Array<string | false | null | undefined>): string;

/**
 * Raw values for the few places CSS variables can't reach: <meta name="theme-color">, generated
 * images and HTML email. Keep in sync with src/styles/tokens.css; style everything else with tokens.
 */
export declare const BRAND_HEX: {
    readonly surfacePage: "#0D0C0B";
    readonly coal: "#151413";
    readonly bone: "#F0E6D2";
    readonly warmBone: "#E8DDC9";
    readonly oxblood: "#782B35";
};

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
};
export type LinkComponent = ComponentType<LinkProps>;
/**
 * Lets brand components render the host framework's link (for example next/link) for internal
 * hrefs. External, mailto and tel links always render a plain anchor.
 */
export declare function BrandLinkProvider({ link, children, }: {
    link: LinkComponent;
    children: ReactNode;
}): JSX.Element;
export declare function BrandLink(props: LinkProps): JSX.Element;

export interface MarkGeometry {
    viewBox: string;
    d: string;
}
export declare const WORDMARK: MarkGeometry;
export declare const THORN_CROSS: MarkGeometry;
export declare const THORN_CROSS_SMALL: MarkGeometry;
export declare const LILY: MarkGeometry;
export declare const THORN_VINE: MarkGeometry;
export declare const THORN_WREATH: MarkGeometry;

interface BaseMarkProps {
    /** Height in px; width follows the mark's proportions. */
    height?: number;
    /** CSS color for the ink. Defaults to the parent's color. */
    color?: string;
    /** Accessible name. Pass "" when the mark is decorative. */
    title?: string;
    className?: string;
    style?: CSSProperties;
}
/**
 * The A3 Thornbound wordmark. Artwork, never type. Keep it at least 120px wide
 * (about 56px tall); below that use <ThornCross size="small" />.
 */
export declare function Wordmark({ height, ...rest }: BaseMarkProps): JSX.Element;
export interface ThornCrossProps extends BaseMarkProps {
    /** "full" at 96px and up, "small" below. */
    size?: "full" | "small";
}
/** The Thorn Cross: Awebound's only cross. Upright and whole, single ink. */
export declare function ThornCross({ size, height, ...rest }: ThornCrossProps): JSX.Element;
export type SecondaryMarkName = "lily" | "thorn-vine" | "thorn-wreath";
/** Secondary marks: lily, thorn vine, thorn wreath. One ink each; never stack more than two marks. */
export declare function Mark({ name, height, ...rest }: BaseMarkProps & {
    name: SecondaryMarkName;
}): JSX.Element;

/**
 * Roving-tabindex keyboard support for a radiogroup made of buttons:
 * arrow keys move and select, Home/End jump, disabled options are skipped.
 */
export declare function useRadioGroup(options: string[], value: string | undefined, onChange: ((v: string) => void) | undefined, disabled?: string[]): {
    itemProps: (option: string, index: number) => {
        ref: (el: HTMLButtonElement | null) => void;
        tabIndex: number;
        onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
    };
};

export type ButtonVariant = "primary" | "secondary" | "link" | "on-feature" | "on-altar";
interface CommonProps {
    /** One primary per screen. */
    variant?: ButtonVariant;
    /** Stretch to the container width. */
    block?: boolean;
    className?: string;
    children?: ReactNode;
}
type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
};
type AsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
};
export type ButtonProps = AsButton | AsLink;
/** Buttons for actions. Labels are sentence case in code; styling sets caps. Never "Buy now". */
export declare function Button(props: ButtonProps): JSX.Element;

export interface ScriptureRefProps {
    /** Full book name, chapter and verse: "Galatians 5:1", ranges with an en dash: "Luke 24:1–6". */
    reference: string;
    /** The translation, only when its words are quoted beside the reference. */
    translation?: string;
    /** The quote is part of the verse: "Matthew 9:21 — NIV, excerpt". */
    excerpt?: boolean;
    align?: "center" | "start";
    className?: string;
}
/** A Scripture reference in upright type: "Mark 4:41 — NIV". */
export declare function ScriptureRef({ reference, translation, excerpt, align, className, }: ScriptureRefProps): JSX.Element;

export interface ScriptureQuoteProps {
    /** Exact wording, without surrounding quotation marks. */
    text: string;
    reference: string;
    translation: string;
    /** Part of the verse rather than all of it. */
    excerpt?: boolean;
    /** "sm" in cards, "md" beside a product name, "lg" for a featured verse. */
    size?: "sm" | "md" | "lg";
    align?: "center" | "start";
    className?: string;
}
/**
 * Wraps a quotation in curly double quotes. Quotation marks inside the verse become single
 * quotes, so nesting reads correctly: “They asked, ‘Who is this?’”
 */
export declare function quoted(text: string): string;
/**
 * A Scripture quotation: the words in Cormorant Garamond italic, the reference beneath in
 * upright type, with the translation (and "excerpt" when only part of the verse is quoted).
 * Quotes always wrap in full; never truncate them.
 */
export declare function ScriptureQuote({ text, reference, translation, excerpt, size, align, className, }: ScriptureQuoteProps): JSX.Element;

export interface ThornRuleProps {
    /** Show the small Thorn Cross at the center. Default true. */
    cross?: boolean;
    className?: string;
}
/** The section divider: a hairline with small alternating thorns. Use between sections, not list items. */
export declare function ThornRule({ cross, className }: ThornRuleProps): JSX.Element;

export interface NavLink {
    label: string;
    href: string;
}
export interface HeaderProps {
    links?: NavLink[];
    /** Label of the active link. */
    current?: string;
    /** Sign-in or account link, shown beside the bag. Omit when accounts are off. */
    account?: NavLink;
    bagCount?: number;
    /** Opens the bag drawer. When omitted the bag renders as a link to bagHref. */
    onBag?: () => void;
    bagHref?: string;
    homeHref?: string;
    /** Toggles the phone menu. */
    onMenu?: () => void;
    menuOpen?: boolean;
    /** id of the phone menu panel, for aria-controls. */
    menuId?: string;
    className?: string;
}
/**
 * Site header: wordmark, links, the account link and the bag, collapsing to a menu button on
 * phones. The bag is outlined, not filled, because each screen's one primary button is elsewhere.
 */
export declare function Header({ links, current, account, bagCount, onBag, bagHref, homeHref, onMenu, menuOpen, menuId, className, }: HeaderProps): JSX.Element;

export interface Action {
    label: string;
    href: string;
}
export interface HeroProps {
    eyebrow?: string;
    /** Twelve words at most. */
    title: string;
    /** One sentence. */
    body?: string;
    primary?: Action;
    secondary?: Action;
    scripture?: string;
    image?: string;
    imageAlt?: string;
    className?: string;
}
/** The page opener. Carries the page's only oxblood glow. One hero per page. */
export declare function Hero({ eyebrow, title, body, primary, secondary, scripture, image, imageAlt, className, }: HeroProps): JSX.Element;

export interface ProductCardProps {
    name: string;
    /** Garment type, e.g. "Oversized tee". */
    type?: string;
    /** The piece's Scripture, quoted in full under the name. */
    quote?: {
        text: string;
        reference: string;
        translation: string;
        excerpt?: boolean;
    };
    /** The whole garment, showing its main artwork. */
    image: string;
    imageAlt?: string;
    /** Shown on hover, usually the other side. */
    hoverImage?: string;
    href: string;
    price?: string;
    /** Said plainly under the price when it applies: "Sold out", "Not open for ordering yet". */
    status?: string;
    /** Load the image eagerly (above the fold). */
    priority?: boolean;
    /** Heading level for the name; h3 under a section heading. */
    as?: "h2" | "h3";
    className?: string;
}
/**
 * A product tile: the whole garment, the name, its type and price, then its Scripture in italic
 * with the reference. The name comes first: nothing sits above it as a label. The whole card
 * links to the product page.
 */
export declare function ProductCard({ name, type, quote, image, imageAlt, hoverImage, href, price, status, priority, as: Heading, className, }: ProductCardProps): JSX.Element;

export interface SwatchColor {
    name: string;
    /** CSS color, ideally var(--garment-*) or var(--cap-*). */
    hex: string;
}
export interface SwatchesProps {
    colors: SwatchColor[];
    value?: string;
    onChange?: (name: string) => void;
    label?: string;
    className?: string;
}
/** Garment color picker: square chips with the chosen color named beside them. */
export declare function Swatches({ colors, value, onChange, label, className }: SwatchesProps): JSX.Element;

export interface SizeSelectorProps {
    sizes?: string[];
    value?: string;
    /** Sold-out sizes, struck through. */
    unavailable?: string[];
    onChange?: (size: string) => void;
    label?: string;
    className?: string;
}
/** Size picker for apparel, with sold-out sizes struck through. */
export declare function SizeSelector({ sizes, value, unavailable, onChange, label, className, }: SizeSelectorProps): JSX.Element;

export interface CollectionBannerProps {
    /** The release or collection name. */
    family: string;
    /** Short label above the name, e.g. "Release 01". */
    eyebrow: string;
    /** One sentence. */
    story?: string;
    /** "feature" (washed oxblood) for a new drop. */
    tone?: "coal" | "feature";
    action?: Action;
    /** Heading level for the family name. */
    as?: "h1" | "h2";
    children?: ReactNode;
    className?: string;
}
/** A release intro: eyebrow label, name, one line of story and one action. */
export declare function CollectionBanner({ family, eyebrow, story, tone, action, as: Heading, children, className, }: CollectionBannerProps): JSX.Element;

export interface AltarPanelProps {
    /** The signature oxblood wordmark (default) or the Thorn Cross. */
    mark?: "wordmark" | "cross" | "none";
    eyebrow?: string;
    title?: string;
    /** Heading level for the title; "h1" when the panel opens the page. */
    as?: "h1" | "h2";
    body?: string;
    scripture?: string;
    action?: Action;
    children?: ReactNode;
    id?: string;
    className?: string;
}
/** A warm-bone panel that breaks the dark page and carries the signature lockup. One or two per page. */
export declare function AltarPanel({ mark, eyebrow, title, as: Heading, body, scripture, action, children, id, className, }: AltarPanelProps): JSX.Element;

export interface FooterProps {
    links?: NavLink[];
    tagline?: string;
    year?: number;
    /** Small print under the copyright line, e.g. the Scripture translation notice. */
    notice?: ReactNode;
    /** Show the sign-up form (off on pages that already have one). */
    signup?: boolean;
    /** Resolve to confirm in place; reject (or throw) to show an error. */
    onSubscribe?: (email: string) => Promise<void> | void;
    /** Shown under the tagline, e.g. the site's "Ask AI" links. */
    children?: ReactNode;
}
/**
 * The site footer: small Thorn Cross and tagline, a release-updates sign-up and policy links,
 * the legal line, and the wordmark across the full width at the very bottom.
 */
export declare function Footer({ links, tagline, year, notice, signup, onSubscribe, children, }: FooterProps): JSX.Element;

declare global {
    interface Window {
        /** Set by awebound.umd.js. */
        Awebound: { cx: typeof cx; BRAND_HEX: typeof BRAND_HEX; BrandLinkProvider: typeof BrandLinkProvider; BrandLink: typeof BrandLink; WORDMARK: typeof WORDMARK; THORN_CROSS: typeof THORN_CROSS; THORN_CROSS_SMALL: typeof THORN_CROSS_SMALL; LILY: typeof LILY; THORN_VINE: typeof THORN_VINE; THORN_WREATH: typeof THORN_WREATH; Wordmark: typeof Wordmark; ThornCross: typeof ThornCross; Mark: typeof Mark; useRadioGroup: typeof useRadioGroup; Button: typeof Button; ScriptureRef: typeof ScriptureRef; quoted: typeof quoted; ScriptureQuote: typeof ScriptureQuote; ThornRule: typeof ThornRule; Header: typeof Header; Hero: typeof Hero; ProductCard: typeof ProductCard; Swatches: typeof Swatches; SizeSelector: typeof SizeSelector; CollectionBanner: typeof CollectionBanner; AltarPanel: typeof AltarPanel; Footer: typeof Footer };
    }
}

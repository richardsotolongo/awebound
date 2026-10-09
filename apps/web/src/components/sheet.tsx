"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Visible title, also the dialog's accessible name. */
  title: ReactNode;
  side?: "left" | "right";
  footer?: ReactNode;
  children: ReactNode;
  id?: string;
}

/**
 * A slide-in panel on the native <dialog> element: showModal() traps focus, makes the page inert
 * and closes on Escape. Clicking the backdrop closes it too.
 */
export function Sheet({ open, onClose, title, side = "right", footer, children, id }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `${id ?? "sheet"}-title`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      id={id}
      className="aw-sheet"
      data-side={side}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="aw-sheet-in">
        <div className="aw-sheet-head">
          <h2 id={titleId} className="aw-label" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="aw-sheet-body">{children}</div>
        {footer ? <div className="aw-sheet-foot">{footer}</div> : null}
      </div>
    </dialog>
  );
}

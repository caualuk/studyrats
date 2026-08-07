"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeydown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(event) => {
        // React bubbles portal events through the *component* tree, not the
        // DOM tree -- without this, a backdrop click here would also reach
        // whatever onClick sits on an ancestor in React's tree (e.g. a card
        // that opens its own modal on click), even though this overlay is
        // rendered into document.body, nowhere near that ancestor in the DOM.
        event.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-bg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

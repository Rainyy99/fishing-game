"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
  closeTestId?: string;
}

const FOCUSABLE = 'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Bottom sheet. Traps focus, closes on Escape or a tap outside, and gives focus back when it closes. */
export function Sheet({ title, onClose, children, testId, closeTestId }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-testid={testId}
        onClick={(e) => e.stopPropagation()}
        className="sheet-in panel flex max-h-[90dvh] w-full max-w-md flex-col rounded-b-none outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-line px-4 py-3">
          <h2 className="lettered text-2xl">{title}</h2>
          <Button size="sm" variant="quiet" data-testid={closeTestId} onClick={onClose}>
            Done
          </Button>
        </div>
        <div className="overflow-y-auto px-4 pb-8 pt-4">{children}</div>
      </div>
    </div>
  );
}

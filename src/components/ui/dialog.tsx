"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  eyebrow,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", handleKeyDown);
    const timer = window.setTimeout(() => {
      const field = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([type="file"]), select, textarea',
      );
      const fallback = panelRef.current?.querySelector<HTMLElement>("button");
      (field ?? fallback)?.focus();
    }, 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 animate-fade cursor-default bg-black/70 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full animate-pop flex-col overflow-hidden rounded-t-[28px] border border-white/[0.09] bg-[#101217] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)] sm:max-w-lg sm:rounded-[28px]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 pb-5 pt-6">
          <div>
            {eyebrow ? (
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-brand/80">{eyebrow}</p>
            ) : null}
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h2>
            {description ? <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <X size={17} />
          </button>
        </div>
        <div className="scrollbar-slim overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  pending = false,
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  tone?: "danger" | "primary";
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} className="sm:max-w-md">
      <p className="text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl px-4 text-sm font-medium text-muted transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50",
            tone === "danger"
              ? "bg-red-500 text-white hover:bg-red-400"
              : "bg-brand text-[#101408] hover:bg-[#d8fb86]",
          )}
        >
          {pending ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : null}
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

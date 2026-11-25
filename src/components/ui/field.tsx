import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[12px] font-medium text-[#B7BCC8]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11.5px] text-red-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11.5px] text-muted/80">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-white/[0.03] text-sm text-white outline-none transition placeholder:text-muted/45 focus:bg-white/[0.045] focus:ring-4 disabled:opacity-60";

export function inputClass(hasError?: boolean, className?: string) {
  return cn(
    inputBase,
    "h-11 border-white/[0.09] px-3.5 focus:border-brand/50 focus:ring-brand/[0.08]",
    hasError && "border-red-400/40 focus:border-red-400/60 focus:ring-red-500/[0.08]",
    className,
  );
}

export function Input({
  className,
  hasError,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return <input className={inputClass(hasError, className)} {...props} />;
}

export function Textarea({
  className,
  hasError,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      className={cn(
        inputBase,
        "min-h-[80px] resize-none border-white/[0.09] px-3.5 py-2.5 focus:border-brand/50 focus:ring-brand/[0.08]",
        hasError && "border-red-400/40",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  hasError,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <select
      className={cn(
        inputBase,
        "h-11 appearance-none border-white/[0.09] px-3.5 pr-9 focus:border-brand/50 focus:ring-brand/[0.08]",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%238d93a1%22%20stroke-width%3D%221.8%22%3E%3Cpath%20d%3D%22m2%204%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[position:right_14px_center] bg-no-repeat",
        hasError && "border-red-400/40",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-400/20 bg-red-500/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-200"
    >
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
    />
  );
}

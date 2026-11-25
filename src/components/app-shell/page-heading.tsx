import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="animate-rise">
        <p className="mb-2 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          {eyebrow}
        </p>
        <h1 className="text-[28px] font-semibold leading-none tracking-[-0.045em] text-white sm:text-[34px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

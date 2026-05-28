import type { ReactNode } from "react";

interface SectionShellProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  titleAs?: "h1" | "h2";
  compact?: boolean;
}

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
  titleAs = "h2",
  compact = false,
}: SectionShellProps) {
  const TitleTag = titleAs;

  return (
    <section
      id={id}
      className={`scroll-mt-20 ${
        compact ? "py-10 sm:py-12" : "py-20 sm:py-24"
      } ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
            {eyebrow}
          </p>
          <TitleTag className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </TitleTag>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              {description}
            </p>
          ) : null}
        </header>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}

/** Shared card surface used across sections on the unified page background. */
export const surfaceCardClass =
  "rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm";

"use client";

interface SiteHeaderProps {
  onTryIt: () => void;
  onHowItWorks: () => void;
  onHome: () => void;
}

export function SiteHeader({ onTryIt, onHowItWorks, onHome }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <button type="button" onClick={onHome} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white">
            VS
          </span>
          <span className="text-base font-semibold text-white">Voice Support</span>
        </button>
        <nav className="flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={onHowItWorks}
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={onTryIt}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Try it now
          </button>
        </nav>
      </div>
    </header>
  );
}

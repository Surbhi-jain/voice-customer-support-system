"use client";

import { VoicePreviewCard } from "./VoicePreviewCard";

interface LandingHeroProps {
  onTryIt: () => void;
  onHowItWorks: () => void;
}

const HIGHLIGHTS = [
  "24/7 support for your customers, day and night",
  "Faster response, happier customers, stronger trust",
  "Scale conversations without scaling your support team",
];

export function LandingHero({ onTryIt, onHowItWorks }: LandingHeroProps) {
  return (
    <section id="top" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Built for business
            </p>

            <div className="space-y-5">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[2.75rem] lg:leading-[1.12]">
                Turn every customer call into a{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  24/7 growth opportunity
                </span>
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-slate-300">
                Give your business a voice-first support experience that feels
                human, responds instantly, and keeps your customers engaged at
                any hour.
              </p>
            </div>

            <ul className="space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-300">
                    ✓
                  </span>
                  <span className="text-base text-slate-200">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onTryIt}
                className="rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
              >
                Try it now
              </button>
              <button
                type="button"
                onClick={onHowItWorks}
                className="rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
              >
                How it works
              </button>
            </div>
          </div>

          <div className="lg:pl-4">
            <VoicePreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}

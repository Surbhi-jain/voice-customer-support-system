export function PageBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900" />
      <div className="absolute -left-40 top-24 h-96 w-96 animate-float rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-80 w-80 animate-float rounded-full bg-teal-500/10 blur-3xl animation-delay-400" />
      <div className="absolute bottom-0 left-1/2 h-96 w-[36rem] -translate-x-1/2 animate-pulse-glow rounded-full bg-emerald-600/10 blur-3xl" />
    </div>
  );
}

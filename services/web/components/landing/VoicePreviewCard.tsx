import { VoiceWaveVisualizer } from "./VoiceWaveVisualizer";

export function VoicePreviewCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Example call
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Hotel support</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Ready to listen
        </span>
      </div>

      <VoiceWaveVisualizer />

      <div className="mt-6 space-y-3 rounded-2xl bg-slate-900/60 p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-400">You</p>
          <p className="mt-1 text-sm text-slate-300">
            I need to reschedule my booking and request an early check-in.
          </p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <p className="text-xs font-semibold uppercase text-teal-400">Assistant</p>
          <p className="mt-1 text-sm text-slate-400">
            Certainly. I can help you update the reservation and share available early check-in options.
          </p>
        </div>
      </div>
    </div>
  );
}

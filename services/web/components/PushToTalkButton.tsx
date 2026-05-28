interface SpeakControlsProps {
  startDisabled: boolean;
  stopDisabled: boolean;
  isListening: boolean;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
}

export function SpeakControls({
  startDisabled,
  stopDisabled,
  isListening,
  onStartSpeaking,
  onStopSpeaking,
}: SpeakControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        disabled={startDisabled}
        aria-label="Start speaking"
        aria-pressed={isListening}
        onClick={onStartSpeaking}
        className={`select-none rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all ${
          startDisabled
            ? "cursor-not-allowed bg-slate-300 opacity-60"
            : isListening
              ? "bg-emerald-400 opacity-80"
              : "bg-emerald-500 hover:bg-emerald-600 active:scale-95"
        }`}
      >
        Start speaking
      </button>
      <button
        type="button"
        disabled={stopDisabled}
        aria-label="Stop speaking"
        onClick={onStopSpeaking}
        className={`select-none rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all ${
          stopDisabled
            ? "cursor-not-allowed bg-slate-300 opacity-60"
            : "scale-105 bg-red-500 ring-4 ring-red-200 hover:bg-red-600 active:scale-95"
        }`}
      >
        Stop
      </button>
    </div>
  );
}

// Keep old export name for any existing imports during transition.
export const PushToTalkButton = SpeakControls;

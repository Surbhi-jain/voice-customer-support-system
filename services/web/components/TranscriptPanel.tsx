interface TranscriptPanelProps {
  userText: string;
  editable: boolean;
  transcriptReady: boolean;
  onChange: (text: string) => void;
}

export function TranscriptPanel({
  userText,
  editable,
  transcriptReady,
  onChange,
}: TranscriptPanelProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        You said
      </h2>
      {editable ? (
        <textarea
          value={userText}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          placeholder="Your words will appear here. Edit if needed, then send."
          aria-label="Your message"
        />
      ) : (
        <p className="min-h-[4rem] whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {userText ||
            (transcriptReady
              ? ""
              : "Click Start speaking, then Stop — your words will appear here.")}
        </p>
      )}
      {editable && transcriptReady ? (
        <p className="mt-2 text-center text-xs text-slate-400 sm:text-left">
          Review your message before sending.
        </p>
      ) : null}
    </section>
  );
}

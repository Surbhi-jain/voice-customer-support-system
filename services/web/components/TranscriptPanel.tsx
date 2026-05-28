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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        You said
      </h2>
      {editable ? (
        <textarea
          value={userText}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Your words will appear here after you stop recording. Edit if needed, then send."
          aria-label="Transcript — edit if speech recognition was wrong"
        />
      ) : (
        <p className="min-h-[4rem] whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {userText ||
            (transcriptReady
              ? ""
              : "Click Start speaking, then Stop — your words will appear here.")}
        </p>
      )}
      {editable && transcriptReady ? (
        <p className="mt-2 text-xs text-slate-500">
          Fix any wrong words before sending — speech recognition is not always perfect.
        </p>
      ) : null}
    </section>
  );
}

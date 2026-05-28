import type { SessionStatus } from "@voice-support/shared";

const STATUS_LABELS: Record<SessionStatus, string> = {
  idle: "Idle",
  greeting: "Greeting…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  error: "Error",
};

const STATUS_COLORS: Record<SessionStatus, string> = {
  idle: "bg-slate-500",
  greeting: "bg-violet-500 animate-pulse",
  listening: "bg-emerald-500 animate-pulse",
  thinking: "bg-amber-500 animate-pulse",
  speaking: "bg-blue-500 animate-pulse",
  error: "bg-red-500",
};

interface StatusBarProps {
  status: SessionStatus;
  isActive: boolean;
  topicLabel?: string;
}

export function StatusBar({ status, isActive, topicLabel }: StatusBarProps) {
  const displayStatus = isActive ? status : "idle";
  const statusText = isActive
    ? topicLabel
      ? `${topicLabel} · ${STATUS_LABELS[displayStatus]}`
      : STATUS_LABELS[displayStatus]
    : "Session stopped";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span
        className={`h-3 w-3 shrink-0 rounded-full ${STATUS_COLORS[displayStatus]}`}
        aria-hidden
      />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Status
        </p>
        <p className="text-sm font-semibold text-slate-900">{statusText}</p>
      </div>
    </div>
  );
}

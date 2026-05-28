"use client";

import { SpeakControls } from "@/components/PushToTalkButton";
import { StatusBar } from "@/components/StatusBar";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { SUPPORT_TOPICS } from "@voice-support/shared";
import { SectionShell } from "./SectionShell";

export function TryoutSection() {
  const {
    status,
    isActive,
    isStarting,
    startingStep,
    userText,
    error,
    language,
    setLanguage,
    topicId,
    topicLabel,
    customerName,
    setCustomerName,
    setTopicId,
    voiceId,
    setVoiceId,
    voiceOptions,
    startSession,
    stopSession,
    stopReply,
    newConversation,
    startListening,
    stopListening,
    sendTranscript,
    transcriptReady,
    setUserTextFromUi,
    clearError,
  } = useVoiceSession();

  const isListening = status === "listening";
  const isTranscribing = status === "thinking" && !transcriptReady;
  const isBusy =
    status === "greeting" || status === "thinking" || status === "speaking";
  const startSpeakingDisabled = !isActive || isBusy || isListening;
  const stopSpeakingDisabled = !isListening;
  const canSendTranscript =
    isActive &&
    transcriptReady &&
    userText.trim().length > 0 &&
    !isBusy &&
    !isListening;

  const statusHint = !isActive
    ? "Open the options panel below, then tap Start conversation."
    : status === "greeting"
      ? "Your assistant is saying hello…"
      : isTranscribing
        ? "Understanding what you said…"
        : isBusy
          ? "Tap Stop reply to pause, then ask something else."
          : isListening
            ? "Speak clearly, then tap Stop. Review your words and send when ready."
            : transcriptReady
              ? "Your message is ready — send it or edit first."
              : "Tap Start speaking, then Stop when you finish your question.";

  return (
    <SectionShell
      id="tryout"
      eyebrow="Live demo"
      title="Try it yourself"
      description="Pick your details, start a conversation, and experience voice support the way your customers would."
      compact
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <aside className="self-start rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-xl shadow-black/15 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Guided Walkthrough
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Demo Playbook</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Present a clear, premium support journey in under two minutes.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Step 1</p>
              <p className="mt-1.5 text-sm text-slate-200">Set customer name, support topic, and language.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Step 2</p>
              <p className="mt-1.5 text-sm text-slate-200">Start the call and ask a real customer query.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Step 3</p>
              <p className="mt-1.5 text-sm text-slate-200">Show fast voice response and interruption control.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-400">Availability</p>
              <p className="mt-1 text-sm font-semibold text-white">24/7</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-400">Experience</p>
              <p className="mt-1 text-sm font-semibold text-white">Voice-first</p>
            </div>
          </div>
        </aside>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/65 to-slate-900/50 p-6 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Interactive Console</p>
              <p className="mt-1 text-sm font-medium text-slate-200">Live customer support simulation</p>
            </div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Ready
            </span>
          </div>
          <StatusBar status={status} isActive={isActive} topicLabel={topicLabel} />

          <div className="mt-8 space-y-8">
            <TranscriptPanel
              userText={userText}
              editable={isActive}
              transcriptReady={transcriptReady}
              onChange={setUserTextFromUi}
            />

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
              >
                <p className="font-medium">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-700 underline"
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            <details className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <summary className="cursor-pointer text-center text-sm font-semibold text-slate-200">
                Preferences
              </summary>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  <span className="font-medium text-center sm:text-left">Your name</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="e.g. Alex"
                    className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-center text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:text-left"
                    disabled={isActive || isStarting}
                    aria-label="Your name"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  <span className="font-medium text-center sm:text-left">Support topic</span>
                  <select
                    value={topicId}
                    onChange={(event) => setTopicId(event.target.value)}
                    className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-center text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:text-left"
                    disabled={isActive || isStarting}
                    aria-label="Support topic"
                  >
                    {SUPPORT_TOPICS.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  <span className="font-medium text-center sm:text-left">Language</span>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-center text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:text-left"
                    disabled={isActive || isStarting}
                    aria-label="Language"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="hi-IN">Hindi (India)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-slate-300">
                  <span className="font-medium text-center sm:text-left">Assistant voice</span>
                  <select
                    value={voiceId}
                    onChange={(event) => setVoiceId(event.target.value)}
                    className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2.5 text-center text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:text-left"
                    disabled={isStarting || voiceOptions.length === 0}
                    aria-label="Assistant voice"
                  >
                    {voiceOptions.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Choose your topic before starting. To switch topics, end the session and
                start again.
              </p>
            </details>

            <div className="flex flex-col items-center gap-5 border-t border-white/10 pt-8">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => void startSession()}
                    disabled={isStarting}
                    className="cursor-pointer rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isStarting
                      ? startingStep === "microphone"
                        ? "Allow microphone…"
                        : "One moment…"
                      : "Start conversation"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={stopSession}
                      className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      End session
                    </button>
                    {isBusy ? (
                      <button
                        type="button"
                        onClick={stopReply}
                        className="cursor-pointer rounded-xl border border-amber-300 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                      >
                        Stop reply
                      </button>
                    ) : null}
                  </>
                )}

                <button
                  type="button"
                  onClick={newConversation}
                  disabled={!isActive}
                  className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  New conversation
                </button>
              </div>

              <p className="max-w-md text-center text-sm text-slate-400">{statusHint}</p>

              {isActive ? (
                <>
                  <SpeakControls
                    startDisabled={startSpeakingDisabled}
                    stopDisabled={stopSpeakingDisabled}
                    isListening={isListening}
                    onStartSpeaking={() => void startListening()}
                    onStopSpeaking={() => void stopListening()}
                  />
                  {canSendTranscript ? (
                    <button
                      type="button"
                      onClick={() => void sendTranscript()}
                      className="cursor-pointer rounded-xl bg-emerald-500 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Send question
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

"use client";

import { SpeakControls } from "@/components/PushToTalkButton";
import { StatusBar } from "@/components/StatusBar";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { SUPPORT_TOPICS } from "@voice-support/shared";

export default function HomePage() {
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
    isActive && transcriptReady && userText.trim().length > 0 && !isBusy && !isListening;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
          Phase 4
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Voice Support (Phase 4)
        </h1>
        <p className="text-sm text-slate-600">
          Pick a support topic and your name, then start a call — the agent
          greets you, then answers in voice only (not shown on screen).
        </p>
      </header>

      <StatusBar status={status} isActive={isActive} topicLabel={topicLabel} />

      <TranscriptPanel
        userText={userText}
        editable={isActive}
        transcriptReady={transcriptReady}
        onChange={setUserTextFromUi}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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

      <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Settings
        </summary>
        <div className="mt-4 space-y-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Your name (for greeting)</span>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="e.g. Surbhi"
              className="rounded-lg border border-slate-300 px-3 py-2"
              disabled={isActive || isStarting}
              aria-label="Your name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Support topic</span>
            <select
              value={topicId}
              onChange={(event) => setTopicId(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
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
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Language (speech + replies)</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
              disabled={isActive || isStarting}
            >
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (India)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Spoken reply voice (Piper)</span>
            <select
              value={voiceId}
              onChange={(event) => setVoiceId(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
              disabled={isStarting || voiceOptions.length === 0}
            >
              {voiceOptions.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-500">
            Choose topic and language before starting. To switch topic, end the
            session, pick another topic, then start again. Piper voices require
            services/speech — see README.
          </p>
        </div>
      </details>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isActive ? (
            <button
              type="button"
              onClick={() => void startSession()}
              disabled={isStarting}
              className="cursor-pointer rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStarting
                ? startingStep === "microphone"
                  ? "Allow microphone…"
                  : "Checking services…"
                : "Start conversation"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={stopSession}
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                End session
              </button>
              {isBusy ? (
                <button
                  type="button"
                  onClick={stopReply}
                  className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
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
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            New conversation
          </button>
        </div>

        {!isActive ? (
          <p className="max-w-md text-center text-xs text-slate-500">
            Step 1: Start services/ollama and services/speech (see README), then click{" "}
            <strong>Start conversation</strong>.
          </p>
        ) : (
          <>
            <p className="max-w-md text-center text-xs text-slate-500">
              {status === "greeting"
                ? "Agent is greeting you…"
                : isTranscribing
                ? "Transcribing your speech…"
                : isBusy
                  ? "Click Stop reply to interrupt, then ask your next question."
                  : isListening
                    ? "Speak clearly, then click Stop. Check the text, edit if needed, then Send question."
                    : transcriptReady
                      ? "Transcript captured. The app auto-sends high-confidence text; edit and use Send question if you want to retry manually."
                      : "Click Start speaking, then Stop when you finish your question."}
            </p>
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
                className="cursor-pointer rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Send question
              </button>
            ) : null}
          </>
        )}
      </div>

      <footer className="text-center text-xs text-slate-500">
        Requires services/ollama and services/speech locally. See README for setup.
      </footer>
    </main>
  );
}

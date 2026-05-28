"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioRecorder, isStreamActive } from "@/lib/audioCapture";
import { playAudioBuffer, stopPlayback } from "@/lib/audioPlayback";
import {
  checkTopicGuard,
  DEFAULT_TOPIC_ID,
  getTopic,
  type ChatErrorBody,
  type ChatMessage,
  type ChatRequestBody,
  type ChatResponseBody,
  type SessionStatus,
} from "@voice-support/shared";
import {
  ACK_PLAYBACK_DELAY_MS,
  buildGreeting,
  isAckEnabled,
  isGreetingEnabled,
  pickAckPhrase,
} from "@/lib/greeting";
import { debugError, debugLog, debugWarn, isVoiceDebugEnabled } from "@/lib/debug";
import { synthesizeSpeech, transcribeAudio } from "@/lib/speechClient";
import { toSpokenText } from "@/lib/spokenText";
import { hasPriorConversation } from "@/lib/conversationContext";
import {
  INCOMPLETE_UTTERANCE_MESSAGE,
  isLikelyIncompleteUtterance,
  sanitizeConversationHistory,
} from "@/lib/utteranceValidation";
import {
  DEFAULT_PIPER_VOICE,
  FALLBACK_PIPER_VOICES,
  MAX_HISTORY_TURNS,
  filterPiperVoicesForLanguage,
  getOllamaServiceUrl,
  getSpeechServiceUrl,
  pickDefaultPiperVoice,
} from "@/lib/voiceConstants";

interface PiperVoiceOption {
  id: string;
  name: string;
  lang: string;
}

function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_HISTORY_TURNS * 2);
}

export function useVoiceSession() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [isActive, setIsActive] = useState(false);
  const [userText, setUserText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState("en-US");
  const [topicId, setTopicIdState] = useState(DEFAULT_TOPIC_ID);
  const [customerName, setCustomerName] = useState("");
  const [voiceId, setVoiceId] = useState(DEFAULT_PIPER_VOICE);
  const [allVoices, setAllVoices] = useState<PiperVoiceOption[]>([
    ...FALLBACK_PIPER_VOICES,
  ]);
  const [isStarting, setIsStarting] = useState(false);
  const [startingStep, setStartingStep] = useState<"checking" | "microphone" | null>(
    null,
  );
  const [transcriptReady, setTranscriptReady] = useState(false);
  const [sttConfidence, setSttConfidence] = useState<"high" | "medium" | "low" | null>(
    null,
  );

  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef(new AudioRecorder());
  const isProcessingRef = useRef(false);
  const sessionStoppedRef = useRef(false);
  const replyCancelledRef = useRef(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const callSessionIdRef = useRef<string | null>(null);

  const clearConversationMemory = useCallback(() => {
    setMessages([]);
    callSessionIdRef.current = null;
  }, []);

  const setStatusWithLog = useCallback((next: SessionStatus) => {
    setStatus((prev) => {
      if (prev !== next) {
        debugLog("Session", `Status: ${prev} → ${next}`);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    debugLog("Session", "Voice session hook mounted (Phase 2)", {
      debugEnabled: isVoiceDebugEnabled(),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch(`${getSpeechServiceUrl()}/voices`)
      .then((response) => response.json())
      .then((data: { voices?: PiperVoiceOption[] }) => {
        if (cancelled || !data.voices?.length) {
          return;
        }
        setAllVoices(data.voices);
        setVoiceId((current) => current || pickDefaultPiperVoice(data.voices!, language));
      })
      .catch(() => {
        debugWarn("TTS", "Could not load voices from API — using fallback list");
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const voiceOptions = useMemo(
    () => filterPiperVoicesForLanguage(allVoices, language),
    [allVoices, language],
  );

  const topicLabel = useMemo(() => getTopic(topicId)?.label ?? "Support", [topicId]);

  const setLanguageAndVoice = useCallback(
    (nextLanguage: string) => {
      setLanguage(nextLanguage);
      setVoiceId(pickDefaultPiperVoice(allVoices, nextLanguage));
    },
    [allVoices],
  );

  useEffect(() => {
    const stillValid = voiceOptions.some((voice) => voice.id === voiceId);
    if (!stillValid && voiceOptions.length > 0) {
      setVoiceId(pickDefaultPiperVoice(voiceOptions, language));
    }
  }, [language, voiceId, voiceOptions]);

  const clearError = useCallback(() => setError(null), []);

  const resetTranscript = useCallback(() => {
    setUserText("");
    setTranscriptReady(false);
    setSttConfidence(null);
  }, []);

  const setTopicId = useCallback(
    (nextTopicId: string) => {
      setTopicIdState(nextTopicId);
      if (!isActive) {
        clearConversationMemory();
        resetTranscript();
      }
    },
    [clearConversationMemory, isActive, resetTranscript],
  );

  const speakPhrase = useCallback(
    async (text: string, signal?: AbortSignal) => {
      const buffer = await synthesizeSpeech(text, voiceId, language, signal);
      if (replyCancelledRef.current || sessionStoppedRef.current) {
        return;
      }
      await playAudioBuffer(buffer);
    },
    [language, voiceId],
  );

  const playAcknowledgment = useCallback(
    async (signal?: AbortSignal) => {
      if (!isAckEnabled()) {
        return;
      }
      try {
        await speakPhrase(pickAckPhrase(), signal);
      } catch (err) {
        if (
          replyCancelledRef.current ||
          sessionStoppedRef.current ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        debugWarn("Session", "Ack playback failed", { err });
      }
    },
    [speakPhrase],
  );

  const setUserTextFromUi = useCallback((text: string) => {
    setUserText(text);
    if (text.trim()) {
      setTranscriptReady(true);
    }
  }, []);

  const sendToAgent = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      replyCancelledRef.current = false;
      setTranscriptReady(false);
      setStatusWithLog("thinking");
      setUserText(text.trim());

      const cleanedHistory = sanitizeConversationHistory(messages);
      const nextMessages: ChatMessage[] = trimHistory([
        ...cleanedHistory,
        { role: "user", content: text.trim() },
      ]);

      const controller = new AbortController();
      fetchAbortRef.current = controller;

      const trimmedText = text.trim();
      const topic = getTopic(topicId);
      const instantOffTopic =
        topic !== undefined && checkTopicGuard(trimmedText, topic) === "off_topic";

      let ackTimer: ReturnType<typeof setTimeout> | null = null;
      if (isAckEnabled() && !instantOffTopic) {
        ackTimer = setTimeout(() => {
          void playAcknowledgment(controller.signal);
        }, ACK_PLAYBACK_DELAY_MS);
      }

      try {
        const response = await fetch(`${getOllamaServiceUrl()}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: nextMessages,
            language,
            topicId,
          } satisfies ChatRequestBody),
        });

        if (replyCancelledRef.current || sessionStoppedRef.current) {
          return;
        }

        if (ackTimer !== null) {
          clearTimeout(ackTimer);
          ackTimer = null;
        }

        const data = (await response.json()) as ChatResponseBody | ChatErrorBody;

        if (!response.ok) {
          const message =
            "error" in data && data.error
              ? data.error
              : "Something went wrong while talking to the AI.";
          throw new Error(message);
        }

        const reply = "reply" in data ? data.reply : "";
        if (!reply) {
          throw new Error("The AI returned an empty reply.");
        }

        if (replyCancelledRef.current || sessionStoppedRef.current) {
          return;
        }

        const isRefusal = "refusal" in data && data.refusal === true;
        if (isRefusal) {
          stopPlayback();
        }

        setMessages(
          trimHistory([...nextMessages, { role: "assistant", content: reply }]),
        );

        setStatusWithLog("speaking");

        const spokenReply = toSpokenText(reply);
        const audioBuffer = await synthesizeSpeech(
          spokenReply,
          voiceId,
          language,
          controller.signal,
        );

        if (replyCancelledRef.current || sessionStoppedRef.current) {
          return;
        }

        await playAudioBuffer(audioBuffer);

        if (sessionStoppedRef.current || replyCancelledRef.current) {
          return;
        }

        setStatusWithLog("idle");
      } catch (err) {
        if (
          sessionStoppedRef.current ||
          replyCancelledRef.current ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        debugError("Chat", "Request failed", { message, err });
        setError(message);
        setStatusWithLog("error");
      } finally {
        if (ackTimer !== null) {
          clearTimeout(ackTimer);
        }
        fetchAbortRef.current = null;
        isProcessingRef.current = false;
      }
    },
    [language, messages, playAcknowledgment, setStatusWithLog, topicId, voiceId],
  );

  const stopReply = useCallback(() => {
    if (
      status !== "greeting" &&
      status !== "thinking" &&
      status !== "speaking" &&
      !isProcessingRef.current
    ) {
      return;
    }

    replyCancelledRef.current = true;
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    stopPlayback();
    recorderRef.current.abort();
    isProcessingRef.current = false;
    resetTranscript();
    clearError();
    setStatusWithLog("idle");
  }, [clearError, resetTranscript, setStatusWithLog, status]);

  const startSession = useCallback(async () => {
    if (isStarting || isActive) {
      return;
    }

    clearError();
    setIsStarting(true);
    setStartingStep("checking");

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

      let ollamaHealth: { ollama?: boolean; ollamaError?: string } = {};
      let speechHealth: {
        ok?: boolean;
        tts?: string;
        speechError?: string;
      } = {};

      try {
        const [ollamaRes, speechRes] = await Promise.all([
          fetch(`${getOllamaServiceUrl()}/health`, { signal: controller.signal }),
          fetch(`${getSpeechServiceUrl()}/health`, { signal: controller.signal }),
        ]);
        ollamaHealth = await ollamaRes.json();
        speechHealth = await speechRes.json();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError(
            "Service check timed out. Confirm Ollama (services/ollama) and speech (services/speech) are running.",
          );
        } else {
          setError("Could not check services. Is the app running on the correct port?");
        }
        setStatusWithLog("error");
        return;
      } finally {
        window.clearTimeout(timeoutId);
      }

      const speechOk =
        speechHealth.ok === true && speechHealth.tts !== "models_missing";

      if (!ollamaHealth.ollama) {
        setError(
          ollamaHealth.ollamaError ||
            "Ollama daemon not running. See services/ollama README (npm run daemon:serve).",
        );
        setStatusWithLog("error");
        return;
      }

      if (!speechOk) {
        setError(
          speechHealth.speechError ||
            "Speech engine not running. See services/speech README.",
        );
        setStatusWithLog("error");
        return;
      }

      setStartingStep("microphone");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        micStreamRef.current = stream;
      } catch {
        setError(
          "Microphone permission denied. Click the mic icon in the address bar, allow access, then try again.",
        );
        setStatusWithLog("error");
        return;
      }

      setIsActive(true);
      sessionStoppedRef.current = false;
      clearConversationMemory();
      callSessionIdRef.current = crypto.randomUUID();
      resetTranscript();

      if (isGreetingEnabled()) {
        setStatusWithLog("greeting");
        try {
          const greeting = buildGreeting({ customerName, topicId });
          await speakPhrase(greeting);
        } catch (err) {
          if (
            !sessionStoppedRef.current &&
            !(err instanceof DOMException && err.name === "AbortError")
          ) {
            debugWarn("Session", "Greeting playback failed", { err });
          }
        }
      }

      if (!sessionStoppedRef.current) {
        setStatusWithLog("idle");
      }
    } finally {
      setIsStarting(false);
      setStartingStep(null);
    }
  }, [
    clearConversationMemory,
    clearError,
    customerName,
    isActive,
    isStarting,
    resetTranscript,
    setStatusWithLog,
    speakPhrase,
    topicId,
  ]);

  const stopSession = useCallback(() => {
    sessionStoppedRef.current = true;
    replyCancelledRef.current = true;
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    recorderRef.current.abort();
    stopPlayback();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    isProcessingRef.current = false;
    setIsActive(false);
    setStatusWithLog("idle");
    clearError();
    clearConversationMemory();
    resetTranscript();
  }, [clearConversationMemory, clearError, resetTranscript, setStatusWithLog]);

  const newConversation = useCallback(() => {
    replyCancelledRef.current = true;
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    stopPlayback();
    recorderRef.current.abort();
    isProcessingRef.current = false;
    clearConversationMemory();
    callSessionIdRef.current = crypto.randomUUID();
    resetTranscript();
    clearError();
    setStatusWithLog("idle");
  }, [clearConversationMemory, clearError, resetTranscript, setStatusWithLog]);

  const ensureMicStream = useCallback(async (): Promise<MediaStream> => {
    const existing = micStreamRef.current;
    if (existing && isStreamActive(existing)) {
      return existing;
    }

    debugLog("Session", "Re-acquiring microphone stream");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    micStreamRef.current = stream;
    return stream;
  }, []);

  const startListening = useCallback(async () => {
    if (
      !isActive ||
      isProcessingRef.current ||
      status === "listening" ||
      status === "greeting"
    ) {
      return;
    }

    clearError();
    resetTranscript();
    replyCancelledRef.current = false;

    try {
      const stream = await ensureMicStream();
      await recorderRef.current.start(stream);
      setStatusWithLog("listening");
    } catch (err) {
      debugWarn("STT", "Could not start recording", { err });
      const message =
        err instanceof Error
          ? err.message
          : "Could not start recording. Try again.";
      setError(message);
      setStatusWithLog("error");
    }
  }, [clearError, ensureMicStream, isActive, resetTranscript, setStatusWithLog, status]);

  const stopListening = useCallback(async () => {
    if (status !== "listening") {
      return;
    }

    setTranscriptReady(false);
    setSttConfidence(null);
    setStatusWithLog("thinking");

    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const audioBlob = await recorderRef.current.stop();

      if (audioBlob.size === 0) {
        setError("No audio captured. Check your microphone and try again.");
        setStatusWithLog("error");
        return;
      }

      const { transcript, confidence } = await transcribeAudio(
        audioBlob,
        language,
        controller.signal,
        { topicId },
      );

      if (replyCancelledRef.current || sessionStoppedRef.current) {
        return;
      }

      setUserText(transcript);
      setSttConfidence(confidence);
      setTranscriptReady(true);
      setStatusWithLog("idle");

      if (
        isLikelyIncompleteUtterance(transcript, {
          hasPriorTurns: hasPriorConversation(messages),
        })
      ) {
        setError(INCOMPLETE_UTTERANCE_MESSAGE);
        setStatusWithLog("error");
        return;
      }

      if (confidence === "low") {
        setError(
          "Speech recognition may be inaccurate. Check the text below, fix any mistakes, then click Send question.",
        );
        return;
      }

      // Auto-send confident utterances so the flow is speak -> transcript -> reply.
      await sendToAgent(transcript);
    } catch (err) {
      if (
        replyCancelledRef.current ||
        sessionStoppedRef.current ||
        (err instanceof DOMException && err.name === "AbortError")
      ) {
        return;
      }

      const message =
        err instanceof Error ? err.message : "Speech-to-text failed.";
      setError(message);
      setStatusWithLog("error");
    } finally {
      if (fetchAbortRef.current === controller) {
        fetchAbortRef.current = null;
      }
    }
  }, [language, messages, sendToAgent, setStatusWithLog, status, topicId]);

  const sendTranscript = useCallback(async () => {
    const text = userText.trim();
    if (!text || isProcessingRef.current) {
      return;
    }
    clearError();
    await sendToAgent(text);
  }, [clearError, sendToAgent, userText]);

  return {
    status,
    isActive,
    userText,
    error,
    language,
    topicId,
    topicLabel,
    customerName,
    setCustomerName,
    setTopicId,
    voiceId,
    voiceOptions,
    isStarting,
    startingStep,
    setLanguage: setLanguageAndVoice,
    setVoiceId,
    startSession,
    stopSession,
    stopReply,
    newConversation,
    startListening,
    stopListening,
    sendTranscript,
    transcriptReady,
    sttConfidence,
    setUserTextFromUi,
    clearError,
  };
}

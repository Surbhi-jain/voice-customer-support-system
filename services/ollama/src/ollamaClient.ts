import { OLLAMA_BASE_URL, OLLAMA_MODEL, buildSystemPrompt } from "./constants";
import { debugError, debugLog } from "./debug";
import type { ChatMessage } from "@voice-support/shared";

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

export async function chatWithOllama(
  messages: ChatMessage[],
  speechLang = "en-US",
  topicId?: string,
  knowledgeContext?: string,
  conversationSummary?: string,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(
    speechLang,
    topicId,
    knowledgeContext,
    conversationSummary,
  );
  const payload = {
    model: OLLAMA_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: false,
  };

  debugLog("Ollama", "Request", {
    url: `${OLLAMA_BASE_URL}/api/chat`,
    model: OLLAMA_MODEL,
    speechLang,
    topicId,
    knowledgeContextLength: knowledgeContext?.length ?? 0,
    messageCount: messages.length,
    messages: payload.messages,
  });

  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    debugError("Ollama", "Connection failed", { err });
    throw new Error(
      "Cannot reach Ollama. Start it with: ollama serve (and run: ollama pull llama3.2)",
    );
  }

  const elapsedMs = Date.now() - startedAt;

  if (!response.ok) {
    const body = await response.text();
    debugError("Ollama", "HTTP error", {
      status: response.status,
      body,
      elapsedMs,
    });

    if (response.status === 404 && body.includes("model")) {
      throw new Error(
        `Model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}`,
      );
    }

    throw new Error(`Ollama error (${response.status}): ${body || "Unknown error"}`);
  }

  const data = (await response.json()) as OllamaChatResponse;
  const reply = data.message?.content?.trim();

  debugLog("Ollama", "Response", {
    elapsedMs,
    replyLength: reply?.length ?? 0,
    reply,
  });

  if (!reply) {
    debugError("Ollama", "Empty reply body", { data });
    throw new Error("Ollama returned an empty reply.");
  }

  return reply;
}

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { processTopicScopedChat } from "./chatPipeline";
import { OLLAMA_BASE_URL } from "./constants";
import { debugError, debugLog, debugWarn } from "./debug";
import {
  DEFAULT_TOPIC_ID,
  isValidTopicId,
  type ChatMessage,
  type ChatRequestBody,
} from "@voice-support/shared";
import { sanitizeConversationHistory } from "./utteranceValidation";

const app = new Hono();

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
app.use(
  "/*",
  cors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

function isValidMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== "object") {
    return false;
  }
  const candidate = message as ChatMessage;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

app.get("/health", async (c) => {
  let ollama = false;
  let ollamaError = "";

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    ollama = response.ok;
    if (!response.ok) {
      ollamaError = `Ollama returned ${response.status}`;
    }
  } catch {
    ollamaError =
      "Cannot reach Ollama daemon. From services/ollama run: npm run daemon:serve";
  }

  return c.json({
    ok: ollama,
    ollama,
    ollamaError: ollama ? "" : ollamaError,
  });
});

app.post("/chat", async (c) => {
  const startedAt = Date.now();

  try {
    const body = (await c.req.json()) as ChatRequestBody;
    const topicId = body.topicId?.trim() || DEFAULT_TOPIC_ID;

    debugLog("API", "POST /chat received", {
      language: body.language,
      topicId,
      rawMessageCount: body.messages?.length ?? 0,
    });

    if (!isValidTopicId(topicId)) {
      return c.json({ error: `Invalid support topic: ${topicId}` }, 400);
    }

    if (!body?.messages || !Array.isArray(body.messages)) {
      debugWarn("API", "Invalid request — missing messages array");
      return c.json({ error: "Invalid request: messages array is required." }, 400);
    }

    const validMessages = body.messages.filter(isValidMessage);
    const messages = sanitizeConversationHistory(validMessages);

    if (messages.length === 0) {
      return c.json({ error: "Please provide at least one user message." }, 400);
    }

    const { reply, refusal } = await processTopicScopedChat(
      messages,
      body.language ?? "en-US",
      topicId,
    );

    debugLog("API", "POST /chat success", {
      elapsedMs: Date.now() - startedAt,
      replyLength: reply.length,
      refusal,
    });

    return c.json({ reply, refusal });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get a reply from Ollama.";

    debugError("API", "POST /chat failed", {
      elapsedMs: Date.now() - startedAt,
      message,
      error,
    });

    return c.json({ error: message }, 503);
  }
});

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Ollama chat API listening on http://localhost:${info.port}`);
});

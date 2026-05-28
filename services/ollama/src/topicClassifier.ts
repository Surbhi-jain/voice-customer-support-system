import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "./constants";
import { debugLog, debugWarn } from "./debug";
import type { SupportTopic } from "@voice-support/shared";

export type TopicClassification = "on_topic" | "off_topic";

export function isTopicStrictMode(): boolean {
  const value = process.env.TOPIC_STRICT_MODE ?? "true";
  return value.toLowerCase() !== "false" && value !== "0";
}

export async function classifyUserMessage(
  userText: string,
  topic: SupportTopic,
): Promise<TopicClassification> {
  const prompt = `You classify whether a user question belongs to a single support topic.

Topic: ${topic.label}
Scope: ${topic.scopeSummary}

User question: "${userText.replace(/"/g, "'")}"

Reply with exactly one word: ON_TOPIC or OFF_TOPIC
- ON_TOPIC if the question is about this topic or a reasonable follow-up in the same domain.
- OFF_TOPIC if it is about another industry, unrelated trivia, or a different support line.`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      debugWarn("TopicClassifier", "HTTP error — treating as ambiguous/on_topic", {
        status: response.status,
      });
      return "on_topic";
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const raw = data.message?.content?.trim().toUpperCase() ?? "";

    debugLog("TopicClassifier", "Result", { topicId: topic.id, raw });

    if (raw.includes("OFF_TOPIC")) {
      return "off_topic";
    }
    if (raw.includes("ON_TOPIC")) {
      return "on_topic";
    }

    return "on_topic";
  } catch (error) {
    debugWarn("TopicClassifier", "Failed — defaulting to on_topic", { error });
    return "on_topic";
  }
}

import type { ChatMessage } from "@voice-support/shared";

export function latestUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].content.trim();
    }
  }
  return "";
}

export function hasPriorConversation(messages: ChatMessage[]): boolean {
  return messages.some((message) => message.role === "assistant");
}

/**
 * Combine recent turns so KB retrieval and guards understand follow-ups
 * ("tell me more", "what about the spices", "and the repo rate").
 */
export function buildRetrievalQuery(messages: ChatMessage[]): string {
  const current = latestUserMessage(messages);
  if (!current || !hasPriorConversation(messages)) {
    return current;
  }

  let lastAssistant = "";
  const priorUserQuestions: string[] = [];

  for (let i = messages.length - 2; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role === "assistant" && !lastAssistant) {
      lastAssistant = message.content.trim().slice(0, 400);
    } else if (message.role === "user") {
      priorUserQuestions.unshift(message.content.trim());
      if (priorUserQuestions.length >= 2) {
        break;
      }
    }
  }

  const parts: string[] = [];
  if (priorUserQuestions.length > 0) {
    parts.push(`Earlier user questions: ${priorUserQuestions.join(" | ")}`);
  }
  if (lastAssistant) {
    parts.push(`Last assistant reply: ${lastAssistant}`);
  }
  parts.push(`Current user message: ${current}`);

  return parts.join("\n");
}

/** Short recap injected into the system prompt for multi-turn voice chats */
export function buildConversationSummary(messages: ChatMessage[]): string {
  if (!hasPriorConversation(messages) || messages.length <= 1) {
    return "";
  }

  const recent = messages.slice(-8);
  return recent
    .map((message) => {
      const label = message.role === "user" ? "User" : "Assistant";
      return `${label}: ${message.content.trim()}`;
    })
    .join("\n");
}

/**
 * Words that strongly suggest the user was cut off mid-sentence.
 * Only articles, prepositions, possessives, and conjunctions — NOT verbs like "is".
 * e.g. blocked: "capital of", "status of my" | allowed: "what time it is", "what is AI"
 */
const INCOMPLETE_ENDINGS = new Set([
  "a",
  "an",
  "the",
  "my",
  "your",
  "our",
  "their",
  "this",
  "that",
  "of",
  "for",
  "to",
  "in",
  "on",
  "at",
  "with",
  "about",
  "from",
  "by",
  "and",
  "or",
  "but",
  "how", // e.g. "hello how"
  "please",
]);

const TRAILING_FRAGMENT_ENDINGS = new Set([
  "of",
  "for",
  "to",
  "in",
  "on",
  "at",
  "with",
  "about",
  "from",
  "by",
]);

export function isLikelyIncompleteUtterance(
  text: string,
  options?: { hasPriorTurns?: boolean },
): boolean {
  const trimmed = text.trim();

  if (!trimmed) {
    return true;
  }

  if (/[.!?]$/.test(trimmed)) {
    return false;
  }

  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const lastWord = words[words.length - 1]?.replace(/[^\w]/g, "") ?? "";

  // Short follow-ups in an ongoing chat ("tell me more", "what about that") are valid
  if (options?.hasPriorTurns && words.length <= 10) {
    if (words.length <= 3 && TRAILING_FRAGMENT_ENDINGS.has(lastWord)) {
      return true;
    }
    return false;
  }

  return INCOMPLETE_ENDINGS.has(lastWord);
}

export const INCOMPLETE_UTTERANCE_MESSAGE =
  "That sounds incomplete. Hold Talk a bit longer, finish your full question, then release.";

interface HistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Remove cut-off user messages and their replies so the AI focuses on complete turns. */
export function sanitizeConversationHistory<T extends HistoryMessage>(
  messages: T[],
): T[] {
  const result: T[] = [];
  let skipNextAssistant = false;

  for (const message of messages) {
    if (message.role === "user") {
      const hasPriorTurns = result.some((entry) => entry.role === "assistant");
      if (isLikelyIncompleteUtterance(message.content, { hasPriorTurns })) {
        skipNextAssistant = true;
        continue;
      }
      skipNextAssistant = false;
      result.push(message);
    } else if (message.role === "assistant") {
      if (skipNextAssistant) {
        skipNextAssistant = false;
        continue;
      }
      result.push(message);
    }
  }

  return result;
}

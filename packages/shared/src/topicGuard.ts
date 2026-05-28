import type { SupportTopic } from "./topics";

export type TopicGuardResult = "on_topic" | "off_topic" | "ambiguous";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, " ");
}

function containsPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = phrase.toLowerCase().trim();
  if (!normalizedPhrase) return false;
  if (normalizedPhrase.includes(" ")) {
    return text.includes(normalizedPhrase);
  }
  const pattern = new RegExp(`\\b${normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  return pattern.test(text);
}

export function checkTopicGuard(userText: string, topic: SupportTopic): TopicGuardResult {
  const text = normalize(userText);
  if (!text.trim()) {
    return "ambiguous";
  }

  for (const phrase of topic.antiKeywords) {
    if (containsPhrase(text, phrase)) {
      return "off_topic";
    }
  }

  let keywordHits = 0;
  for (const phrase of topic.keywords) {
    if (containsPhrase(text, phrase)) {
      keywordHits += 1;
    }
  }

  if (keywordHits > 0) {
    return "on_topic";
  }

  return "ambiguous";
}

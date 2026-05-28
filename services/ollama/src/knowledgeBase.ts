import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTopic, isValidTopicId } from "@voice-support/shared";
import { debugLog } from "./debug";
import { isOpenKnowledgeTopic } from "./openTopics";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface KnowledgeChunk {
  title: string;
  body: string;
  source: string;
}

export interface KnowledgeRetrievalResult {
  chunks: KnowledgeChunk[];
  formattedContext: string;
  hasRelevantMatch: boolean;
}

export const KNOWLEDGE_BASE_NO_MATCH_REPLY =
  "I do not have that information in our knowledge base. Please ask about something we cover for this support topic, or change the Support topic in Settings and start a new conversation.";

const KNOWLEDGE_BASE_DIR =
  process.env.KNOWLEDGE_BASE_DIR ?? path.join(__dirname, "../knowledge-base");
const MIN_SCORE_THRESHOLD = 1;
const DEFAULT_MAX_CHUNKS = 4;
const OPEN_TOPIC_MIN_SCORE = 1;

const topicCache = new Map<string, KnowledgeChunk[]>();
const intentTokenCache = new Map<string, Set<string>>();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function getTopicIntentTokens(topicId: string): Set<string> {
  const cached = intentTokenCache.get(topicId);
  if (cached) {
    return cached;
  }

  const topic = getTopic(topicId);
  const tokens = new Set<string>(["help", "question", "issue", "problem"]);

  if (topic) {
    for (const keyword of topic.keywords) {
      for (const token of tokenize(keyword)) {
        tokens.add(token);
      }
    }
  }

  intentTokenCache.set(topicId, tokens);
  return tokens;
}

function isTopicIntent(topicId: string, queryTokens: string[]): boolean {
  const intentTokens = getTopicIntentTokens(topicId);
  return queryTokens.some((token) => intentTokens.has(token));
}

function filterChunksForTopic(topicId: string, chunks: KnowledgeChunk[]): KnowledgeChunk[] {
  if (isOpenKnowledgeTopic(topicId)) {
    return chunks.filter((chunk) => !isMetaChunk(chunk));
  }
  return chunks.filter((chunk) => !isMetaChunk(chunk));
}

export function chunkMarkdown(text: string, sourceFile: string): KnowledgeChunk[] {
  const sections = text.split(/^##\s+/m).filter(Boolean);
  const chunks: KnowledgeChunk[] = [];

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const title = lines[0]?.trim() ?? "General";
    const body = lines.slice(1).join("\n").trim();
    if (body) {
      chunks.push({ title, body, source: sourceFile });
    }
  }

  if (chunks.length === 0 && text.trim()) {
    chunks.push({ title: "General", body: text.trim(), source: sourceFile });
  }

  return chunks;
}

export function loadTopicChunks(topicId: string): KnowledgeChunk[] {
  if (!isValidTopicId(topicId)) {
    return [];
  }

  const cached = topicCache.get(topicId);
  if (cached) {
    return cached;
  }

  const topicDir = path.join(KNOWLEDGE_BASE_DIR, topicId);
  if (!fs.existsSync(topicDir)) {
    debugLog("KnowledgeBase", "Topic folder missing", { topicDir });
    topicCache.set(topicId, []);
    return [];
  }

  const files = fs
    .readdirSync(topicDir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const allChunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const filePath = path.join(topicDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    allChunks.push(...chunkMarkdown(content, file));
  }

  topicCache.set(topicId, allChunks);
  debugLog("KnowledgeBase", "Loaded topic", { topicId, chunkCount: allChunks.length });

  return allChunks;
}

const META_CHUNK_TITLE =
  /how to ask|what this line|if your dish|questions not|help for|not listed|help when/i;

function isMetaChunk(chunk: KnowledgeChunk): boolean {
  return META_CHUNK_TITLE.test(chunk.title);
}

function scoreChunk(
  chunk: KnowledgeChunk,
  queryTokens: string[],
  userQuery: string,
): number {
  const queryLower = userQuery.toLowerCase();
  const chunkText = `${chunk.title} ${chunk.body}`.toLowerCase();
  const titleLower = chunk.title.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (chunkText.includes(token)) {
      score += 1;
    }
    if (titleLower.includes(token)) {
      score += 5;
    }
  }

  if (titleLower.length > 3 && queryLower.includes(titleLower)) {
    score += 20;
  }

  const titleWords = titleLower.split(/\s+/).filter((word) => word.length > 2);
  if (titleWords.length > 0) {
    const titleHits = titleWords.filter((word) => queryLower.includes(word)).length;
    if (titleHits >= Math.min(2, titleWords.length) || titleHits === titleWords.length) {
      score += 15;
    }
  }

  if (isMetaChunk(chunk)) {
    score -= 10;
  }

  if (chunk.source === "recipes.md" && /\b(recipe|make|cook|prepare|dish)\b/.test(queryLower)) {
    score += 4;
  }
  if (chunk.source === "spices.md" && /\b(spice|masala|turmeric|cumin|coriander|chili|garam)\b/.test(queryLower)) {
    score += 6;
  }
  if (chunk.source === "ingredients.md" && /\b(ingredient|substitute|cream|yogurt|paneer|oil|flour)\b/.test(queryLower)) {
    score += 5;
  }
  if (chunk.source === "techniques.md" && /\b(technique|how to cook|temper|pressure|steam|fry|simmer)\b/.test(queryLower)) {
    score += 5;
  }
  if (
    chunk.source === "rates.md" &&
    /\b(repo|reverse repo|interest rate|base rate|apy|emi|benchmark|policy rate)\b/.test(queryLower)
  ) {
    score += 8;
  }
  if (
    chunk.source === "transfers.md" &&
    /\b(upi|neft|rtgs|imps|transfer|wire|swift|payment)\b/.test(queryLower)
  ) {
    score += 8;
  }
  if (
    chunk.source === "loans.md" &&
    /\b(loan|mortgage|emi|personal loan|home loan|car loan|credit score|cibil)\b/.test(queryLower)
  ) {
    score += 8;
  }
  if (
    chunk.source === "faqs.md" &&
    /\b(check-in|checkout|housekeeping|towel|wifi|breakfast|parking|concierge)\b/.test(queryLower)
  ) {
    score += 6;
  }
  if (
    chunk.source === "policies.md" &&
    /\b(policy|cancellation|pet|smoking|deposit|fee|late checkout)\b/.test(queryLower)
  ) {
    score += 6;
  }
  if (
    chunk.source === "orders.md" &&
    /\b(order|tracking|shipping|delivery|address|package)\b/.test(queryLower)
  ) {
    score += 6;
  }
  if (
    chunk.source === "returns.md" &&
    /\b(return|refund|exchange|damaged|wrong item)\b/.test(queryLower)
  ) {
    score += 6;
  }
  if (
    chunk.source === "flights.md" &&
    /\b(flight|booking|change|cancel|delay|seat|boarding)\b/.test(queryLower)
  ) {
    score += 6;
  }
  if (
    chunk.source === "baggage.md" &&
    /\b(baggage|luggage|carry-on|checked bag|lost bag)\b/.test(queryLower)
  ) {
    score += 6;
  }
  if (
    chunk.source === "access.md" &&
    /\b(password|login|vpn|access|account locked|mfa|sso)\b/.test(queryLower)
  ) {
    score += 6;
  }
  if (
    chunk.source === "troubleshooting.md" &&
    /\b(printer|slow|crash|error|wifi|network|install|driver)\b/.test(queryLower)
  ) {
    score += 6;
  }

  return score;
}

export function retrieveKnowledge(
  topicId: string,
  userQuery: string,
  maxChunks = DEFAULT_MAX_CHUNKS,
): KnowledgeRetrievalResult {
  const allChunks = loadTopicChunks(topicId);
  const chunks = filterChunksForTopic(topicId, allChunks);
  const queryTokens = tokenize(userQuery);
  const effectiveMax = isOpenKnowledgeTopic(topicId) ? 3 : maxChunks;
  const minScore = isOpenKnowledgeTopic(topicId) ? OPEN_TOPIC_MIN_SCORE : MIN_SCORE_THRESHOLD;

  if (chunks.length === 0) {
    return { chunks: [], formattedContext: "", hasRelevantMatch: false };
  }

  if (queryTokens.length === 0) {
    const fallbackChunks = chunks.slice(0, effectiveMax);
    return {
      chunks: fallbackChunks,
      formattedContext: formatChunksForPrompt(fallbackChunks),
      hasRelevantMatch: fallbackChunks.length > 0,
    };
  }

  const scored = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, queryTokens, userQuery),
    }))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const selected = scored.map((item) => item.chunk).slice(0, effectiveMax);
  const hasRelevantMatch = selected.length > 0;

  debugLog("KnowledgeBase", "Retrieve", {
    topicId,
    queryTokens,
    matchCount: selected.length,
    titles: selected.map((c) => c.title),
  });

  return {
    chunks: selected,
    formattedContext: hasRelevantMatch ? formatChunksForPrompt(selected) : "",
    hasRelevantMatch,
  };
}

export function formatChunksForPrompt(chunks: KnowledgeChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.title} (from ${chunk.source})\n${chunk.body}`,
    )
    .join("\n\n");
}

/** Clear cache (useful in dev hot reload tests) */
export function clearKnowledgeCache(): void {
  topicCache.clear();
  intentTokenCache.clear();
}

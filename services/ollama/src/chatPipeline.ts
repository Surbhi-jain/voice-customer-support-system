import {
  buildConversationSummary,
  buildRetrievalQuery,
  latestUserMessage,
} from "./conversationContext";
import { KNOWLEDGE_BASE_NO_MATCH_REPLY, retrieveKnowledge } from "./knowledgeBase";
import { isOpenKnowledgeTopic } from "./openTopics";
import { chatWithOllama } from "./ollamaClient";
import {
  checkTopicGuard,
  getTopic,
  type ChatMessage,
} from "@voice-support/shared";
import { classifyUserMessage, isTopicStrictMode } from "./topicClassifier";
import { debugLog } from "./debug";

export interface ChatPipelineResult {
  reply: string;
  refusal: boolean;
}

export async function processTopicScopedChat(
  messages: ChatMessage[],
  speechLang: string,
  topicId: string,
): Promise<ChatPipelineResult> {
  const topic = getTopic(topicId);
  if (!topic) {
    throw new Error(`Unknown support topic: ${topicId}`);
  }

  const userText = latestUserMessage(messages);
  const retrievalQuery = buildRetrievalQuery(messages);
  const conversationSummary = buildConversationSummary(messages);
  // Guard/classifier must use the latest user utterance only. Including prior
  // assistant refusals (e.g. "hotel" from another topic line) in retrievalQuery
  // falsely triggers antiKeywords and blocks valid follow-ups after a topic switch.
  const guardResult = checkTopicGuard(userText, topic);

  debugLog("ChatPipeline", "Guard", {
    topicId,
    guardResult,
    userText,
    retrievalQuery,
    historyTurns: messages.length,
  });

  if (guardResult === "off_topic") {
    return { reply: topic.refusalScript, refusal: true };
  }

  if (guardResult === "ambiguous" && isTopicStrictMode()) {
    const classification = await classifyUserMessage(userText, topic);
    debugLog("ChatPipeline", "Classifier", { topicId, classification });

    if (classification === "off_topic") {
      return { reply: topic.refusalScript, refusal: true };
    }
  }

  const retrieval = retrieveKnowledge(topicId, retrievalQuery);

  if (isOpenKnowledgeTopic(topicId)) {
    debugLog("ChatPipeline", "Open topic mode", {
      topicId,
      userText,
      retrievalQuery,
      kbMatch: retrieval.hasRelevantMatch,
      titles: retrieval.chunks.map((c) => c.title),
    });
    const reply = await chatWithOllama(
      messages,
      speechLang,
      topicId,
      retrieval.hasRelevantMatch ? retrieval.formattedContext : undefined,
      conversationSummary,
    );
    return { reply, refusal: false };
  }

  if (!retrieval.hasRelevantMatch) {
    debugLog("ChatPipeline", "No KB match", { topicId, userText, retrievalQuery });
    return { reply: KNOWLEDGE_BASE_NO_MATCH_REPLY, refusal: false };
  }

  const reply = await chatWithOllama(
    messages,
    speechLang,
    topicId,
    retrieval.formattedContext,
    conversationSummary,
  );
  return { reply, refusal: false };
}

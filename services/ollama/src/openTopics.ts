import { SUPPORT_TOPICS } from "@voice-support/shared";

/** All support lines answer any in-scope question; KB is reference, not a hard gate */
export const OPEN_KNOWLEDGE_TOPICS = new Set(SUPPORT_TOPICS.map((topic) => topic.id));

export function isOpenKnowledgeTopic(topicId: string): boolean {
  return OPEN_KNOWLEDGE_TOPICS.has(topicId);
}

/** Fallback guidance when KB has no matching chunk */
export const OPEN_TOPIC_FALLBACK_HINT: Record<string, string> = {
  hotel:
    "If no reference above, use normal hotel and guest-service knowledge for a typical property.",
  cooking:
    "If no reference above, use normal home-cooking knowledge.",
  retail:
    "If no reference above, use normal e-commerce and retail customer-service knowledge.",
  travel:
    "If no reference above, use normal airline and travel customer-service knowledge.",
  banking:
    "If no reference above, use clear general retail banking knowledge suitable for a demo bank (no real account lookup).",
  it_helpdesk:
    "If no reference above, use normal workplace IT helpdesk knowledge (login, devices, network, software).",
};

export const OPEN_TOPIC_DEMO_NOTE: Record<string, string> = {
  hotel:
    "Demo: you cannot access real reservations or room keys; describe typical hotel procedures.",
  cooking: "",
  retail:
    "Demo: you cannot look up real order numbers; give typical steps the customer would follow.",
  travel:
    "Demo: you cannot access real bookings or PNRs; give typical airline and airport guidance.",
  banking:
    "Demo: you cannot see real balances or approve transactions; no personalized investment or tax advice.",
  it_helpdesk:
    "Demo: you cannot reset real passwords or remote into systems; give standard self-service and helpdesk steps.",
};

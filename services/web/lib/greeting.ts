import { getTopic } from "@voice-support/shared";

export function isGreetingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GREETING_ENABLED !== "false";
}

export function isAckEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ACK_ENABLED !== "false";
}

/** Delay before playing ack so instant refusals never hear "one moment". */
export const ACK_PLAYBACK_DELAY_MS = 450;

function timeOfDayLabel(hour: number): string {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Opening line when a call session starts (Phase 4). */
export function buildGreeting(options: {
  customerName?: string;
  topicId: string;
  hour?: number;
}): string {
  const name = options.customerName?.trim() || "there";
  const topic = getTopic(options.topicId);
  const lineName = topic?.label ?? "support";
  const hour = options.hour ?? new Date().getHours();
  const tod = timeOfDayLabel(hour);

  return `Hello ${name}, good ${tod}. You're through to ${lineName}. How can I help you today?`;
}

const ACK_PHRASES = [
  "Sure, one moment.",
  "Let me check that for you.",
  "One moment please.",
];

/** Short spoken acknowledgment while the full answer is prepared (Approach A). */
export function pickAckPhrase(): string {
  return ACK_PHRASES[Math.floor(Math.random() * ACK_PHRASES.length)]!;
}

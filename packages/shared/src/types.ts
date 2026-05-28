export type SessionStatus =
  | "idle"
  | "greeting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  language?: string;
  topicId?: string;
}

export interface ChatResponseBody {
  reply: string;
  /** True when the topic guard/classifier refused — client should skip "one moment" ack. */
  refusal?: boolean;
}

export interface ChatErrorBody {
  error: string;
}

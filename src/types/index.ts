export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  feedback?: Feedback;
}

export interface Correction {
  original: string;
  fixed: string;
  explanation: string;
}

export interface Feedback {
  hasError: boolean;
  corrections: Correction[];
  naturalAlternative: string | null;
  simplerExpression: string | null;
}

export interface ChatResponse {
  reply: string;
  feedback: Feedback;
}

export interface Topic {
  id: string;
  label: string;
  description: string;
  category: string;
  emoji: string;
  starterPrompt: string;
}

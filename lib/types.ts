export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title_he: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

export interface ChatStreamResponse {
  content: string;
  isComplete: boolean;
}
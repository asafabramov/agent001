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

export interface ConversationFile {
  id: string;
  conversation_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text: string | null;
  anthropic_file_id: string | null;
  created_at: string;
}

export interface MessageFile {
  id: string;
  message_id: string;
  file_id: string;
  created_at: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  preview?: string;
  error?: string;
}
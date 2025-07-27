"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationSidebar } from "./ConversationSidebar";
import { Message, Conversation } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<{
    content: string;
    isComplete: boolean;
  } | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('שגיאה בטעינת השיחות');
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('שגיאה בטעינת ההודעות');
    }
  };

  const createNewConversation = async (firstMessage: string): Promise<string> => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title_he: firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
        user_id: 'temp-user' // TODO: Replace with actual auth user
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const saveMessage = async (conversationId: string, content: string, role: 'user' | 'assistant') => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        role
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const handleSendMessage = async (messageContent: string) => {
    try {
      setIsLoading(true);
      
      let conversationId = currentConversationId;
      
      // Create new conversation if none exists
      if (!conversationId) {
        conversationId = await createNewConversation(messageContent);
        setCurrentConversationId(conversationId);
        await loadConversations();
      }

      // Save user message
      const userMessage = await saveMessage(conversationId, messageContent, 'user');
      setMessages(prev => [...prev, userMessage]);

      // Start streaming AI response
      setStreamingMessage({ content: '', isComplete: false });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setStreamingMessage(prev => prev ? { ...prev, isComplete: true } : null);
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  setStreamingMessage({ content: fullResponse, isComplete: false });
                }
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }

      // Save assistant message
      if (fullResponse) {
        const assistantMessage = await saveMessage(conversationId, fullResponse, 'assistant');
        setMessages(prev => [...prev, assistantMessage]);
      }

      setStreamingMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('שגיאה בשליחת ההודעה');
      setStreamingMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setStreamingMessage(null);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingMessage(null);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      if (currentConversationId === conversationId) {
        handleNewConversation();
      }

      await loadConversations();
      toast.success('השיחה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('שגיאה במחיקת השיחה');
    }
  };

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col"
      >
        <div className="border-b border-r p-4 bg-background/95 backdrop-blur">
          <h1 className="text-2xl font-bold hebrew text-center">
            צ&apos;אט בוט עברי
          </h1>
        </div>

        <MessageList 
          messages={messages} 
          streamingMessage={streamingMessage}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={currentConversationId ? "הקלד הודעה..." : "התחל שיחה חדשה..."}
        />
      </motion.div>
    </div>
  );
}
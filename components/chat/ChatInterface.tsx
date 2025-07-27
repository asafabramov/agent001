"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConversationSidebar } from "./ConversationSidebar";
import { MediaGallery } from "./MediaGallery";
import { Message, Conversation, FileUpload, ConversationFile } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Files } from "lucide-react";
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
  const [showMediaGallery, setShowMediaGallery] = useState(false);

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
        user_id: 'anonymous'
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

  // Handle file uploads
  const uploadFiles = async (conversationId: string, files: FileUpload[]): Promise<ConversationFile[]> => {
    const uploadedFiles: ConversationFile[] = [];
    
    for (const fileUpload of files) {
      try {
        // Update file status to uploading
        fileUpload.status = 'uploading';
        
        // Create form data
        const formData = new FormData();
        formData.append('file', fileUpload.file);
        formData.append('conversationId', conversationId);
        
        // Upload file
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'שגיאה בהעלאת הקובץ');
        }
        
        const result = await response.json();
        
        if (result.success && result.file) {
          fileUpload.status = 'completed';
          uploadedFiles.push(result.file);
        } else {
          throw new Error('שגיאה בהעלאת הקובץ');
        }
        
      } catch (error) {
        console.error('File upload error:', error);
        fileUpload.status = 'error';
        fileUpload.error = error instanceof Error ? error.message : 'שגיאה בהעלאת הקובץ';
        toast.error(`שגיאה בהעלאת ${fileUpload.file.name}: ${fileUpload.error}`);
      }
    }
    
    return uploadedFiles;
  };

  const handleSendMessage = async (messageContent: string, files?: FileUpload[]) => {
    try {
      setIsLoading(true);
      
      let conversationId = currentConversationId;
      
      // Create new conversation if none exists
      if (!conversationId) {
        const title = messageContent || (files && files.length > 0 ? `שיחה עם ${files.length} קבצים` : 'שיחה חדשה');
        conversationId = await createNewConversation(title);
        setCurrentConversationId(conversationId);
        await loadConversations();
      }

      // Upload files if any
      let uploadedFiles: ConversationFile[] = [];
      if (files && files.length > 0) {
        uploadedFiles = await uploadFiles(conversationId, files);
      }

      // Prepare message content with file information
      let fullMessageContent = messageContent;
      if (uploadedFiles.length > 0) {
        const fileDescriptions = uploadedFiles.map(file => 
          `[קובץ: ${file.file_name}]`
        ).join('\n');
        
        fullMessageContent = messageContent 
          ? `${messageContent}\n\n${fileDescriptions}`
          : fileDescriptions;
      }

      // Save user message
      const userMessage = await saveMessage(conversationId, fullMessageContent, 'user');
      setMessages(prev => [...prev, userMessage]);

      // Link files to message
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await supabase.from('message_files').insert({
            message_id: userMessage.id,
            file_id: file.id
          });
        }
      }

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
        className="flex-1 flex flex-col max-w-7xl mx-auto w-full"
      >
        <div className="border-b p-4 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="w-10"></div>
            <h1 className="text-2xl font-bold hebrew text-center">
              צ&apos;אט בוט עברי
            </h1>
            {currentConversationId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMediaGallery(true)}
                className="shrink-0"
              >
                <Files className="h-4 w-4" />
                <span className="sr-only">הצג מדיה וקבצים</span>
              </Button>
            )}
          </div>
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

      {/* Media Gallery */}
      <MediaGallery
        conversationId={currentConversationId || undefined}
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
      />
    </div>
  );
}
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  streamingMessage?: {
    content: string;
    isComplete: boolean;
  } | null;
}

export function MessageList({ messages, streamingMessage }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const debouncedScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  // Only scroll when messages change or streaming starts/completes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Debounced scroll for streaming updates
  useEffect(() => {
    if (streamingMessage?.isComplete) {
      scrollToBottom();
    } else if (streamingMessage && !streamingMessage.isComplete) {
      debouncedScroll();
    }
  }, [streamingMessage?.isComplete, streamingMessage?.content, streamingMessage, scrollToBottom, debouncedScroll]);

  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold mb-2 hebrew">ברוכים הבאים לצ&apos;אט בוט העברי</h3>
          <p className="text-muted-foreground hebrew">
            התחל שיחה חדשה על ידי כתיבת הודעה למטה
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 lg:px-8" ref={scrollAreaRef}>
      <div className="py-4 max-w-4xl mx-auto">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLatest={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {streamingMessage && (
          <StreamingMessage
            content={streamingMessage.content}
            isComplete={streamingMessage.isComplete}
          />
        )}
        
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
"use client";

import React, { useEffect, useRef } from "react";
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

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

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
    <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
      <div className="py-4">
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
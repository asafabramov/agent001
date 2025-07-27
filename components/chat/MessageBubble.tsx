"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <Card className={cn(
        "p-3 max-w-[80%] break-words",
        isUser 
          ? "bg-primary text-primary-foreground mr-auto ml-12" 
          : "bg-muted text-muted-foreground ml-auto mr-12"
      )}>
        <div className={cn(
          "text-sm leading-relaxed hebrew",
          isUser ? "text-right" : "text-right"
        )}>
          {message.content}
        </div>
        
        <div className={cn(
          "text-xs mt-2 opacity-70",
          isUser ? "text-right" : "text-right"
        )}>
          {new Date(message.created_at).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </Card>
    </motion.div>
  );
}
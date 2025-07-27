"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
}

export function StreamingMessage({ content, isComplete }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // Adjust typing speed here

      return () => clearTimeout(timer);
    }
  }, [content, currentIndex]);

  useEffect(() => {
    setCurrentIndex(0);
    setDisplayedContent("");
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 mb-4"
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <Card className="p-3 max-w-[80%] break-words bg-muted text-muted-foreground ml-auto mr-12">
        <div className="text-sm leading-relaxed hebrew text-right">
          {displayedContent}
          {!isComplete && currentIndex === content.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
              className="inline-block w-2 h-4 bg-current ml-1"
            />
          )}
        </div>
        
        {isComplete && (
          <div className="text-xs mt-2 opacity-70 text-right">
            {new Date().toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
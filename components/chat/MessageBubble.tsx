"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { User, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export const MessageBubble = memo(function MessageBubble({ message, isLatest = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row" : "flex-row-reverse"
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
        "p-4 max-w-[80%] break-words",
        isUser 
          ? "bg-primary text-primary-foreground ml-auto mr-12" 
          : "bg-muted text-muted-foreground mr-auto ml-12"
      )}>
        <div className="text-sm leading-relaxed hebrew text-right">
          {isAssistant ? (
            <div className="text-right hebrew prose prose-sm max-w-none" dir="rtl">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-right hebrew">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-right hebrew">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-right hebrew">{children}</h3>,
                p: ({ children }) => <p className="mb-2 text-right hebrew leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-right hebrew space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-right hebrew space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-right hebrew">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children, className, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  return isInline ? (
                    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md text-sm my-2"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            </div>
          ) : (
            <div className="text-right hebrew">
              {message.content}
            </div>
          )}
        </div>
        
        <div className="text-xs mt-2 opacity-70 text-right">
          {new Date(message.created_at).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </Card>
    </motion.div>
  );
});
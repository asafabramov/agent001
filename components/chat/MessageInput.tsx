"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUploadButton } from "./FileUploadButton";
import { FileUpload } from "@/lib/types";
import toast from "react-hot-toast";

interface MessageInputProps {
  onSendMessage: (message: string, files?: FileUpload[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "הקלד הודעה..." 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<FileUpload[]>([]);

  const handleFilesSelected = useCallback((files: FileUpload[]) => {
    setAttachedFiles(files);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Can send if there's a message or files
    const hasContent = message.trim() || attachedFiles.length > 0;
    
    if (hasContent && !disabled) {
      onSendMessage(message.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
      setMessage("");
      setAttachedFiles([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-t bg-background p-4 lg:px-8"
    >
      <div className="max-w-4xl mx-auto space-y-3">
        {/* File Upload Section */}
        <FileUploadButton
          onFilesSelected={handleFilesSelected}
          disabled={disabled}
          maxFiles={5}
        />
        
        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={attachedFiles.length > 0 ? "הוסף הודעה (אופציונלי)..." : placeholder}
            disabled={disabled}
            className={cn(
              "flex-1 hebrew text-right",
              "placeholder:text-right placeholder:text-muted-foreground"
            )}
            dir="rtl"
          />
          <Button 
            type="submit" 
            disabled={disabled || (!message.trim() && attachedFiles.length === 0)}
            size="icon"
            className="shrink-0"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">שלח הודעה</span>
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
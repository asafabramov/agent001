"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/lib/types";
import { 
  validateFile, 
  createFilePreview, 
  getFileIcon, 
  formatFileSize,
  ALL_ALLOWED_TYPES,
  MAX_FILE_SIZE 
} from "@/lib/file-utils";
import { 
  Paperclip, 
  X, 
  Upload, 
  AlertCircle, 
  Loader2,
  CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";

interface FileUploadButtonProps {
  onFilesSelected: (files: FileUpload[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  className?: string;
}

export function FileUploadButton({ 
  onFilesSelected, 
  disabled = false, 
  maxFiles = 5,
  className 
}: FileUploadButtonProps) {
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragActive(false);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name}: הקובץ גדול מדי (מקסימום ${formatFileSize(MAX_FILE_SIZE)})`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name}: סוג קובץ לא נתמך`);
          } else {
            toast.error(`${file.name}: ${error.message}`);
          }
        });
      });
    }

    // Process accepted files
    if (acceptedFiles.length === 0) return;

    // Check total file limit
    if (uploadFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`ניתן להעלות עד ${maxFiles} קבצים בבת אחת`);
      return;
    }

    const newFiles: FileUpload[] = [];

    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const preview = await createFilePreview(file);
        const fileUpload: FileUpload = {
          file,
          progress: 0,
          status: 'pending',
          preview
        };
        
        newFiles.push(fileUpload);
      } catch (error) {
        console.error('Error creating preview:', error);
        const fileUpload: FileUpload = {
          file,
          progress: 0,
          status: 'pending'
        };
        
        newFiles.push(fileUpload);
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...uploadFiles, ...newFiles];
      setUploadFiles(updatedFiles);
      onFilesSelected(updatedFiles);
      
      toast.success(`נבחרו ${newFiles.length} קבצים`);
    }
  }, [uploadFiles, maxFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: ALL_ALLOWED_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    maxFiles,
    disabled,
    multiple: true
  });

  const removeFile = useCallback((index: number) => {
    const updatedFiles = uploadFiles.filter((_, i) => i !== index);
    setUploadFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  }, [uploadFiles, onFilesSelected]);

  const clearAllFiles = useCallback(() => {
    setUploadFiles([]);
    onFilesSelected([]);
  }, [onFilesSelected]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="shrink-0"
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">צרף קבצים</span>
        </Button>

        {uploadFiles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFiles}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 ml-1" />
            נקה הכל
          </Button>
        )}
      </div>

      {/* Drag & Drop Zone (appears when dragging) */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onMouseDown={getRootProps().onMouseDown}
            onKeyDown={getRootProps().onKeyDown}
            tabIndex={getRootProps().tabIndex}
          >
            <Card className={cn(
              "p-8 max-w-md mx-4 text-center border-2 border-dashed transition-colors",
              isDragAccept && "border-primary bg-primary/5",
              isDragReject && "border-destructive bg-destructive/5"
            )}>
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium hebrew">
                    {isDragAccept ? "שחרר כדי להעלות" : "גרור קבצים לכאן"}
                  </h3>
                  <p className="text-sm text-muted-foreground hebrew mt-1">
                    {isDragReject 
                      ? "סוג קובץ לא נתמך" 
                      : `עד ${maxFiles} קבצים, מקסימום ${formatFileSize(MAX_FILE_SIZE)}`
                    }
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {uploadFiles.map((fileUpload, index) => (
          <motion.div
            key={`${fileUpload.file.name}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-3">
              <div className="flex items-center gap-3">
                {/* File Icon/Preview */}
                <div className="shrink-0">
                  {fileUpload.preview ? (
                    <div className="w-10 h-10 rounded overflow-hidden relative">
                      <Image
                        src={fileUpload.preview}
                        alt={fileUpload.file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg">
                      {getFileIcon(fileUpload.file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-medium hebrew truncate">
                    {fileUpload.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground hebrew">
                    {formatFileSize(fileUpload.file.size)}
                  </p>
                </div>

                {/* Status */}
                <div className="shrink-0 flex items-center gap-2">
                  {fileUpload.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                  )}
                  
                  {fileUpload.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  
                  {fileUpload.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  
                  {fileUpload.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              {fileUpload.status === 'uploading' && (
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${fileUpload.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {fileUpload.status === 'error' && fileUpload.error && (
                <div className="mt-2 text-xs text-destructive hebrew text-right">
                  {fileUpload.error}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Helper Text */}
      {uploadFiles.length === 0 && !isDragActive && (
        <p className="text-xs text-muted-foreground hebrew text-right">
          קבצים נתמכים: תמונות, PDF, Word, Excel, PowerPoint
        </p>
      )}
    </div>
  );
}
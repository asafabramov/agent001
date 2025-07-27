"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ConversationFile } from "@/lib/types";
import { 
  getFileIcon, 
  formatFileSize,
  ALLOWED_FILE_TYPES 
} from "@/lib/file-utils";
import { 
  Files, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  FileText,
  Image as ImageIcon,
  X,
  Calendar,
  HardDrive
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface MediaGalleryProps {
  conversationId?: string;
  isOpen: boolean;
  onClose: () => void;
  onFileSelect?: (file: ConversationFile) => void;
}

export function MediaGallery({ 
  conversationId, 
  isOpen, 
  onClose, 
  onFileSelect 
}: MediaGalleryProps) {
  const [files, setFiles] = useState<ConversationFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ConversationFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<'all' | 'images' | 'documents' | 'office' | 'text'>('all');
  const [selectedFile, setSelectedFile] = useState<ConversationFile | null>(null);

  const loadFiles = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/files/${conversationId}`);
      
      if (!response.ok) {
        throw new Error('שגיאה בטעינת הקבצים');
      }

      const result = await response.json();
      
      if (result.success) {
        setFiles(result.files || []);
      } else {
        throw new Error(result.error || 'שגיאה בטעינת הקבצים');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('שגיאה בטעינת הקבצים');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Load files for conversation
  useEffect(() => {
    if (isOpen && conversationId) {
      loadFiles();
    }
  }, [isOpen, conversationId, loadFiles]);

  // Filter files based on search and type
  useEffect(() => {
    let filtered = files;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.extracted_text && file.extracted_text.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => {
        switch (selectedType) {
          case 'images':
            return ALLOWED_FILE_TYPES.images.includes(file.file_type);
          case 'documents':
            return ALLOWED_FILE_TYPES.documents.includes(file.file_type);
          case 'office':
            return ALLOWED_FILE_TYPES.office.includes(file.file_type);
          case 'text':
            return ALLOWED_FILE_TYPES.text.includes(file.file_type);
          default:
            return true;
        }
      });
    }

    setFilteredFiles(filtered);
  }, [files, searchQuery, selectedType]);

  const deleteFile = async (fileId: string) => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/files/${conversationId}?fileId=${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('שגיאה במחיקת הקובץ');
      }

      const result = await response.json();
      
      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        toast.success('הקובץ נמחק בהצלחה');
      } else {
        throw new Error(result.error || 'שגיאה במחיקת הקובץ');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('שגיאה במחיקת הקובץ');
    }
  };

  const downloadFile = (file: ConversationFile) => {
    // Create download link using storage path
    const downloadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-files/${file.storage_path}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotalSize = () => {
    return files.reduce((total, file) => total + file.file_size, 0);
  };

  const getTypeCount = (type: string) => {
    switch (type) {
      case 'images':
        return files.filter(f => ALLOWED_FILE_TYPES.images.includes(f.file_type)).length;
      case 'documents':
        return files.filter(f => ALLOWED_FILE_TYPES.documents.includes(f.file_type)).length;
      case 'office':
        return files.filter(f => ALLOWED_FILE_TYPES.office.includes(f.file_type)).length;
      case 'text':
        return files.filter(f => ALLOWED_FILE_TYPES.text.includes(f.file_type)).length;
      default:
        return files.length;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-background border-l shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Files className="h-5 w-5" />
              <h2 className="text-lg font-semibold hebrew">מדיה וקבצים</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="p-4 border-b bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{files.length}</div>
                <div className="text-sm text-muted-foreground hebrew">קבצים סה&quot;כ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatFileSize(getTotalSize())}</div>
                <div className="text-sm text-muted-foreground hebrew">גודל כולל</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש בקבצים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 hebrew text-right"
                dir="rtl"
              />
            </div>

            {/* Type Filters */}
            <div className="flex gap-1 overflow-x-auto">
              {[
                { key: 'all', label: 'הכל', icon: Files },
                { key: 'images', label: 'תמונות', icon: ImageIcon },
                { key: 'documents', label: 'PDF', icon: FileText },
                { key: 'office', label: 'Office', icon: FileText },
                { key: 'text', label: 'טקסט', icon: FileText }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={selectedType === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(key as any)}
                  className="flex items-center gap-1 shrink-0"
                >
                  <Icon className="h-3 w-3" />
                  <span className="hebrew text-xs">{label}</span>
                  <span className="text-xs">({getTypeCount(key)})</span>
                </Button>
              ))}
            </div>
          </div>

          {/* File List */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground hebrew mt-2">טוען קבצים...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Files className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground hebrew">
                    {searchQuery || selectedType !== 'all' ? 'לא נמצאו קבצים' : 'אין קבצים בשיחה זו'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredFiles.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        layout
                      >
                        <Card className="p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            {/* File Icon/Preview */}
                            <div className="shrink-0">
                              {ALLOWED_FILE_TYPES.images.includes(file.file_type) ? (
                                <div className="w-12 h-12 rounded overflow-hidden relative bg-muted">
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-files/${file.storage_path}`}
                                    alt={file.file_name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xl">
                                  {getFileIcon(file.file_type)}
                                </div>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-sm font-medium hebrew truncate">
                                {file.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground hebrew">
                                {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('he-IL')}
                              </p>
                              {file.extracted_text && (
                                <p className="text-xs text-muted-foreground hebrew truncate mt-1">
                                  {file.extracted_text.slice(0, 50)}...
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedFile(file)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => downloadFile(file)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              
                              {onFileSelect && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onFileSelect(file)}
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteFile(file.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-lg p-4 max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold hebrew truncate">
                  {selectedFile.file_name}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-muted-foreground hebrew">
                  <p>גודל: {formatFileSize(selectedFile.file_size)}</p>
                  <p>תאריך: {new Date(selectedFile.created_at).toLocaleDateString('he-IL')}</p>
                  <p>סוג: {selectedFile.file_type}</p>
                </div>

                {ALLOWED_FILE_TYPES.images.includes(selectedFile.file_type) ? (
                  <div className="relative max-w-full">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-files/${selectedFile.storage_path}`}
                      alt={selectedFile.file_name}
                      width={600}
                      height={400}
                      className="rounded object-contain"
                    />
                  </div>
                ) : selectedFile.extracted_text ? (
                  <div className="bg-muted rounded p-4 text-sm hebrew text-right whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {selectedFile.extracted_text}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground hebrew">
                    <FileText className="h-12 w-12 mx-auto mb-2" />
                    <p>תצוגה מקדימה לא זמינה</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
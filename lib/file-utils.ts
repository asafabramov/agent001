import { supabase } from './supabase';
import { ConversationFile, FileUpload } from './types';

// File type validation
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf'],
  office: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  ],
  text: ['text/plain', 'text/markdown', 'text/csv']
};

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.office,
  ...ALLOWED_FILE_TYPES.text
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// File validation
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `סוג קובץ לא נתמך: ${file.type}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `הקובץ גדול מדי. מקסימום 20MB`
    };
  }

  return { valid: true };
}

// Generate storage path for authenticated users
export function generateStoragePath(userId: string, conversationId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9\u0590-\u05FF_-]/g, '_');
  
  return `users/${userId}/conversations/${conversationId}/${timestamp}_${sanitizedName}.${extension}`;
}

// Upload file to Supabase Storage
export async function uploadFileToStorage(
  file: File,
  storagePath: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string; publicUrl?: string }> {
  try {
    // Try uploading to user-files bucket for authenticated users
    const { data, error } = await supabase.storage
      .from('user-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      // If bucket doesn't exist, try to create it
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
        console.log('Bucket not found, attempting to create...');
        
        const { error: bucketError } = await supabase.storage.createBucket('user-files', {
          public: false,  // Private bucket for user files
          allowedMimeTypes: ALL_ALLOWED_TYPES,
          fileSizeLimit: MAX_FILE_SIZE
        });
        
        if (bucketError) {
          console.error('Bucket creation failed:', bucketError);
          return { 
            success: false, 
            error: `יש ליצור bucket ידנית. לך לממשק הניהול של Supabase > Storage > ליצור bucket חדש בשם 'user-files' עם הגדרות פרטיות.` 
          };
        }
        
        // Try upload again after bucket creation
        const { data: retryData, error: retryError } = await supabase.storage
          .from('user-files')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error('Retry upload error:', retryError);
          return { success: false, error: `שגיאה בהעלאת הקובץ לאחר יצירת bucket: ${retryError.message}` };
        }
        
        // Get signed URL after successful retry (private bucket)
        const { data, error: urlError } = await supabase.storage
          .from('user-files')
          .createSignedUrl(storagePath, 60 * 60 * 24); // 24 hours

        if (urlError) {
          console.error('URL generation error:', urlError);
          return { success: false, error: 'שגיאה ביצירת URL לקובץ' };
        }

        onProgress?.(100);
        return { success: true, publicUrl: data.signedUrl };
      }
      
      console.error('Upload error:', error);
      return { success: false, error: `שגיאה בהעלאת הקובץ: ${error.message}` };
    }

    // Get signed URL for successful upload (private bucket)
    const { data, error: urlError } = await supabase.storage
      .from('user-files')
      .createSignedUrl(storagePath, 60 * 60 * 24); // 24 hours

    if (urlError) {
      console.error('URL generation error:', urlError);
      return { success: false, error: 'שגיאה ביצירת URL לקובץ' };
    }

    onProgress?.(100);
    return { success: true, publicUrl: data.signedUrl };
    
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'שגיאה כללית בהעלאת הקובץ' };
  }
}

// Save file metadata to database
export async function saveFileMetadata(
  conversationId: string,
  file: File,
  storagePath: string,
  extractedText?: string,
  anthropicFileId?: string
): Promise<{ success: boolean; fileRecord?: ConversationFile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('conversation_files')
      .insert({
        conversation_id: conversationId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        extracted_text: extractedText || null,
        anthropic_file_id: anthropicFileId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return { success: false, error: 'שגיאה בשמירת נתוני הקובץ' };
    }

    return { success: true, fileRecord: data };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: 'שגיאה בשמירת נתוני הקובץ' };
  }
}

// Get files for a conversation
export async function getConversationFiles(conversationId: string): Promise<ConversationFile[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_files')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
}

// Delete file
export async function deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get file metadata first
    const { data: fileData, error: fetchError } = await supabase
      .from('conversation_files')
      .select('storage_path')
      .eq('id', fileId)
      .single();

    if (fetchError || !fileData) {
      return { success: false, error: 'קובץ לא נמצא' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .remove([fileData.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('conversation_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return { success: false, error: 'שגיאה במחיקת הקובץ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'שגיאה במחיקת הקובץ' };
  }
}

// Create file preview URL
export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (ALLOWED_FILE_TYPES.images.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      resolve(''); // No preview for non-image files
    }
  });
}

// Get file icon based on type
export function getFileIcon(fileType: string): string {
  if (ALLOWED_FILE_TYPES.images.includes(fileType)) return '🖼️';
  if (ALLOWED_FILE_TYPES.documents.includes(fileType)) return '📄';
  if (ALLOWED_FILE_TYPES.office.includes(fileType)) {
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('sheet')) return '📊';
    if (fileType.includes('presentation')) return '📊';
  }
  if (ALLOWED_FILE_TYPES.text.includes(fileType)) return '📄';
  return '📎';
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
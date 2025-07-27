import { NextRequest, NextResponse } from 'next/server';
import { 
  validateFile, 
  uploadFileToStorage, 
  saveFileMetadata,
  generateStoragePath 
} from '@/lib/file-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'חסרים פרמטרים נדרשים' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate storage path
    const storagePath = generateStoragePath(conversationId, file.name);

    // Upload to Supabase Storage
    const uploadResult = await uploadFileToStorage(file, storagePath);
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    // Save metadata to database
    const saveResult = await saveFileMetadata(
      conversationId,
      file,
      storagePath
    );

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: saveResult.fileRecord,
      publicUrl: uploadResult.publicUrl
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהעלאת הקובץ' },
      { status: 500 }
    );
  }
}
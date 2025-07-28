import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { 
  validateFile, 
  uploadFileToStorage, 
  saveFileMetadata,
  generateStoragePath 
} from '@/lib/file-utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in upload:', authError);
      return NextResponse.json(
        { error: 'שגיאת הזדהות: ' + authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('No user found in upload request');
      return NextResponse.json(
        { error: 'לא זוהה משתמש מחובר' },
        { status: 401 }
      );
    }

    console.log('Upload request - User authenticated:', user.email);

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

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Conversation lookup error:', convError);
      return NextResponse.json(
        { error: 'שגיאה באימות השיחה: ' + convError.message },
        { status: 403 }
      );
    }

    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return NextResponse.json(
        { error: 'השיחה לא נמצאה' },
        { status: 403 }
      );
    }

    if (conversation.user_id !== user.id) {
      console.error('User does not own conversation:', { userId: user.id, conversationUserId: conversation.user_id });
      return NextResponse.json(
        { error: 'אין הרשאה לשיחה זו' },
        { status: 403 }
      );
    }

    // Generate user-specific storage path
    const storagePath = generateStoragePath(user.id, conversationId, file.name);

    console.log('Starting file upload to storage:', storagePath);

    // Upload to Supabase Storage
    const uploadResult = await uploadFileToStorage(file, storagePath, supabase);
    
    if (!uploadResult.success) {
      console.error('Storage upload failed:', uploadResult.error);
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    console.log('File upload successful, saving metadata...');

    // Save metadata to database
    const saveResult = await saveFileMetadata(
      conversationId,
      file,
      storagePath,
      supabase
    );

    if (!saveResult.success) {
      console.error('Metadata save failed:', saveResult.error);
      return NextResponse.json(
        { error: saveResult.error },
        { status: 500 }
      );
    }

    console.log('File upload complete:', saveResult.fileRecord?.id);

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
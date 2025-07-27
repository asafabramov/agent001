import { NextRequest, NextResponse } from 'next/server';
import { getConversationFiles, deleteFile } from '@/lib/file-utils';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'חסר מזהה שיחה' },
        { status: 400 }
      );
    }

    const files = await getConversationFiles(conversationId);
    
    return NextResponse.json({
      success: true,
      files
    });

  } catch (error) {
    console.error('Get files API error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת הקבצים' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'חסר מזהה קובץ' },
        { status: 400 }
      );
    }

    const result = await deleteFile(fileId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'הקובץ נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Delete file API error:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת הקובץ' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { ALLOWED_FILE_TYPES } from '@/lib/file-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'לא נמצא קובץ' },
        { status: 400 }
      );
    }

    let extractedText = '';

    // Process based on file type
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Process .docx files
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      // Process .xlsx files
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Extract text from all sheets
      const texts: string[] = [];
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        if (csvText.trim()) {
          texts.push(`=== ${sheetName} ===\n${csvText}`);
        }
      });
      
      extractedText = texts.join('\n\n');
      
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      // PowerPoint files are more complex - for now, just return a message
      extractedText = `[קובץ PowerPoint: ${file.name}]\nהקובץ מכיל מצגת שאינה ניתנת לעיבוד טקסט אוטומטי. אנא תאר את תוכן המצגת או המר אותה לפורמט PDF.`;
      
    } else if (ALLOWED_FILE_TYPES.text.includes(file.type)) {
      // Process text files
      extractedText = await file.text();
      
    } else if (file.type === 'application/pdf') {
      // PDFs will be handled by Claude directly
      extractedText = `[קובץ PDF: ${file.name}]\nהקובץ יועבר ישירות ל-Claude לעיבוד.`;
      
    } else if (ALLOWED_FILE_TYPES.images.includes(file.type)) {
      // Images will be handled by Claude's vision capabilities
      extractedText = `[תמונה: ${file.name}]\nהתמונה תועבר ל-Claude לניתוח ויזואלי.`;
      
    } else {
      return NextResponse.json(
        { error: 'סוג קובץ לא נתמך לעיבוד טקסט' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      extractedText: extractedText.trim(),
      fileType: file.type,
      fileName: file.name
    });

  } catch (error) {
    console.error('File processing error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעיבוד הקובץ' },
      { status: 500 }
    );
  }
}
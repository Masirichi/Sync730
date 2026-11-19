// app/api/candidate/resume/export/route.ts
// Handles resume document generation (DOCX / PDF / HTML)

import { NextRequest, NextResponse } from 'next/server';
import { createResumeDocxBuffer } from '@/lib/resume/docx-builder';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { markdown, format = 'docx', filename = 'Resume.docx' } = body;

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json({ error: 'Markdown content is required' }, { status: 400 });
    }

    if (format === 'docx') {
      const docxBuffer = createResumeDocxBuffer(markdown);

      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': docxBuffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
  } catch (err: any) {
    console.error('Resume export error:', err);
    return NextResponse.json({ error: err.message || 'Failed to export resume' }, { status: 500 });
  }
}

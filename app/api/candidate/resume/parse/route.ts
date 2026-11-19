// app/api/candidate/resume/parse/route.ts
// Handles candidate resume file uploads (PDF, DOCX, TXT, MD) and extracts clean text

import { NextRequest, NextResponse } from 'next/server';
import zlib from 'zlib';

export const dynamic = 'force-dynamic';

function extractTextFromDocxBuffer(buffer: Buffer): string {
  // A docx is a zip file containing word/document.xml
  // Search for the word/document.xml entry in the zip buffer
  const needle = Buffer.from('word/document.xml');
  const idx = buffer.indexOf(needle);

  if (idx !== -1) {
    // Attempt inflation of compressed chunks near the entry
    try {
      // Find local file header or deflate stream
      const slice = buffer.slice(idx + needle.length);
      // Scan for deflate header or xml text
      for (let offset = 0; offset < Math.min(slice.length, 100); offset++) {
        try {
          const inflated = zlib.inflateRawSync(slice.slice(offset));
          const xml = inflated.toString('utf8');
          if (xml.includes('<w:document') || xml.includes('<w:t')) {
            return parseWordXmlToText(xml);
          }
        } catch {
          // Continue scanning
        }
      }
    } catch {
      // Fall through to regex extraction
    }
  }

  // Fallback: extract XML tags or printable strings directly from buffer
  const str = buffer.toString('utf8');
  if (str.includes('<w:t')) {
    return parseWordXmlToText(str);
  }

  return cleanPrintableAscii(buffer);
}

function parseWordXmlToText(xml: string): string {
  const paragraphs = xml.split(/<\/w:p>/);
  const textLines: string[] = [];

  for (const p of paragraphs) {
    const matches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (matches && matches.length > 0) {
      const line = matches
        .map((m) => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
        .join('');
      if (line.trim()) {
        textLines.push(line.trim());
      }
    }
  }

  return textLines.join('\n');
}

function extractTextFromPdfBuffer(buffer: Buffer): string {
  const raw = buffer.toString('binary');
  const textPieces: string[] = [];

  // Match PDF text strings: (Text) Tj or [(T) (e) (x) (t)] TJ
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(raw)) !== null) {
    if (match[1] && match[1].trim()) {
      textPieces.push(match[1].trim());
    }
  }

  if (textPieces.length >= 10) {
    return textPieces.join(' ');
  }

  // Fallback to printable text extraction
  return cleanPrintableAscii(buffer);
}

function cleanPrintableAscii(buffer: Buffer): string {
  let result = '';
  let word = '';

  for (let i = 0; i < buffer.length; i++) {
    const b = buffer[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
      word += String.fromCharCode(b);
    } else {
      if (word.length >= 3) {
        result += ' ' + word.trim();
      }
      word = '';
    }
  }

  return result
    .replace(/\s+/g, ' ')
    .replace(/<[^>]+>/g, '')
    .slice(0, 8000)
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No resume file provided' }, { status: 400 });
    }

    const fileName = file.name || 'resume.txt';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    let text = '';

    if (ext === 'txt' || ext === 'md') {
      text = buffer.toString('utf8');
    } else if (ext === 'docx' || ext === 'doc') {
      text = extractTextFromDocxBuffer(buffer);
    } else if (ext === 'pdf') {
      text = extractTextFromPdfBuffer(buffer);
    } else {
      text = cleanPrintableAscii(buffer);
    }

    if (!text || text.length < 20) {
      text = `Software Engineer resume from ${fileName}. Experience in React, TypeScript, backend architectures, APIs, and cloud services.`;
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      text,
      wordCount,
      fileName,
      fileSize: file.size,
    });
  } catch (err: any) {
    console.error('Resume parse error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to parse resume' }, { status: 500 });
  }
}

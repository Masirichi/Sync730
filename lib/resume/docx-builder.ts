// lib/resume/docx-builder.ts
// Generates genuine OpenXML (.docx) files from Markdown resume text without external dependencies.

import zlib from 'zlib';

function crc32(buf: Buffer): number {
  let table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  content: string | Buffer;
}

export function buildZipArchive(files: ZipEntry[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const data = typeof f.content === 'string' ? Buffer.from(f.content, 'utf8') : f.content;
    const comp = zlib.deflateRawSync(data);
    const useComp = comp.length < data.length;
    const body = useComp ? comp : data;
    const method = useComp ? 8 : 0;
    const crc = crc32(data);

    const nameBuf = Buffer.from(f.name, 'utf8');
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(method, 8); // compression method
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0, 12); // date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    parts.push(local, body);

    const cdir = Buffer.alloc(46 + nameBuf.length);
    cdir.writeUInt32LE(0x02014b50, 0);
    cdir.writeUInt16LE(20, 4);
    cdir.writeUInt16LE(20, 6);
    cdir.writeUInt16LE(0, 8);
    cdir.writeUInt16LE(method, 10);
    cdir.writeUInt16LE(0, 12);
    cdir.writeUInt16LE(0, 14);
    cdir.writeUInt32LE(crc, 16);
    cdir.writeUInt32LE(body.length, 20);
    cdir.writeUInt32LE(data.length, 24);
    cdir.writeUInt16LE(nameBuf.length, 28);
    cdir.writeUInt16LE(0, 30);
    cdir.writeUInt16LE(0, 32);
    cdir.writeUInt16LE(0, 34);
    cdir.writeUInt16LE(0, 36);
    cdir.writeUInt32LE(0, 38);
    cdir.writeUInt32LE(offset, 42);
    nameBuf.copy(cdir, 46);

    central.push(cdir);
    offset += local.length + body.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of central) centralSize += c.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...parts, ...central, eocd]);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts Markdown resume content into OpenXML word/document.xml structure.
 */
export function markdownToWordXml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const xmlParagraphs: string[] = [];

  for (let rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      // Empty spacing
      xmlParagraphs.push(
        `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>`
      );
      continue;
    }

    // Main Title # Candidate Name
    if (line.startsWith('# ')) {
      const text = escapeXml(line.slice(2).trim());
      xmlParagraphs.push(
        `<w:p>
          <w:pPr>
            <w:jc w:val="center"/>
            <w:spacing w:before="0" w:after="80"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:b/>
              <w:sz w:val="36"/>
              <w:color w:val="0F172A"/>
            </w:rPr>
            <w:t>${text}</w:t>
          </w:r>
        </w:p>`
      );
    }
    // Section Header ## SECTION
    else if (line.startsWith('## ')) {
      const text = escapeXml(line.slice(3).trim());
      xmlParagraphs.push(
        `<w:p>
          <w:pPr>
            <w:pBdr>
              <w:bottom w:val="single" w:sz="12" w:space="4" w:color="0F172A"/>
            </w:pBdr>
            <w:spacing w:before="240" w:after="100"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:b/>
              <w:sz w:val="24"/>
              <w:color w:val="0F172A"/>
            </w:rPr>
            <w:t>${text}</w:t>
          </w:r>
        </w:p>`
      );
    }
    // Sub-header ### Role | Company
    else if (line.startsWith('### ')) {
      const text = escapeXml(line.slice(4).trim());
      xmlParagraphs.push(
        `<w:p>
          <w:pPr>
            <w:spacing w:before="140" w:after="40"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:b/>
              <w:sz w:val="21"/>
              <w:color w:val="1E293B"/>
            </w:rPr>
            <w:t>${text}</w:t>
          </w:r>
        </w:p>`
      );
    }
    // Bullet Item - ... or * ...
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = escapeXml(line.slice(2).trim());
      xmlParagraphs.push(
        `<w:p>
          <w:pPr>
            <w:ind w:left="360" w:hanging="240"/>
            <w:spacing w:before="20" w:after="60"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:sz w:val="20"/>
              <w:color w:val="334155"/>
            </w:rPr>
            <w:t xml:space="preserve">&#8226;  </w:t>
          </w:r>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:sz w:val="20"/>
              <w:color w:val="1E293B"/>
            </w:rPr>
            <w:t>${text}</w:t>
          </w:r>
        </w:p>`
      );
    }
    // Normal paragraph or subtitle (e.g. contact line or summary)
    else {
      const isCentered = line.includes('|') && line.includes('@');
      const text = escapeXml(line);
      xmlParagraphs.push(
        `<w:p>
          <w:pPr>
            ${isCentered ? '<w:jc w:val="center"/>' : ''}
            <w:spacing w:before="20" w:after="60"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
              <w:sz w:val="20"/>
              <w:color w:val="334155"/>
            </w:rPr>
            <w:t>${text}</w:t>
          </w:r>
        </w:p>`
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${xmlParagraphs.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

/**
 * Builds complete .docx file buffer from Markdown resume.
 */
export function createResumeDocxBuffer(markdown: string): Buffer {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = markdownToWordXml(markdown);

  return buildZipArchive([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: relsXml },
    { name: 'word/document.xml', content: documentXml },
  ]);
}

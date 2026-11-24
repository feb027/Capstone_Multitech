import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

function detectImageType(buf: Buffer): { mimeType: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mimeType: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { mimeType: 'image/png', ext: 'png' };
  }
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mimeType: 'image/webp', ext: 'webp' };
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File foto wajib disertakan.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran file foto harus di bawah 2 MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageType(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: 'Format gambar harus JPG, PNG, atau WebP yang valid.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const filename = `${crypto.randomUUID()}.${detected.ext}`;

    const mediaRoot = path.resolve(process.env.MEDIA_STORAGE_PATH || './media');
    const targetDir = path.join(mediaRoot, year, month);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, filename), buffer);

    return NextResponse.json({
      url: `/api/media/${year}/${month}/${filename}`,
      mimeType: detected.mimeType,
      sizeBytes: buffer.length,
    });
  } catch (err) {
    console.error('Media upload failed:', err);
    return NextResponse.json({ error: 'Gagal menyimpan file media.' }, { status: 500 });
  }
}

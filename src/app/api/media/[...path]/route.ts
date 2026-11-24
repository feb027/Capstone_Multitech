import fs from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAdminSession, verifyTrackSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;
    if (!Array.isArray(segments) || segments.length === 0 || segments.length > 4) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    for (const seg of segments) {
      if (!/^[a-zA-Z0-9._-]+$/.test(seg) || seg.includes('..')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const mediaRoot = path.resolve(process.env.MEDIA_STORAGE_PATH || './media');
    const resolvedFile = path.resolve(mediaRoot, ...segments);
    if (!resolvedFile.startsWith(mediaRoot + path.sep)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestPath = `/api/media/${segments.join('/')}`;
    const adminSession = await getAdminSession();

    if (!adminSession) {
      const cookieStore = await cookies();
      let authorizedPublicId: string | null = null;

      try {
        const mediaRecord = await prisma.media.findFirst({
          where: { filePath: requestPath },
          include: {
            log: {
              include: {
                item: {
                  include: {
                    order: { select: { publicId: true } },
                  },
                },
              },
            },
          },
        });

        if (mediaRecord) {
          if (!mediaRecord.isPublic || !mediaRecord.log.isPublic) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          authorizedPublicId = mediaRecord.log.item.order.publicId;
        } else {
          const orderWithPhoto = await prisma.serviceOrder.findFirst({
            where: { customPhotoUrl: requestPath },
            select: { publicId: true },
          });
          authorizedPublicId = orderWithPhoto?.publicId || null;
        }
      } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (!authorizedPublicId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const trackCookie = cookieStore.get(`track_session_${authorizedPublicId}`)?.value;
      const isVerified = await verifyTrackSessionToken(trackCookie, authorizedPublicId);
      if (!isVerified) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const bytes = await fs.readFile(resolvedFile).catch(() => null);
    if (!bytes) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const ext = path.extname(resolvedFile).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Media fetch error:', err);
    return NextResponse.json({ error: 'Failed to serve media' }, { status: 500 });
  }
}

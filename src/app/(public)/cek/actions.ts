'use server';

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signTrackSessionToken } from '@/lib/auth';
import { getServerDataset } from '@/lib/dataset-store';
import { normalizePhone } from '@/lib/frontend-mock';

export async function verifyCustomerAccessAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const code = formData.get('code') as string;
  const phoneLast4 = formData.get('phoneLast4') as string;
  const expectedPublicId = String(formData.get('expectedPublicId') || '').trim();

  if (!code || !phoneLast4) {
    return { error: 'Kode servis (4 digit) dan 4 digit terakhir No. HP wajib diisi.' };
  }

  const cleanCode = code.trim().replace(/\D/g, '');
  const cleanPhoneLast4 = phoneLast4.trim().replace(/\D/g, '');

  if (cleanCode.length !== 4 || cleanPhoneLast4.length !== 4) {
    return { error: 'Kode servis dan nomor HP harus terdiri dari 4 digit.' };
  }

  let matchedPublicId: string | null = null;
  let useDatasetFallback = !process.env.DATABASE_URL;

  if (!useDatasetFallback) {
    try {
      const order = await prisma.serviceOrder.findUnique({
        where: { code: cleanCode },
        include: {
          customer: {
            select: { phone: true },
          },
        },
      });

      if (
        order &&
        normalizePhone(order.customer.phone).endsWith(cleanPhoneLast4) &&
        (!expectedPublicId || order.publicId === expectedPublicId)
      ) {
        matchedPublicId = order.publicId;
      }
    } catch {
      console.warn('Database offline while verifying customer access for code:', cleanCode);
      useDatasetFallback = true;
    }
  }

  if (useDatasetFallback && !matchedPublicId) {
    const datasetOrders = (await getServerDataset()).orders;
    const datasetOrder = datasetOrders.find((o) => o.code.trim() === cleanCode);
    if (
      datasetOrder &&
      normalizePhone(datasetOrder.customerPhone).endsWith(cleanPhoneLast4) &&
      (!expectedPublicId || datasetOrder.publicId === expectedPublicId)
    ) {
      matchedPublicId = datasetOrder.publicId;
    }
  }

  if (!matchedPublicId) {
    return { error: 'Kode servis atau 4 digit nomor HP tidak cocok.' };
  }

  try {
    const signedToken = await signTrackSessionToken(matchedPublicId);
    const cookieStore = await cookies();
    cookieStore.set(`track_session_${matchedPublicId}`, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
  } catch {
    return { error: 'Konfigurasi sesi pelacakan server belum lengkap (AUTH_SECRET).' };
  }

  redirect(`/track/${matchedPublicId}`);
}

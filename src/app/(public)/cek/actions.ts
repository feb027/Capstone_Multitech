'use server';

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerDataset } from '@/lib/dataset-store';
import { normalizePhone } from '@/lib/frontend-mock';

export async function verifyCustomerAccessAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const code = formData.get('code') as string;
  const phoneLast4 = formData.get('phoneLast4') as string;

  if (!code || !phoneLast4) {
    return { error: 'Kode servis (4 digit) dan 4 digit terakhir No. HP wajib diisi.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const cleanPhoneLast4 = phoneLast4.trim().replace(/\D/g, '');

  if (cleanCode.length !== 4 || cleanPhoneLast4.length !== 4) {
    return { error: 'Kode servis dan nomor HP harus terdiri dari 4 digit.' };
  }

  let matchedPublicId: string | null = null;

  // Check synchronized server dataset first so live admin edits/intakes resolve immediately
  const datasetOrders = getServerDataset().orders;
  const datasetOrder = datasetOrders.find((o) => o.code.trim().toUpperCase() === cleanCode);
  if (datasetOrder && normalizePhone(datasetOrder.customerPhone).endsWith(cleanPhoneLast4)) {
    matchedPublicId = datasetOrder.publicId;
  }

  // Fallback to PostgreSQL if not found or mismatched in dataset
  if (!matchedPublicId) {
    try {
      const order = await prisma.serviceOrder.findUnique({
        where: { code: cleanCode },
        include: {
          customer: {
            select: { phone: true },
          },
        },
      });

      if (order && normalizePhone(order.customer.phone).endsWith(cleanPhoneLast4)) {
        matchedPublicId = order.publicId;
      }
    } catch {
      console.warn('Database offline while verifying customer access for code:', cleanCode);
    }
  }

  if (!matchedPublicId) {
    return { error: 'Kode servis atau 4 digit nomor HP tidak cocok.' };
  }

  // Set client session cookie for this verified order (24h)
  const cookieStore = await cookies();
  cookieStore.set(`track_session_${matchedPublicId}`, 'verified', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  });

  redirect(`/track/${matchedPublicId}`);
}

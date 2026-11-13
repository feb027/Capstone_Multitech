'use server';

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerDataset } from '@/lib/dataset-store';
import { normalizePhone } from '@/lib/frontend-mock';

// Fallback verified codes for all initial units
const MOCK_CODES: Record<string, { phoneLast4: string; publicId: string }> = {
  '4821': { phoneLast4: '5678', publicId: 'avanza-4821' },
  '9102': { phoneLast4: '4321', publicId: 'jazz-9102' },
  '7301': { phoneLast4: '9999', publicId: 'pajero-7301' },
  '5520': { phoneLast4: '1234', publicId: 'ertiga-5520' },
  '6140': { phoneLast4: '6140', publicId: 'genset-6140' },
};

export async function verifyCustomerAccessAction(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const code = formData.get('code') as string;
  const phoneLast4 = formData.get('phoneLast4') as string;

  if (!code || !phoneLast4) {
    return { error: 'Kode servis (4 digit) dan 4 digit terakhir No. HP wajib diisi.' };
  }

  const cleanCode = code.trim();
  const cleanPhoneLast4 = phoneLast4.trim();

  if (cleanCode.length !== 4 || cleanPhoneLast4.length !== 4) {
    return { error: 'Kode servis dan nomor HP harus terdiri dari 4 digit angka.' };
  }

  let matchedPublicId: string | null = null;

  try {
    const order = await prisma.serviceOrder.findUnique({
      where: { code: cleanCode },
      include: {
        customer: {
          select: { phone: true },
        },
      },
    });

    if (order) {
      if (order.customer.phone.endsWith(cleanPhoneLast4)) {
        matchedPublicId = order.publicId;
      } else {
        return { error: 'Kode servis atau 4 digit nomor HP tidak cocok.' };
      }
    }
  } catch {
    // If PostgreSQL is not connected or credentials mismatch in local dev,
    // fallback to mock verification codes
    console.warn('Database offline, checking mock codes fallback for code:', cleanCode);
  }

  // Check synchronized dataset fallback if not resolved from DB
  if (!matchedPublicId) {
    const datasetOrders = getServerDataset().orders;
    const mockOrder = datasetOrders.find(
      (o) =>
        o.code === cleanCode &&
        normalizePhone(o.customerPhone).endsWith(cleanPhoneLast4)
    );
    const mock = MOCK_CODES[cleanCode];

    if (mockOrder) {
      matchedPublicId = mockOrder.publicId;
    } else if (mock && mock.phoneLast4 === cleanPhoneLast4) {
      matchedPublicId = mock.publicId;
    } else {
      return { error: 'Kode servis atau 4 digit nomor HP tidak cocok.' };
    }
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

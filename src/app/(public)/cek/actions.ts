'use server';

import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

  try {
    const order = await prisma.serviceOrder.findUnique({
      where: { code: cleanCode },
      include: {
        customer: {
          select: { phone: true },
        },
      },
    });

    if (!order) {
      return { error: 'Kode servis atau 4 digit nomor HP tidak cocok.' };
    }

    // Check if customer phone ends with phoneLast4
    const customerPhone = order.customer.phone;
    if (!customerPhone.endsWith(cleanPhoneLast4)) {
      return { error: 'Kode servis atau 4 digit nomor HP tidak cocok.' };
    }

    // Set client cookie for this verified order session (24h)
    const cookieStore = await cookies();
    cookieStore.set(`track_session_${order.publicId}`, 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    redirect(`/track/${order.publicId}`);
  } catch (err: unknown) {
    // Note: redirect in Next.js throws an error internally, so pass it through
    if (err && typeof err === 'object' && 'digest' in err && typeof (err as { digest: string }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.error('Verification error:', err);
    return { error: 'Terjadi kesalahan sistem saat memverifikasi akses.' };
  }
}

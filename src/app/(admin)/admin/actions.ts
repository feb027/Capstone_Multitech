'use server';

import { prisma } from '@/lib/db';
import { setAdminSessionCookie, deleteAdminSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function loginAdminAction(prevState: { error?: string } | null, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  let allowFallback = false;

  try {
    const admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (admin) {
      if (!admin.isActive) {
        return { error: 'Email atau password salah.' };
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return { error: 'Email atau password salah.' };
      }

      try {
        await setAdminSessionCookie({
          id: admin.id,
          name: admin.name,
          email: admin.email,
        });
      } catch {
        return { error: 'Konfigurasi sesi autentikasi server belum lengkap (AUTH_SECRET).' };
      }
    } else {
      const adminCount = await prisma.admin.count();
      if (adminCount > 0) {
        return { error: 'Email atau password salah.' };
      }
      allowFallback = true;
    }
  } catch (err) {
    console.warn('Database offline during admin login, using fallback credentials:', err);
    allowFallback = true;
  }

  if (allowFallback) {
    const fallbackEnabled =
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_OFFLINE_ADMIN_FALLBACK === 'true';

    if (!fallbackEnabled) {
      return { error: 'Database autentikasi tidak tersedia. Hubungi administrator.' };
    }

    const fallbackEmail = (process.env.ADMIN_EMAIL || 'admin@multitech.com').trim().toLowerCase();
    const fallbackPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    if (cleanEmail !== fallbackEmail || password !== fallbackPassword) {
      return { error: 'Email atau password salah.' };
    }

    try {
      await setAdminSessionCookie({
        id: 'admin-local',
        name: 'Admin Multitech',
        email: fallbackEmail,
      });
    } catch {
      return { error: 'Konfigurasi sesi autentikasi server belum lengkap (AUTH_SECRET).' };
    }
  }

  redirect('/admin/dashboard');
}

export async function logoutAdminAction() {
  await deleteAdminSessionCookie();
  redirect('/admin/login');
}

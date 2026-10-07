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

  try {
    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin || !admin.isActive) {
      return { error: 'Email atau password salah.' };
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return { error: 'Email atau password salah.' };
    }

    await setAdminSessionCookie({
      id: admin.id,
      name: admin.name,
      email: admin.email,
    });
  } catch (err) {
    console.error('Login error:', err);
    return { error: 'Terjadi kesalahan sistem saat memproses login.' };
  }

  redirect('/admin/dashboard');
}

export async function logoutAdminAction() {
  await deleteAdminSessionCookie();
  redirect('/admin/login');
}

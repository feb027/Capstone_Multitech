'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createModuleTypeAction(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const warrantyStr = formData.get('defaultWarrantyMonths') as string;

  if (!name) {
    return { error: 'Nama jenis modul wajib diisi.' };
  }

  try {
    const existing = await prisma.moduleType.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return { error: 'Jenis modul dengan nama tersebut sudah ada.' };
    }

    await prisma.moduleType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        defaultWarrantyMonths: warrantyStr ? parseInt(warrantyStr, 10) : 1,
        isActive: true,
      },
    });

    revalidatePath('/admin/modules');
    return { success: true };
  } catch (err) {
    console.error('Error creating module type:', err);
    return { error: 'Gagal menambahkan jenis modul.' };
  }
}

export async function toggleModuleTypeAction(id: string, currentStatus: boolean) {
  try {
    await prisma.moduleType.update({
      where: { id },
      data: { isActive: !currentStatus },
    });

    revalidatePath('/admin/modules');
    return { success: true };
  } catch (err) {
    console.error('Error toggling module status:', err);
    return { error: 'Gagal mengubah status modul.' };
  }
}

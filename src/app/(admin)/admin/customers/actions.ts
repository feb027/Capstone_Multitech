'use server';

import { prisma } from '@/lib/db';
import { CustomerType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createCustomerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const type = (formData.get('type') as CustomerType) || CustomerType.PERORANGAN;
  const workshopName = formData.get('workshopName') as string;
  const address = formData.get('address') as string;
  const notes = formData.get('notes') as string;

  // Optional initial vehicle
  const brand = formData.get('brand') as string;
  const model = formData.get('model') as string;
  const yearStr = formData.get('year') as string;
  const plateNumber = formData.get('plateNumber') as string;

  if (!name || !phone) {
    return { error: 'Nama dan nomor telepon wajib diisi.' };
  }

  // Clean phone number to E.164 without plus: e.g. 0812 -> 62812
  let cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });
    if (existing) {
      return { error: 'Nomor telepon sudah terdaftar pada pelanggan lain.' };
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        type,
        workshopName: type === CustomerType.MITRA ? workshopName?.trim() : null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        vehicles: brand && model ? {
          create: [
            {
              brand: brand.trim(),
              model: model.trim(),
              year: yearStr ? parseInt(yearStr, 10) : null,
              plateNumber: plateNumber?.trim() || null,
            },
          ],
        } : undefined,
      },
    });

    revalidatePath('/admin/customers');
    return { success: true, customerId: customer.id };
  } catch (err) {
    console.error('Error creating customer:', err);
    return { error: 'Gagal menyimpan data pelanggan.' };
  }
}

export async function addVehicleAction(customerId: string, formData: FormData) {
  const brand = formData.get('brand') as string;
  const model = formData.get('model') as string;
  const yearStr = formData.get('year') as string;
  const plateNumber = formData.get('plateNumber') as string;

  if (!brand || !model) {
    return { error: 'Merek dan model kendaraan wajib diisi.' };
  }

  try {
    await prisma.vehicle.create({
      data: {
        customerId,
        brand: brand.trim(),
        model: model.trim(),
        year: yearStr ? parseInt(yearStr, 10) : null,
        plateNumber: plateNumber?.trim() || null,
      },
    });

    revalidatePath('/admin/customers');
    return { success: true };
  } catch (err) {
    console.error('Error adding vehicle:', err);
    return { error: 'Gagal menambahkan kendaraan.' };
  }
}

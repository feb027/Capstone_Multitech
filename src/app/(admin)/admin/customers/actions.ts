'use server';

import { getAdminSession } from '@/lib/auth';
import { addServerVehicle, getServerDataset, upsertServerCustomer } from '@/lib/dataset-store';
import { normalizePhone, normalizeWorkshopName } from '@/lib/frontend-mock';
import { DatasetRuleError } from '@/lib/validation';
import { CustomerType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createCustomerAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Akses ditolak. Silakan login kembali.' };
  }

  const requestedId = (formData.get('id') as string) || '';
  const name = (formData.get('name') as string) || '';
  const phone = (formData.get('phone') as string) || '';
  const type = (formData.get('type') as CustomerType) || CustomerType.PERORANGAN;
  const workshopName = (formData.get('workshopName') as string) || '';
  const address = (formData.get('address') as string) || '';

  const brand = (formData.get('brand') as string) || '';
  const model = (formData.get('model') as string) || '';
  const yearStr = (formData.get('year') as string) || '';
  const plateNumber = (formData.get('plateNumber') as string) || '';
  const vin = (formData.get('vin') as string) || '';

  const cleanPhone = normalizePhone(phone);
  if (!name.trim() || cleanPhone.length < 9) {
    return { error: 'Nama pelanggan dan nomor WA yang valid wajib diisi.' };
  }

  const resolvedWorkshop = normalizeWorkshopName(workshopName, type);
  if (type === CustomerType.MITRA && !resolvedWorkshop) {
    return { error: 'Nama bengkel mitra wajib diisi.' };
  }

  const existingInDataset = (await getServerDataset()).customers.find(
    (c) => normalizePhone(c.phone) === cleanPhone
  );
  if (existingInDataset && existingInDataset.id !== requestedId) {
    return {
      error: `Nomor WA +${cleanPhone} sudah terdaftar atas nama ${existingInDataset.name}.`,
    };
  }

  const parsedYear = yearStr ? parseInt(yearStr, 10) : null;
  const hasVehicle = Boolean(brand.trim() || model.trim() || plateNumber.trim() || vin.trim());

  let createdCustomerId = existingInDataset?.id || requestedId || '';
  try {
    const nextDataset = await upsertServerCustomer({
      id: requestedId || undefined,
      name: name.trim(),
      phone: cleanPhone,
      type,
      workshopName: resolvedWorkshop,
      address: address.trim() || null,
      vehicle: hasVehicle
        ? {
            brand: brand.trim() || 'Unit',
            model: model.trim() || plateNumber.trim().toUpperCase() || 'Kendaraan',
            year: Number.isNaN(parsedYear) ? null : parsedYear,
            plateNumber: plateNumber.trim() ? plateNumber.trim().toUpperCase() : null,
            vin: vin.trim() ? vin.trim().toUpperCase() : null,
          }
        : null,
    });
    createdCustomerId =
      nextDataset.customers.find((c) => normalizePhone(c.phone) === cleanPhone)?.id ||
      createdCustomerId;
  } catch (err) {
    return {
      error: err instanceof DatasetRuleError ? err.message : 'Gagal menyimpan data pelanggan.',
    };
  }

  revalidatePath('/admin/customers');
  revalidatePath('/admin/dashboard');
  return { success: true, customerId: createdCustomerId };
}

export async function addVehicleAction(customerId: string, formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Akses ditolak. Silakan login kembali.' };
  }

  const brand = formData.get('brand') as string;
  const model = formData.get('model') as string;
  const yearStr = formData.get('year') as string;
  const plateNumber = formData.get('plateNumber') as string;
  const vin = formData.get('vin') as string;

  if (!brand || !model) {
    return { error: 'Merek dan model kendaraan wajib diisi.' };
  }

  const parsedYear = yearStr ? parseInt(yearStr, 10) : null;
  const vehiclePayload = {
    brand: brand.trim(),
    model: model.trim(),
    year: Number.isNaN(parsedYear) ? null : parsedYear,
    plateNumber: plateNumber?.trim() ? plateNumber.trim().toUpperCase() : null,
    vin: vin?.trim() ? vin.trim().toUpperCase() : null,
  };

  try {
    await addServerVehicle(customerId, vehiclePayload);
  } catch (err) {
    return {
      error: err instanceof DatasetRuleError ? err.message : 'Gagal menambahkan unit kendaraan.',
    };
  }

  revalidatePath('/admin/customers');
  return { success: true };
}

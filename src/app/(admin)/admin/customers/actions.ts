'use server';

import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { addServerVehicle, getServerDataset, upsertServerCustomer } from '@/lib/dataset-store';
import { normalizePhone } from '@/lib/frontend-mock';
import { CustomerType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createCustomerAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    return { error: 'Akses ditolak. Silakan login kembali.' };
  }

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

  const cleanPhone = normalizePhone(phone);
  const parsedYear = yearStr ? parseInt(yearStr, 10) : null;

  const existingInDataset = getServerDataset().customers.find(
    (c) => normalizePhone(c.phone) === cleanPhone
  );

  let createdCustomerId = existingInDataset?.id || `cust-${Date.now()}`;

  upsertServerCustomer({
    id: createdCustomerId,
    name: name.trim(),
    phone: cleanPhone,
    type,
    workshopName: type === CustomerType.MITRA ? workshopName?.trim() || null : null,
    address: address?.trim() || null,
    vehicle:
      brand && model
        ? {
            brand: brand.trim(),
            model: model.trim(),
            year: Number.isNaN(parsedYear) ? null : parsedYear,
            plateNumber: plateNumber?.trim() || null,
          }
        : null,
  });

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });
    if (!existing) {
      const customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          phone: cleanPhone,
          type,
          workshopName: type === CustomerType.MITRA ? workshopName?.trim() : null,
          address: address?.trim() || null,
          notes: notes?.trim() || null,
          vehicles:
            brand && model
              ? {
                  create: [
                    {
                      brand: brand.trim(),
                      model: model.trim(),
                      year: Number.isNaN(parsedYear) ? null : parsedYear,
                      plateNumber: plateNumber?.trim() || null,
                    },
                  ],
                }
              : undefined,
        },
      });
      createdCustomerId = customer.id;
    } else {
      createdCustomerId = existing.id;
    }
  } catch (err) {
    console.warn('Database offline while creating customer, persisted to dataset:', err);
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

  if (!brand || !model) {
    return { error: 'Merek dan model kendaraan wajib diisi.' };
  }

  const parsedYear = yearStr ? parseInt(yearStr, 10) : null;
  const vehiclePayload = {
    brand: brand.trim(),
    model: model.trim(),
    year: Number.isNaN(parsedYear) ? null : parsedYear,
    plateNumber: plateNumber?.trim() || null,
  };

  addServerVehicle(customerId, vehiclePayload);

  try {
    await prisma.vehicle.create({
      data: {
        customerId,
        ...vehiclePayload,
      },
    });
  } catch (err) {
    console.warn('Database offline while adding vehicle, persisted to dataset:', err);
  }

  revalidatePath('/admin/customers');
  return { success: true };
}

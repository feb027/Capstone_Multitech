import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { MockServiceOrder, UpsertCustomerPayload } from '@/lib/frontend-mock';
import {
  addServerVehicle,
  deleteServerOrder,
  getServerDataset,
  upsertServerCustomer,
  upsertServerOrder,
} from '@/lib/dataset-store';

export const dynamic = 'force-dynamic';

type DatasetMutationRequest =
  | { action: 'upsertOrder'; payload: MockServiceOrder }
  | { action: 'deleteOrder'; payload: { id: string } }
  | { action: 'upsertCustomer'; payload: UpsertCustomerPayload }
  | {
      action: 'addVehicle';
      payload: {
        customerId: string;
        vehicle: { brand: string; model: string; year: number | null; plateNumber: string | null };
      };
    };

function revalidateAllViews() {
  revalidatePath('/');
  revalidatePath('/cek');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/services');
  revalidatePath('/admin/customers');
  revalidatePath('/admin/reports');
}

export async function GET() {
  const dataset = getServerDataset();
  return NextResponse.json(dataset);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DatasetMutationRequest;

    if (!body || !body.action) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let updated = getServerDataset();

    if (body.action === 'upsertOrder') {
      updated = upsertServerOrder(body.payload);
    } else if (body.action === 'deleteOrder') {
      updated = deleteServerOrder(body.payload.id);
    } else if (body.action === 'upsertCustomer') {
      updated = upsertServerCustomer(body.payload);
    } else if (body.action === 'addVehicle') {
      updated = addServerVehicle(body.payload.customerId, body.payload.vehicle);
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    revalidateAllViews();
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Dataset API error:', err);
    return NextResponse.json({ error: 'Failed to update dataset' }, { status: 500 });
  }
}

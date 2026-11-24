import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import {
  DeleteVehiclePayload,
  MockServiceOrder,
  UpdateVehiclePayload,
  UpsertCustomerPayload,
} from '@/lib/frontend-mock';
import {
  addServerVehicle,
  createServerWarrantyClaim,
  deleteServerCustomer,
  deleteServerOrder,
  deleteServerVehicle,
  getServerDataset,
  updateServerVehicle,
  upsertServerCustomer,
  upsertServerOrder,
} from '@/lib/dataset-store';
import { DatasetRuleError } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type DatasetMutationRequest =
  | { action: 'upsertOrder'; payload: MockServiceOrder }
  | { action: 'deleteOrder'; payload: { id: string } }
  | {
      action: 'createWarrantyClaim';
      payload: { sourceOrderId: string; sourceItemId: string; complaint?: string };
    }
  | { action: 'upsertCustomer'; payload: UpsertCustomerPayload }
  | {
      action: 'addVehicle';
      payload: {
        customerId: string;
        vehicle: {
          brand: string;
          model: string;
          year: number | null;
          plateNumber: string | null;
          vin?: string | null;
        };
      };
    }
  | { action: 'updateVehicle'; payload: UpdateVehiclePayload }
  | { action: 'deleteVehicle'; payload: DeleteVehiclePayload }
  | { action: 'deleteCustomer'; payload: { customerId: string } };

function revalidateAllViews() {
  revalidatePath('/');
  revalidatePath('/cek');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/services');
  revalidatePath('/admin/customers');
  revalidatePath('/admin/customers/[id]', 'page');
  revalidatePath('/admin/reports');
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dataset = await getServerDataset();
  return NextResponse.json(dataset);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as DatasetMutationRequest;

    if (!body || !body.action) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (body.action === 'upsertOrder') {
      const updated = await upsertServerOrder(body.payload, session.email);
      revalidateAllViews();
      return NextResponse.json(updated);
    }
    if (body.action === 'deleteOrder') {
      const updated = await deleteServerOrder(body.payload.id);
      revalidateAllViews();
      return NextResponse.json(updated);
    }
    if (body.action === 'createWarrantyClaim') {
      const { dataset, createdOrder } = await createServerWarrantyClaim(
        body.payload,
        session.email
      );
      revalidateAllViews();
      return NextResponse.json({ ...dataset, createdOrder });
    }
    if (body.action === 'upsertCustomer') {
      const updated = await upsertServerCustomer(body.payload);
      revalidateAllViews();
      return NextResponse.json(updated);
    }
    if (body.action === 'addVehicle') {
      const updated = await addServerVehicle(body.payload.customerId, body.payload.vehicle);
      revalidateAllViews();
      return NextResponse.json(updated);
    }
    if (body.action === 'updateVehicle') {
      const updated = await updateServerVehicle(body.payload);
      revalidateAllViews();
      return NextResponse.json(updated);
    }
    if (body.action === 'deleteVehicle') {
      const updated = await deleteServerVehicle(body.payload);
      revalidateAllViews();
      return NextResponse.json(updated);
    }
    if (body.action === 'deleteCustomer') {
      const updated = await deleteServerCustomer(body.payload.customerId);
      revalidateAllViews();
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err) {
    if (err instanceof DatasetRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('Dataset API error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan data ke database.' }, { status: 500 });
  }
}

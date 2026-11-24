import { CustomerType } from '@prisma/client';
import { MockServiceOrder, normalizePhone } from '@/lib/frontend-mock';

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  type: CustomerType;
  workshopName: string | null;
  address: string | null;
  vehicles: Array<{
    id: string;
    brand: string;
    model: string;
    year: number | null;
    plateNumber: string | null;
  }>;
  _count: { serviceOrders: number };
}

export function getCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function buildAllCustomers(
  customers: CustomerRow[],
  orders: MockServiceOrder[]
): CustomerRow[] {
  const map = new Map<string, CustomerRow>();

  for (const c of customers) {
    const k = c.name.trim().toLowerCase() || c.id;
    map.set(k, { ...c, vehicles: [...c.vehicles] });
  }

  for (const ord of orders) {
    const cleanName = (ord.customerName || '').trim();
    const nKey = cleanName.toLowerCase();
    if (!nKey) continue;

    const existing = map.get(nKey);
    if (existing) {
      if (ord.vehicleBrand || ord.vehicleModel) {
        const hasVeh = existing.vehicles.some((v) => {
          const samePlate =
            ord.plateNumber &&
            v.plateNumber &&
            ord.plateNumber.trim().toUpperCase() === v.plateNumber.trim().toUpperCase();
          const sameModel =
            v.brand.toLowerCase() === ord.vehicleBrand.toLowerCase() &&
            v.model.toLowerCase() === ord.vehicleModel.toLowerCase();
          return samePlate || sameModel;
        });
        if (!hasVeh) {
          existing.vehicles.push({
            id: `veh-${ord.id}`,
            brand: ord.vehicleBrand,
            model: ord.vehicleModel,
            year: ord.vehicleYear,
            plateNumber: ord.plateNumber || null,
          });
        }
      }
    } else {
      map.set(nKey, {
        id: `cust-${ord.id}`,
        name: cleanName,
        phone: ord.customerPhone || '',
        type: ord.customerType || CustomerType.PERORANGAN,
        workshopName: ord.workshopName || null,
        address: null,
        vehicles:
          ord.vehicleBrand || ord.vehicleModel
            ? [
                {
                  id: `veh-${ord.id}`,
                  brand: ord.vehicleBrand,
                  model: ord.vehicleModel,
                  year: ord.vehicleYear,
                  plateNumber: ord.plateNumber || null,
                },
              ]
            : [],
        _count: { serviceOrders: 1 },
      });
    }
  }

  return Array.from(map.values()).map((cust) => {
    const custName = cust.name.trim().toLowerCase();
    const custPhone = normalizePhone(cust.phone);
    const count = orders.filter((ord) => {
      const ordName = (ord.customerName || '').trim().toLowerCase();
      if (ordName === custName) return true;
      const ordPhone = normalizePhone(ord.customerPhone);
      return Boolean(custPhone && ordPhone && ordPhone === custPhone);
    }).length;

    return {
      ...cust,
      _count: { serviceOrders: Math.max(cust._count?.serviceOrders || 0, count) },
    };
  });
}

export function getCustomerOrders(
  customer: CustomerRow,
  orders: MockServiceOrder[]
): MockServiceOrder[] {
  const targetPhone = normalizePhone(customer.phone);
  const targetName = customer.name.trim().toLowerCase();

  return orders
    .filter((ord) => {
      const ordName = (ord.customerName || '').trim().toLowerCase();
      if (ordName === targetName) return true;
      const ordPhone = normalizePhone(ord.customerPhone);
      return Boolean(targetPhone && ordPhone && ordPhone === targetPhone);
    })
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

export function findCustomerByIdentifier(
  allCustomers: CustomerRow[],
  identifier: string
): CustomerRow | null {
  const cleanId = identifier.trim();
  if (!cleanId) return null;

  const byId = allCustomers.find((c) => c.id === cleanId);
  if (byId) return byId;

  const normalizedPhone = normalizePhone(cleanId);
  if (normalizedPhone) {
    const byPhone = allCustomers.find((c) => normalizePhone(c.phone) === normalizedPhone);
    if (byPhone) return byPhone;
  }

  const lower = cleanId.toLowerCase();
  return allCustomers.find((c) => c.name.trim().toLowerCase() === lower) || null;
}

import { CustomerType } from '@prisma/client';
import { INITIAL_CUSTOMERS } from './dataset-initial';
import {
  createUniqueId,
  getDefaultBeforeAfter,
  normalizePhone,
  normalizeWorkshopName,
  type DeleteVehiclePayload,
  type MockCustomerRow,
  type MockServiceOrder,
  type UpdateVehiclePayload,
  type UpsertCustomerPayload,
} from './dataset-types';

function normalizePlateKey(plate?: string | null): string {
  return (plate || '').replace(/\s+/g, '').toUpperCase();
}

function makeVehicleKey(brand: string, model: string, plateNumber?: string | null): string {
  const plateKey = normalizePlateKey(plateNumber);
  if (plateKey) return `plate:${plateKey}`;
  return `model:${brand.trim().toLowerCase()}|${model.trim().toLowerCase()}`;
}

function getCustomerKey(phone?: string | null, name?: string | null, id?: string): string {
  const cleanPhone = normalizePhone(phone);
  if (cleanPhone) return `phone:${cleanPhone}`;
  const cleanName = (name || '').trim().toLowerCase();
  if (cleanName) return `name:${cleanName}`;
  return id ? `id:${id}` : 'unknown';
}

export function synchronizeDataset(
  rawOrders: MockServiceOrder[],
  baseCustomers: MockCustomerRow[] = INITIAL_CUSTOMERS
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const seenOrderIds = new Set<string>();
  const seenOrderCodes = new Set<string>();
  const orders: MockServiceOrder[] = [];

  for (const raw of rawOrders) {
    const cleanCode = (raw.code || '').trim();
    if (!raw.id || seenOrderIds.has(raw.id)) continue;
    if (cleanCode && seenOrderCodes.has(cleanCode)) continue;

    seenOrderIds.add(raw.id);
    if (cleanCode) seenOrderCodes.add(cleanCode);

    orders.push({
      ...raw,
      customerName: (raw.customerName || '').trim(),
      customerPhone: normalizePhone(raw.customerPhone),
      workshopName: normalizeWorkshopName(raw.workshopName, raw.customerType),
      vehicleBrand: (raw.vehicleBrand || '').trim(),
      vehicleModel: (raw.vehicleModel || '').trim(),
      plateNumber: raw.plateNumber ? raw.plateNumber.trim().toUpperCase() : null,
      items: (raw.items || []).map((item) => {
        const defaults = getDefaultBeforeAfter(item.moduleName, raw.unitCategory);
        return {
          ...item,
          beforePhotoUrl: item.beforePhotoUrl || defaults.beforePhotoUrl,
          afterPhotoUrl: item.afterPhotoUrl || defaults.afterPhotoUrl,
          beforeCaption: item.beforeCaption || defaults.beforeCaption,
          afterCaption: item.afterCaption || defaults.afterCaption,
        };
      }),
    });
  }

  const customerMap = new Map<string, MockCustomerRow>();
  const seenGlobalPlates = new Set<string>();
  const baseIdByKey = new Map<string, string>();

  for (const base of baseCustomers) {
    const k = getCustomerKey(base.phone, base.name, base.id);
    if (k && !baseIdByKey.has(k)) baseIdByKey.set(k, base.id);
    const cleanPhone = normalizePhone(base.phone);
    if (cleanPhone && !baseIdByKey.has(`phone:${cleanPhone}`)) {
      baseIdByKey.set(`phone:${cleanPhone}`, base.id);
    }
  }

  const registerCustomer = (
    incoming: {
      id: string;
      name: string;
      phone: string;
      type: CustomerType;
      workshopName: string | null;
      address: string | null;
      vehicles: MockCustomerRow['vehicles'];
    },
    preferIncomingFields: boolean
  ) => {
    const cleanName = incoming.name.trim();
    const cleanPhone = normalizePhone(incoming.phone);
    const resolvedKey = getCustomerKey(cleanPhone, cleanName, incoming.id);

    const existing = customerMap.get(resolvedKey);
    const normalizedType = incoming.type || existing?.type || CustomerType.PERORANGAN;
    const normalizedWorkshop = normalizeWorkshopName(
      preferIncomingFields
        ? incoming.workshopName ?? existing?.workshopName
        : existing?.workshopName ?? incoming.workshopName,
      normalizedType
    );

    const mergedVehicles: MockCustomerRow['vehicles'] = [];
    const localVehicleKeys = new Set<string>();
    const vehiclePool = preferIncomingFields
      ? [...incoming.vehicles, ...(existing?.vehicles || [])]
      : [...(existing?.vehicles || []), ...incoming.vehicles];

    for (const v of vehiclePool) {
      const brand = (v.brand || '').trim();
      const model = (v.model || '').trim();
      if (!brand && !model && !v.plateNumber) continue;
      const plateUpper = v.plateNumber ? v.plateNumber.trim().toUpperCase() : null;
      const vKey = makeVehicleKey(brand, model, plateUpper);
      if (localVehicleKeys.has(vKey)) continue;
      localVehicleKeys.add(vKey);
      mergedVehicles.push({
        id: v.id,
        brand: brand || 'Unit',
        model: model || plateUpper || 'Kendaraan',
        year: v.year ?? null,
        plateNumber: plateUpper,
      });
    }

    const record: MockCustomerRow = {
      id:
        existing?.id ||
        baseIdByKey.get(resolvedKey) ||
        (cleanPhone ? baseIdByKey.get(`phone:${cleanPhone}`) : undefined) ||
        incoming.id,
      name: preferIncomingFields ? cleanName || existing?.name || 'Pelanggan' : existing?.name || cleanName || 'Pelanggan',
      phone: preferIncomingFields ? cleanPhone || existing?.phone || '' : existing?.phone || cleanPhone || '',
      type: normalizedType,
      workshopName: normalizedWorkshop,
      address: preferIncomingFields ? incoming.address || existing?.address || null : existing?.address || incoming.address || null,
      vehicles: mergedVehicles,
      _count: { serviceOrders: 0 },
    };

    customerMap.set(resolvedKey, record);
  };

  for (const ord of orders) {
    registerCustomer(
      {
        id: `cust-${ord.id}`,
        name: ord.customerName,
        phone: ord.customerPhone,
        type: ord.customerType,
        workshopName: ord.workshopName ?? null,
        address: null,
        vehicles:
          ord.vehicleBrand || ord.vehicleModel || ord.plateNumber
            ? [
                {
                  id: `veh-${ord.id}`,
                  brand: ord.vehicleBrand,
                  model: ord.vehicleModel,
                  year: ord.vehicleYear,
                  plateNumber: ord.plateNumber ?? null,
                },
              ]
            : [],
      },
      true
    );
  }

  for (const base of baseCustomers) {
    registerCustomer(
      {
        id: base.id,
        name: base.name,
        phone: base.phone,
        type: base.type,
        workshopName: base.workshopName,
        address: base.address,
        vehicles: base.vehicles,
      },
      false
    );
  }

  const customers: MockCustomerRow[] = Array.from(customerMap.values()).map((cust) => {
    const uniqueVehicles: MockCustomerRow['vehicles'] = [];
    for (const v of cust.vehicles) {
      const plateKey = normalizePlateKey(v.plateNumber);
      if (plateKey) {
        if (seenGlobalPlates.has(plateKey)) continue;
        seenGlobalPlates.add(plateKey);
      }
      uniqueVehicles.push(v);
    }

    const custPhone = normalizePhone(cust.phone);
    const custName = cust.name.trim().toLowerCase();
    const orderCount = orders.filter((ord) => {
      const ordPhone = normalizePhone(ord.customerPhone);
      if (custPhone && ordPhone) return ordPhone === custPhone;
      return ord.customerName.trim().toLowerCase() === custName;
    }).length;

    return {
      ...cust,
      vehicles: uniqueVehicles,
      _count: { serviceOrders: orderCount },
    };
  });

  return { orders, customers };
}

export function applyUpsertOrder(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  incomingOrder: MockServiceOrder
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const prevOrder = currentOrders.find((o) => o.id === incomingOrder.id);
  const oldPhone = prevOrder ? normalizePhone(prevOrder.customerPhone) : '';
  const newPhone = normalizePhone(incomingOrder.customerPhone);
  const filteredOrders = currentOrders.filter((o) => o.id !== incomingOrder.id);

  const propagatedOrders =
    prevOrder && oldPhone && newPhone && oldPhone !== newPhone
      ? filteredOrders.map((o) =>
          normalizePhone(o.customerPhone) === oldPhone
            ? {
                ...o,
                customerName: incomingOrder.customerName,
                customerPhone: newPhone,
                customerType: incomingOrder.customerType,
                workshopName: normalizeWorkshopName(
                  incomingOrder.workshopName,
                  incomingOrder.customerType
                ),
              }
            : o
        )
      : filteredOrders;

  const updatedCustomers = currentCustomers.map((c) => {
    const cPhone = normalizePhone(c.phone);
    if ((oldPhone && cPhone === oldPhone) || (newPhone && cPhone === newPhone)) {
      return {
        ...c,
        name: incomingOrder.customerName.trim() || c.name,
        phone: newPhone || c.phone,
        type: incomingOrder.customerType,
        workshopName: normalizeWorkshopName(
          incomingOrder.workshopName,
          incomingOrder.customerType
        ),
      };
    }
    return c;
  });

  return synchronizeDataset([incomingOrder, ...propagatedOrders], updatedCustomers);
}

export function applyDeleteOrder(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  orderId: string
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const remainingOrders = currentOrders.filter((o) => o.id !== orderId);
  return synchronizeDataset(remainingOrders, currentCustomers);
}

export function applyUpsertCustomer(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  payload: UpsertCustomerPayload
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const cleanPhone = normalizePhone(payload.phone);
  const oldPhone = normalizePhone(payload.previousPhone || payload.phone);
  const cleanName = payload.name.trim();
  const resolvedType = payload.type || CustomerType.PERORANGAN;
  const resolvedWorkshop = normalizeWorkshopName(payload.workshopName, resolvedType);

  const matchedCustomer = currentCustomers.find(
    (c) =>
      (payload.id && c.id === payload.id) ||
      (oldPhone && normalizePhone(c.phone) === oldPhone) ||
      (cleanPhone && normalizePhone(c.phone) === cleanPhone) ||
      (!cleanPhone && c.name.trim().toLowerCase() === cleanName.toLowerCase())
  );

  const hasVehicleInput = Boolean(
    payload.vehicle &&
      (payload.vehicle.brand.trim() || payload.vehicle.model.trim() || payload.vehicle.plateNumber?.trim())
  );

  const newVehicle =
    hasVehicleInput && payload.vehicle
      ? [
          {
            id: createUniqueId('veh'),
            brand: payload.vehicle.brand.trim() || 'Unit',
            model:
              payload.vehicle.model.trim() ||
              payload.vehicle.plateNumber?.trim().toUpperCase() ||
              'Kendaraan',
            year: payload.vehicle.year ?? null,
            plateNumber: payload.vehicle.plateNumber
              ? payload.vehicle.plateNumber.trim().toUpperCase()
              : null,
          },
        ]
      : [];

  const updatedCustomer: MockCustomerRow = {
    id: matchedCustomer?.id || payload.id || createUniqueId('cust'),
    name: cleanName || matchedCustomer?.name || 'Pelanggan',
    phone: cleanPhone || matchedCustomer?.phone || '',
    type: resolvedType,
    workshopName: resolvedWorkshop,
    address:
      payload.address !== undefined
        ? payload.address?.trim() || null
        : matchedCustomer?.address || null,
    vehicles: [...newVehicle, ...(matchedCustomer?.vehicles || [])],
    _count: { serviceOrders: matchedCustomer?._count.serviceOrders || 0 },
  };

  const updatedOrders = currentOrders.map((ord) => {
    const ordPhone = normalizePhone(ord.customerPhone);
    const sameCustomer =
      (oldPhone && ordPhone === oldPhone) ||
      (cleanPhone && ordPhone === cleanPhone) ||
      (!oldPhone && !cleanPhone && matchedCustomer && ord.customerName.trim().toLowerCase() === matchedCustomer.name.trim().toLowerCase());

    if (!sameCustomer) return ord;
    return {
      ...ord,
      customerName: updatedCustomer.name,
      customerPhone: updatedCustomer.phone || ord.customerPhone,
      customerType: updatedCustomer.type,
      workshopName: updatedCustomer.workshopName,
    };
  });

  const remainingCustomers = currentCustomers.filter((c) => c.id !== updatedCustomer.id);
  return synchronizeDataset(updatedOrders, [updatedCustomer, ...remainingCustomers]);
}

export function applyAddVehicle(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  customerId: string,
  vehicle: { brand: string; model: string; year: number | null; plateNumber: string | null }
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const updatedCustomers = currentCustomers.map((c) => {
    if (c.id !== customerId) return c;
    return {
      ...c,
      vehicles: [
        {
          id: createUniqueId('veh'),
          brand: vehicle.brand.trim() || 'Unit',
          model: vehicle.model.trim() || vehicle.plateNumber?.trim().toUpperCase() || 'Kendaraan',
          year: vehicle.year ?? null,
          plateNumber: vehicle.plateNumber ? vehicle.plateNumber.trim().toUpperCase() : null,
        },
        ...c.vehicles,
      ],
    };
  });
  return synchronizeDataset(currentOrders, updatedCustomers);
}

export function applyUpdateVehicle(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  payload: UpdateVehiclePayload
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const targetCustomer = currentCustomers.find((c) => c.id === payload.customerId);
  const oldVehicle = targetCustomer?.vehicles.find((v) => v.id === payload.vehicleId);
  const nextPlate = payload.plateNumber ? payload.plateNumber.trim().toUpperCase() : null;
  const nextBrand = payload.brand.trim() || 'Unit';
  const nextModel = payload.model.trim() || nextPlate || 'Kendaraan';

  const updatedCustomers = currentCustomers.map((c) => {
    if (c.id !== payload.customerId) return c;
    return {
      ...c,
      vehicles: c.vehicles.map((v) =>
        v.id === payload.vehicleId
          ? {
              ...v,
              brand: nextBrand,
              model: nextModel,
              year: payload.year ?? null,
              plateNumber: nextPlate,
            }
          : v
      ),
    };
  });

  const custPhone = targetCustomer ? normalizePhone(targetCustomer.phone) : '';
  const oldPlateKey = normalizePlateKey(oldVehicle?.plateNumber);
  const updatedOrders = currentOrders.map((ord) => {
    if (!custPhone || normalizePhone(ord.customerPhone) !== custPhone) return ord;
    const ordPlateKey = normalizePlateKey(ord.plateNumber);
    const sameByPlate = Boolean(oldPlateKey && ordPlateKey === oldPlateKey);
    const sameByModel =
      !oldPlateKey &&
      oldVehicle &&
      ord.vehicleBrand.toLowerCase() === oldVehicle.brand.toLowerCase() &&
      ord.vehicleModel.toLowerCase() === oldVehicle.model.toLowerCase();
    if (!sameByPlate && !sameByModel) return ord;
    return {
      ...ord,
      vehicleBrand: nextBrand,
      vehicleModel: nextModel,
      vehicleYear: payload.year ?? ord.vehicleYear,
      plateNumber: nextPlate,
    };
  });

  return synchronizeDataset(updatedOrders, updatedCustomers);
}

export function applyDeleteVehicle(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  payload: DeleteVehiclePayload
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const updatedCustomers = currentCustomers.map((c) => {
    if (c.id !== payload.customerId) return c;
    return {
      ...c,
      vehicles: c.vehicles.filter((v) => v.id !== payload.vehicleId),
    };
  });
  return synchronizeDataset(currentOrders, updatedCustomers);
}

export function applyDeleteCustomer(
  currentOrders: MockServiceOrder[],
  currentCustomers: MockCustomerRow[],
  customerId: string
): { orders: MockServiceOrder[]; customers: MockCustomerRow[] } {
  const target = currentCustomers.find((c) => c.id === customerId);
  if (!target) {
    return synchronizeDataset(currentOrders, currentCustomers);
  }
  const targetPhone = normalizePhone(target.phone);
  const hasOrders = currentOrders.some((ord) => {
    const ordPhone = normalizePhone(ord.customerPhone);
    if (targetPhone && ordPhone) return ordPhone === targetPhone;
    return ord.customerName.trim().toLowerCase() === target.name.trim().toLowerCase();
  });
  if (hasOrders) {
    return synchronizeDataset(currentOrders, currentCustomers);
  }
  const remaining = currentCustomers.filter((c) => c.id !== customerId);
  return synchronizeDataset(currentOrders, remaining);
}

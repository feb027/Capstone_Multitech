import fs from 'node:fs';
import path from 'node:path';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SERVICE_ORDERS,
  MockCustomerRow,
  MockServiceOrder,
  UpsertCustomerPayload,
  applyAddVehicle,
  applyDeleteOrder,
  applyUpsertCustomer,
  applyUpsertOrder,
  synchronizeDataset,
} from '@/lib/frontend-mock';

export interface ServerDataset {
  orders: MockServiceOrder[];
  customers: MockCustomerRow[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'multitech-dataset.json');

let cachedDataset: ServerDataset | null = null;
let cachedMtimeMs = -1;

function getDefaultDataset(): ServerDataset {
  const synced = synchronizeDataset(INITIAL_SERVICE_ORDERS, INITIAL_CUSTOMERS);
  return {
    orders: synced.orders,
    customers: synced.customers,
  };
}

function writeDatasetFile(dataset: ServerDataset): void {
  const clean: ServerDataset = {
    orders: dataset.orders,
    customers: dataset.customers,
  };
  cachedDataset = clean;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(clean, null, 2), 'utf8');
    cachedMtimeMs = fs.statSync(DATA_FILE).mtimeMs;
  } catch (err) {
    cachedMtimeMs = -1;
    console.warn('Failed writing dataset file:', err);
  }
}

export function getServerDataset(): ServerDataset {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getDefaultDataset();
      writeDatasetFile(initial);
      return initial;
    }

    const stat = fs.statSync(DATA_FILE);
    if (cachedDataset && cachedMtimeMs === stat.mtimeMs) {
      return cachedDataset;
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const synced = synchronizeDataset(
      Array.isArray(parsed.orders) ? (parsed.orders as MockServiceOrder[]) : INITIAL_SERVICE_ORDERS,
      Array.isArray(parsed.customers) ? (parsed.customers as MockCustomerRow[]) : INITIAL_CUSTOMERS
    );

    const dataset: ServerDataset = {
      orders: synced.orders,
      customers: synced.customers,
    };

    if ('spareparts' in parsed || 'moduleTypes' in parsed) {
      writeDatasetFile(dataset);
    } else {
      cachedDataset = dataset;
      cachedMtimeMs = stat.mtimeMs;
    }

    return dataset;
  } catch {
    return getDefaultDataset();
  }
}

export function upsertServerOrder(order: MockServiceOrder): ServerDataset {
  const current = getServerDataset();
  const synced = applyUpsertOrder(current.orders, current.customers, order);
  const next: ServerDataset = {
    orders: synced.orders,
    customers: synced.customers,
  };
  writeDatasetFile(next);
  return next;
}

export function deleteServerOrder(orderId: string): ServerDataset {
  const current = getServerDataset();
  const synced = applyDeleteOrder(current.orders, current.customers, orderId);
  const next: ServerDataset = {
    orders: synced.orders,
    customers: synced.customers,
  };
  writeDatasetFile(next);
  return next;
}

export function upsertServerCustomer(payload: UpsertCustomerPayload): ServerDataset {
  const current = getServerDataset();
  const synced = applyUpsertCustomer(current.orders, current.customers, payload);
  const next: ServerDataset = {
    orders: synced.orders,
    customers: synced.customers,
  };
  writeDatasetFile(next);
  return next;
}

export function addServerVehicle(
  customerId: string,
  vehicle: { brand: string; model: string; year: number | null; plateNumber: string | null }
): ServerDataset {
  const current = getServerDataset();
  const synced = applyAddVehicle(current.orders, current.customers, customerId, vehicle);
  const next: ServerDataset = {
    orders: synced.orders,
    customers: synced.customers,
  };
  writeDatasetFile(next);
  return next;
}

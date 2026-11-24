'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  INITIAL_CUSTOMERS,
  INITIAL_SERVICE_ORDERS,
  MockCustomerRow,
  MockServiceOrder,
  UpdateVehiclePayload,
  UpsertCustomerPayload,
  DeleteVehiclePayload,
  applyAddVehicle,
  applyDeleteCustomer,
  applyDeleteOrder,
  applyDeleteVehicle,
  applyUpdateVehicle,
  applyUpsertCustomer,
  applyUpsertOrder,
  synchronizeDataset,
} from '@/lib/frontend-mock';

export interface DatasetState {
  orders: MockServiceOrder[];
  customers: MockCustomerRow[];
}

export interface DatasetMutationResult extends DatasetState {
  ok: boolean;
  error?: string;
  createdOrder?: MockServiceOrder;
}

const SYNC_EVENT = 'multitech-dataset-sync';

function getInitialState(): DatasetState {
  const synced = synchronizeDataset(INITIAL_SERVICE_ORDERS, INITIAL_CUSTOMERS);
  return {
    orders: synced.orders,
    customers: synced.customers,
  };
}

let memoryStore: DatasetState = getInitialState();
let hasFetchedFromServer = false;
let activeFetchPromise: Promise<DatasetState | null> | null = null;

function broadcastDataset(next: DatasetState) {
  if (typeof window === 'undefined') return;
  memoryStore = next;
  window.dispatchEvent(new CustomEvent<DatasetState>(SYNC_EVENT, { detail: next }));
}

function fetchDatasetOnce(): Promise<DatasetState | null> {
  if (hasFetchedFromServer) {
    return Promise.resolve(memoryStore);
  }
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  activeFetchPromise = fetch('/api/dataset', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: DatasetState | null) => {
      if (!data || !Array.isArray(data.orders) || !Array.isArray(data.customers)) {
        return null;
      }
      hasFetchedFromServer = true;
      const next: DatasetState = {
        orders: data.orders,
        customers: data.customers,
      };
      broadcastDataset(next);
      return next;
    })
    .catch(() => null)
    .finally(() => {
      activeFetchPromise = null;
    });

  return activeFetchPromise;
}

export function useDataset(initialOrders?: MockServiceOrder[], initialCustomers?: MockCustomerRow[]) {
  const [state, setState] = useState<DatasetState>(() => {
    if (typeof window === 'undefined') {
      if (initialOrders && initialCustomers) {
        return { orders: initialOrders, customers: initialCustomers };
      }
      return getInitialState();
    }

    if (!hasFetchedFromServer && initialOrders && initialCustomers) {
      memoryStore = {
        orders: initialOrders,
        customers: initialCustomers,
      };
      hasFetchedFromServer = true;
    }
    return memoryStore;
  });
  const [isLoaded, setIsLoaded] = useState(() =>
    typeof window !== 'undefined' ? hasFetchedFromServer : false
  );

  useEffect(() => {
    const handleSync = (event: Event) => {
      const custom = event as CustomEvent<DatasetState>;
      if (custom.detail) {
        setState(custom.detail);
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);

    if (hasFetchedFromServer) {
      setIsLoaded(true);
      return () => {
        window.removeEventListener(SYNC_EVENT, handleSync);
      };
    }

    let active = true;
    fetchDatasetOnce().then((next) => {
      if (!active) return;
      if (next) {
        setState(next);
      }
      setIsLoaded(true);
    });

    return () => {
      active = false;
      window.removeEventListener(SYNC_EVENT, handleSync);
    };
  }, []);

  const persistMutation = useCallback(
    async (
      action: string,
      payload: unknown,
      rollbackSnapshot: DatasetState
    ): Promise<DatasetMutationResult> => {
      try {
        const res = await fetch('/api/dataset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        const body = (await res.json().catch(() => null)) as
          | (DatasetState & { createdOrder?: MockServiceOrder; error?: string })
          | null;

        if (!res.ok) {
          broadcastDataset(rollbackSnapshot);
          return {
            ...rollbackSnapshot,
            ok: false,
            error: body?.error || `Permintaan ditolak server (${res.status}).`,
          };
        }

        if (body && Array.isArray(body.orders) && Array.isArray(body.customers)) {
          hasFetchedFromServer = true;
          const canonical: DatasetState = {
            orders: body.orders,
            customers: body.customers,
          };
          broadcastDataset(canonical);
          return {
            ...canonical,
            ok: true,
            createdOrder: body.createdOrder,
          };
        }

        return { ...memoryStore, ok: true };
      } catch {
        broadcastDataset(rollbackSnapshot);
        return {
          ...rollbackSnapshot,
          ok: false,
          error: 'Gagal terhubung ke server database. Perubahan dibatalkan.',
        };
      }
    },
    []
  );

  const upsertOrder = useCallback(
    async (order: MockServiceOrder): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      const synced = applyUpsertOrder(memoryStore.orders, memoryStore.customers, order);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      return persistMutation('upsertOrder', order, rollbackSnapshot);
    },
    [persistMutation]
  );

  const createWarrantyClaim = useCallback(
    async (
      sourceOrderId: string,
      sourceItemId: string,
      complaint?: string
    ): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      return persistMutation(
        'createWarrantyClaim',
        { sourceOrderId, sourceItemId, complaint },
        rollbackSnapshot
      );
    },
    [persistMutation]
  );

  const deleteOrder = useCallback(
    async (id: string): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      const synced = applyDeleteOrder(memoryStore.orders, memoryStore.customers, id);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      return persistMutation('deleteOrder', { id }, rollbackSnapshot);
    },
    [persistMutation]
  );

  const upsertCustomer = useCallback(
    async (payload: UpsertCustomerPayload): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      const synced = applyUpsertCustomer(memoryStore.orders, memoryStore.customers, payload);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      return persistMutation('upsertCustomer', payload, rollbackSnapshot);
    },
    [persistMutation]
  );

  const addVehicle = useCallback(
    async (
      customerId: string,
      vehicle: {
        brand: string;
        model: string;
        year: number | null;
        plateNumber: string | null;
        vin?: string | null;
      }
    ): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      const synced = applyAddVehicle(memoryStore.orders, memoryStore.customers, customerId, vehicle);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      return persistMutation('addVehicle', { customerId, vehicle }, rollbackSnapshot);
    },
    [persistMutation]
  );

  const updateVehicle = useCallback(
    async (payload: UpdateVehiclePayload): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      const synced = applyUpdateVehicle(memoryStore.orders, memoryStore.customers, payload);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      return persistMutation('updateVehicle', payload, rollbackSnapshot);
    },
    [persistMutation]
  );

  const deleteVehicle = useCallback(
    async (payload: DeleteVehiclePayload): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      const synced = applyDeleteVehicle(memoryStore.orders, memoryStore.customers, payload);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      return persistMutation('deleteVehicle', payload, rollbackSnapshot);
    },
    [persistMutation]
  );

  const deleteCustomer = useCallback(
    async (customerId: string): Promise<DatasetMutationResult> => {
      const rollbackSnapshot = memoryStore;
      const synced = applyDeleteCustomer(memoryStore.orders, memoryStore.customers, customerId);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      return persistMutation('deleteCustomer', { customerId }, rollbackSnapshot);
    },
    [persistMutation]
  );

  const refreshDataset = useCallback(async () => {
    hasFetchedFromServer = false;
    return fetchDatasetOnce();
  }, []);

  return {
    orders: state.orders,
    customers: state.customers,
    isLoaded,
    upsertOrder,
    createWarrantyClaim,
    deleteOrder,
    upsertCustomer,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    deleteCustomer,
    refreshDataset,
  };
}

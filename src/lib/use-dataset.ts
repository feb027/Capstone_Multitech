'use client';

import { useCallback, useEffect, useState } from 'react';
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

interface DatasetState {
  orders: MockServiceOrder[];
  customers: MockCustomerRow[];
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
  memoryStore = next;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<DatasetState>(SYNC_EVENT, { detail: next }));
  }
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
      const synced = synchronizeDataset(data.orders, data.customers);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
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
    if (!hasFetchedFromServer && (initialOrders || initialCustomers)) {
      const synced = synchronizeDataset(
        initialOrders || memoryStore.orders,
        initialCustomers || memoryStore.customers
      );
      memoryStore = {
        orders: synced.orders,
        customers: synced.customers,
      };
    }
    return memoryStore;
  });
  const [isLoaded, setIsLoaded] = useState(hasFetchedFromServer);

  useEffect(() => {
    const handleSync = (event: Event) => {
      const custom = event as CustomEvent<DatasetState>;
      if (custom.detail) {
        setState(custom.detail);
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);

    if (hasFetchedFromServer) {
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

  const persistMutation = useCallback(async (action: string, payload: unknown) => {
    try {
      const res = await fetch('/api/dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) return;
      const serverState = (await res.json()) as DatasetState;
      if (Array.isArray(serverState.orders) && Array.isArray(serverState.customers)) {
        const synced = synchronizeDataset(serverState.orders, serverState.customers);
        broadcastDataset({
          orders: synced.orders,
          customers: synced.customers,
        });
      }
    } catch {
      // Optimistic in-memory store stays valid even if network request fails
    }
  }, []);

  const upsertOrder = useCallback(
    async (order: MockServiceOrder) => {
      const synced = applyUpsertOrder(memoryStore.orders, memoryStore.customers, order);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      await persistMutation('upsertOrder', order);
      return next;
    },
    [persistMutation]
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      const synced = applyDeleteOrder(memoryStore.orders, memoryStore.customers, id);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      await persistMutation('deleteOrder', { id });
      return next;
    },
    [persistMutation]
  );

  const upsertCustomer = useCallback(
    async (payload: UpsertCustomerPayload) => {
      const synced = applyUpsertCustomer(memoryStore.orders, memoryStore.customers, payload);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      await persistMutation('upsertCustomer', payload);
      return next;
    },
    [persistMutation]
  );

  const addVehicle = useCallback(
    async (
      customerId: string,
      vehicle: { brand: string; model: string; year: number | null; plateNumber: string | null }
    ) => {
      const synced = applyAddVehicle(memoryStore.orders, memoryStore.customers, customerId, vehicle);
      const next: DatasetState = {
        orders: synced.orders,
        customers: synced.customers,
      };
      broadcastDataset(next);
      await persistMutation('addVehicle', { customerId, vehicle });
      return next;
    },
    [persistMutation]
  );

  return {
    orders: state.orders,
    customers: state.customers,
    isLoaded,
    upsertOrder,
    deleteOrder,
    upsertCustomer,
    addVehicle,
  };
}

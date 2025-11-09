import { create } from "zustand";

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface SaleTab {
  id: string;
  customerName: string;
  billingName?: string;
  items: Item[];
  discount: number;
  total: number; // raw subtotal of items
}

interface SaleStore {
  activeSaleTab: string;
  saleTabs: Record<string, SaleTab>;
  updateCustomerName: (tabId: string, customerName: string) => void;
  updateBillingName: (tabId: string, billingName: string) => void;
  updateDiscount: (tabId: string, discount: number) => void;
  updateTotal: (tabId: string, total: number) => void; // set raw subtotal
  addSaleTab: (tabId: string, customerName?: string) => void;
  removeSaleTab: (tabId: string) => void;
}

export const useSaleStore = create<SaleStore>((set) => ({
  activeSaleTab: "",
  saleTabs: {},
  updateCustomerName: (tabId, customerName) =>
    set((state) => ({
      saleTabs: {
        ...state.saleTabs,
        [tabId]: {
          ...state.saleTabs[tabId],
          customerName,
        },
      },
    })),
  updateBillingName: (tabId, billingName) =>
    set((state) => ({
      saleTabs: {
        ...state.saleTabs,
        [tabId]: {
          ...state.saleTabs[tabId],
          billingName,
        },
      },
    })),
  // Only update discount value; do not mutate total here
  updateDiscount: (tabId, discount) =>
    set((state) => ({
      saleTabs: {
        ...state.saleTabs,
        [tabId]: {
          ...state.saleTabs[tabId],
          discount,
        },
      },
    })),
  // Store raw subtotal of items; UI will compute discounted/rounded totals
  updateTotal: (tabId, total) =>
    set((state) => ({
      saleTabs: {
        ...state.saleTabs,
        [tabId]: {
          ...state.saleTabs[tabId],
          total,
        },
      },
    })),
  addSaleTab: (tabId, customerName = "") =>
    set((state) => ({
      saleTabs: {
        ...state.saleTabs,
        [tabId]: {
          id: tabId,
          customerName,
          billingName: "",
          items: [],
          discount: 0,
          total: 0,
        },
      },
      activeSaleTab: tabId,
    })),
  removeSaleTab: (tabId) =>
    set((state) => {
      const { [tabId]: removed, ...remaining } = state.saleTabs;
      return { saleTabs: remaining };
    }),
}));

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
  items: Item[];
  discount: number;
  total: number;
}

interface SaleStore {
  activeSaleTab: string;
  saleTabs: Record<string, SaleTab>;
  updateCustomerName: (tabId: string, customerName: string) => void;
  updateDiscount: (tabId: string, discount: number) => void;
  updateTotal: (tabId: string, total: number) => void;
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
  updateDiscount: (tabId, discount) =>
    set((state) => ({
      saleTabs: {
        ...state.saleTabs,
        [tabId]: {
          ...state.saleTabs[tabId],
          discount,
          total: state.saleTabs[tabId].total * (1 - discount / 100),
        },
      },
    })),
  updateTotal: (tabId, total) =>
    set((state) => ({
      saleTabs: {
        ...state.saleTabs,
        [tabId]: {
          ...state.saleTabs[tabId],
          total: total * (1 - (state.saleTabs[tabId]?.discount || 0) / 100),
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

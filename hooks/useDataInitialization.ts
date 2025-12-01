import { useEffect } from "react";
import { useProductStore } from "@/store/useProductStore";
import { useInvoiceStore } from "@/store/useInvoiceStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUserStore } from "@/store/useUserStore";
import { initializeMockData } from "@/lib/mock-data";

export function useDataInitialization() {
  const {
    setProducts,
    setPriceAgreements,
    setFakePriceRules,
    setPriceHistory,
  } = useProductStore();
  const { setAdditionalCharges } = useInvoiceStore();
  const { setAdditionalCharges: setSettingsCharges, setSystemSettings } =
    useSettingsStore();
  const { setCurrentUser, setRoles, setUserPermissions, setAuthenticated } =
    useUserStore();

  useEffect(() => {
    // Initialize mock data only once
    const mockData = initializeMockData();

    // Set up product data
    setProducts(mockData.products);
    setPriceAgreements(mockData.priceAgreements);
    setPriceHistory(mockData.priceHistory);
    setFakePriceRules([]); // No fake price rules for now

    // Set up invoice data
    // Price agreements are handled by product store

    // Set up settings data
    setSettingsCharges(mockData.additionalCharges);
    setSystemSettings([]); // Will be populated from settings page

    // Set up user data - simulate logged in user
    setCurrentUser(mockData.users[1]); // Store Manager
    setRoles(mockData.roles);
    setUserPermissions([]); // Will be derived from role
    setAuthenticated(true);

    console.log("Mock data initialized successfully");
  }, [
    setProducts,
    setPriceAgreements,
    setFakePriceRules,
    setPriceHistory,
    setAdditionalCharges,
    setSettingsCharges,
    setSystemSettings,
    setCurrentUser,
    setRoles,
    setUserPermissions,
    setAuthenticated,
  ]);
}
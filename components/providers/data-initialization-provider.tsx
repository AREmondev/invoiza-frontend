"use client";

import { ReactNode } from "react";
import { useDataInitialization } from "@/hooks/useDataInitialization";

interface DataInitializationProviderProps {
  children: ReactNode;
}

export function DataInitializationProvider({
  children,
}: DataInitializationProviderProps) {
  useDataInitialization();

  return <>{children}</>;
}

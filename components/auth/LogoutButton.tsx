"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <Button variant="ghost" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
}


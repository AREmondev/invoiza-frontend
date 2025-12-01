"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Receipt,
  Settings,
  Store,
  FileText,
  CreditCard,
  Shield,
  History,
  Package,
  FolderTree,
  Warehouse,
  Ruler,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: { module: "dashboard", action: "view" } },
  { name: "Sales", href: "/sales", icon: ShoppingCart, permission: { module: "sales", action: "view" } },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart, permission: { module: "purchases", action: "view" } },
  { name: "Customers", href: "/customers", icon: Users, permission: { module: "customers", action: "view" } },
  { name: "Products", href: "/products", icon: Store, permission: { module: "products", action: "view" } },
  { name: "Brands", href: "/brands", icon: Package, permission: { module: "products", action: "view" } },
  { name: "Categories", href: "/categories", icon: FolderTree, permission: { module: "products", action: "view" } },
  { name: "Godowns", href: "/godowns", icon: Warehouse, permission: { module: "products", action: "view" } },
  { name: "Units", href: "/units", icon: Ruler, permission: { module: "products", action: "view" } },
  { name: "Invoices", href: "/invoices", icon: Receipt, permission: { module: "invoices", action: "view" } },
  { name: "Banking", href: "/banking", icon: CreditCard, permission: { module: "banking", action: "view" } },
  { name: "Reports", href: "/reports", icon: FileText, permission: { module: "reports", action: "view" } },
  { name: "Audit Logs", href: "/audit-logs", icon: History, permission: { module: "audit", action: "view" } },
  { name: "Roles & Permissions", href: "/roles-permissions", icon: Shield, permission: { module: "permissions", action: "view" } },
  { name: "Settings", href: "/settings", icon: Settings, permission: { module: "settings", action: "view" } },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isSuperAdmin, isLoading } = usePermissions();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Store className="h-8 w-8" />
          <span className="ml-2 text-lg font-semibold">POS System</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  // Super admins can see everything, others need permission
                  // During loading, show items if user might be super admin (optimistic)
                  const canView = isSuperAdmin || 
                    (isLoading ? true : hasPermission(item.permission.module, item.permission.action));
                  
                  if (!canView) {
                    return null;
                  }
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

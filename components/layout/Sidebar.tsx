"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  ChevronDown,
  ChevronRight,
  UserCog,
  Wallet,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  permission: { module: string; action: string };
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: { module: "dashboard", action: "view" } },
  {
    name: "Sales & Purchases",
    icon: ShoppingCart,
    permission: { module: "sales", action: "view" },
    children: [
      { name: "Sales", href: "/sales", icon: ShoppingCart, permission: { module: "sales", action: "view" } },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart, permission: { module: "purchases", action: "view" } },
      { name: "Invoices", href: "/invoices", icon: Receipt, permission: { module: "invoices", action: "view" } },
    ],
  },
  {
    name: "Products",
    icon: Store,
    permission: { module: "products", action: "view" },
    children: [
      { name: "Products", href: "/products", icon: Store, permission: { module: "products", action: "view" } },
      { name: "Brands", href: "/brands", icon: Package, permission: { module: "products", action: "view" } },
      { name: "Categories", href: "/categories", icon: FolderTree, permission: { module: "products", action: "view" } },
      { name: "Godowns", href: "/godowns", icon: Warehouse, permission: { module: "products", action: "view" } },
      { name: "Units", href: "/units", icon: Ruler, permission: { module: "products", action: "view" } },
    ],
  },
  { name: "Customers", href: "/customers", icon: Users, permission: { module: "customers", action: "view" } },
  {
    name: "Settings",
    icon: Settings,
    permission: { module: "settings", action: "view" },
    children: [
      { name: "Commission Agents", href: "/commission-agents", icon: UserCog, permission: { module: "settings", action: "view" } },
      { name: "Payment Methods", href: "/payment-methods", icon: Wallet, permission: { module: "settings", action: "view" } },
      { name: "System Settings", href: "/settings", icon: Settings, permission: { module: "settings", action: "view" } },
    ],
  },
  { name: "Banking", href: "/banking", icon: CreditCard, permission: { module: "banking", action: "view" } },
  { name: "Reports", href: "/reports", icon: FileText, permission: { module: "reports", action: "view" } },
  { name: "Audit Logs", href: "/audit-logs", icon: History, permission: { module: "audit", action: "view" } },
  { name: "Roles & Permissions", href: "/roles-permissions", icon: Shield, permission: { module: "permissions", action: "view" } },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isSuperAdmin, isLoading } = usePermissions();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const checkCanView = (item: NavigationItem): boolean => {
    if (isSuperAdmin) return true;
    if (isLoading) return true;
    
    const hasItemPermission = hasPermission(item.permission.module, item.permission.action);
    
    if (item.children) {
      // For groups, check if any child is viewable
      return hasItemPermission && item.children.some(child => checkCanView(child));
    }
    
    return hasItemPermission;
  };

  const isActive = (item: NavigationItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some(child => child.href === pathname);
    }
    return false;
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Store className="h-8 w-8" />
          <span className="ml-2 text-lg font-semibold">POS System</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              if (!checkCanView(item)) {
                return null;
              }

              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedGroups[item.name] ?? false;
              const itemIsActive = isActive(item);

              if (hasChildren) {
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={cn(
                        "flex w-full items-center justify-between gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                        itemIsActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-x-3">
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="ml-4 mt-1 space-y-1 border-l pl-4">
                        {item.children!.map((child) => {
                          if (!checkCanView(child)) {
                            return null;
                          }
                          const ChildIcon = child.icon;
                          const childIsActive = pathname === child.href;
                          
                          return (
                            <li key={child.name}>
                              <Link
                                href={child.href!}
                                className={cn(
                                  "flex items-center gap-x-3 rounded-md p-2 text-sm leading-6",
                                  childIsActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <ChildIcon className="h-4 w-4" />
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                      itemIsActive
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
        </nav>
      </div>
    </div>
  );
}

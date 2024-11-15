"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
  BarChart,
} from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Products",
    icon: Package,
    href: "/products",
    color: "text-violet-500",
  },
  {
    label: "Sales",
    icon: Receipt,
    href: "/sales",
    color: "text-pink-700",
  },
  {
    label: "Purchases",
    icon: ShoppingCart,
    href: "/purchases",
    color: "text-orange-700",
  },
  {
    label: "Banking & Cash",
    icon: Wallet,
    href: "/banking",
    color: "text-emerald-500",
  },
  {
    label: "Reports",
    icon: BarChart,
    href: "/reports",
    color: "text-blue-700",
  },
  {
    label: "Customers",
    icon: Users,
    href: "/customers",
    color: "text-green-700",
  },
  {
    label: "Invoices",
    icon: Receipt,
    href: "/invoices",
    color: "text-yellow-600",
  },
];

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-x-2">
            <route.icon className={cn("h-4 w-4", route.color)} />
            {route.label}
          </div>
        </Link>
      ))}
    </nav>
  );
}

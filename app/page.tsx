'use client';

import { useEffect, useState } from 'react';
import { Overview } from '@/components/dashboard/Overview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, ShoppingCart, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { useProductStore } from '@/store/useProductStore';
import { useInvoiceStore } from '@/store/useInvoiceStore';
import { useUserStore } from '@/store/useUserStore';

export default function Home() {
  const { products, getLowStockProducts } = useProductStore();
  const { salesInvoices, purchaseInvoices } = useInvoiceStore();
  const { currentUser } = useUserStore();
  const [stats, setStats] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  console.log('currentUser', currentUser);
  useEffect(() => {
    // Calculate real statistics from store data
    const totalRevenue = salesInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0);
    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0);
    const lowStock = getLowStockProducts();
    
    setStats([
      {
        name: 'Total Revenue',
        value: `$${(totalRevenue / 100).toLocaleString()}`,
        icon: DollarSign,
        change: '+12.5%',
        trend: 'up',
      },
      {
        name: 'Total Products',
        value: products.length.toString(),
        icon: Package,
        change: '+5.2%',
        trend: 'up',
      },
      {
        name: 'Sales Invoices',
        value: salesInvoices.length.toString(),
        icon: ShoppingCart,
        change: '+8.1%',
        trend: 'up',
      },
      {
        name: 'Low Stock Items',
        value: lowStock.length.toString(),
        icon: AlertTriangle,
        change: lowStock.length > 0 ? 'Needs attention' : 'Good',
        trend: lowStock.length > 0 ? 'down' : 'up',
      },
    ]);
    
    setLowStockProducts(lowStock);
  }, [products, salesInvoices, purchaseInvoices, getLowStockProducts]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {currentUser?.name || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Your business performance at a glance
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {stat.change}
                  </span>{' '}
                  {stat.name !== 'Low Stock Items' && 'from last month'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="flex justify-between items-center">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-orange-600">
                    {product.stockQuantity} remaining
                  </span>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-sm text-orange-600 mt-2">
                  and {lowStockProducts.length - 3} more items...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Overview />
        </CardContent>
      </Card>
    </div>
  );
}
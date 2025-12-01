"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReport } from "@/components/reports/SalesReport";
import { SalesReportAdvanced } from "@/components/reports/sales-report-advanced";
import { PurchaseReport } from "@/components/reports/PurchaseReport";
import { InventoryReport } from "@/components/reports/InventoryReport";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function ReportsPage() {
  const [useAdvancedTable, setUseAdvancedTable] = useState(true);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseAdvancedTable(!useAdvancedTable)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {useAdvancedTable ? "Use Basic Table" : "Use Advanced Table"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345.67</div>
            <p className="text-xs text-muted-foreground">
              +10.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="purchases">Purchase Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          {useAdvancedTable ? (
            <SalesReportAdvanced userId="current-user" />
          ) : (
            <SalesReport />
          )}
        </TabsContent>
        <TabsContent value="purchases">
          <PurchaseReport />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankList } from "@/components/banking/BankList";
import { BankListAdvanced } from "@/components/banking/bank-list-advanced";
import { CashTransactions } from "@/components/banking/CashTransactions";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function BankingPage() {
  const [useAdvancedTable, setUseAdvancedTable] = useState(true);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Banking & Cash</h1>
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
            <CardTitle className="text-sm font-medium">
              Total Bank Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345.67</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,234.56</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
          <TabsTrigger value="cash">Cash Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="bank">
          {useAdvancedTable ? (
            <BankListAdvanced userId="current-user" />
          ) : (
            <BankList />
          )}
        </TabsContent>
        <TabsContent value="cash">
          <CashTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

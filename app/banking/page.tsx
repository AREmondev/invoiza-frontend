"use client";

import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankListAdvanced } from "@/components/banking/bank-list-advanced";
import { CashTransactions } from "@/components/banking/CashTransactions";
import { api } from "@/lib/convex";
import { formatCurrency } from "@/lib/currency";

export default function BankingPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  // Fetch bank payment methods
  const bankMethods = useQuery(
    api.queries.paymentMethods.getPaymentMethodsByType,
    userEmail ? { userEmail, type: "bank" } : "skip"
  ) || [];

  // Fetch cash payment methods
  const cashMethods = useQuery(
    api.queries.paymentMethods.getPaymentMethodsByType,
    userEmail ? { userEmail, type: "cash" } : "skip"
  ) || [];

  // Calculate total bank balance
  const totalBankBalance = bankMethods.reduce(
    (sum: number, method: any) => sum + (method.balanceCents || 0),
    0
  );

  // Calculate total cash balance
  const totalCashBalance = cashMethods.reduce(
    (sum: number, method: any) => sum + (method.balanceCents || 0),
    0
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Banking & Cash</h1>
        <p className="text-muted-foreground">
          Manage bank accounts and cash transactions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bank Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBankBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bankMethods.length} bank account{bankMethods.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCashBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {cashMethods.length} cash register{cashMethods.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBankBalance + totalCashBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Combined balance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bank" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
          <TabsTrigger value="cash">Cash Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="bank">
          <BankListAdvanced userId={userEmail || "default"} />
        </TabsContent>
        <TabsContent value="cash">
          <CashTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { api } from "@/lib/convex";
import { formatCurrency } from "@/lib/currency";
import { useMemo } from "react";

export function CashTransactions() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  // Fetch cash payment methods
  const cashMethods = useQuery(
    api.queries.paymentMethods.getPaymentMethodsByType,
    userEmail ? { userEmail, type: "cash" } : "skip"
  ) || [];

  // Fetch all payments made with cash payment methods
  const allPayments = useQuery(
    api.queries.payments.getPayments,
    userEmail ? { userEmail } : "skip"
  ) || [];

  // Filter cash payments and transform for display
  const cashTransactions = useMemo(() => {
    const cashMethodCodes = cashMethods.map((m: any) => m.code);
    const cashPayments = allPayments.filter((p: any) =>
      cashMethodCodes.includes(p.paymentMethod)
    );

    return cashPayments
      .map((payment: any) => {
        const method = cashMethods.find((m: any) => m.code === payment.paymentMethod);
        return {
          id: payment._id,
          date: new Date(payment.paymentDate),
          description: `Payment - Invoice ${payment.invoiceId}`,
          type: "Income",
          amount: payment.amountCents,
          paymentMethod: method?.name || payment.paymentMethod,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 50); // Show last 50 transactions
  }, [allPayments, cashMethods]);

  if (cashMethods.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          No cash payment methods configured. Add a cash payment method in Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Cash Transactions</h2>
        <p className="text-sm text-muted-foreground">
          Recent cash payments and transactions
        </p>
      </div>

      {cashTransactions.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No cash transactions found</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(transaction.date, "MMM dd, yyyy")}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === "Income" ? "default" : "destructive"}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

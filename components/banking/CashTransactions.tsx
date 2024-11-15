"use client";

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

const transactions = [
  {
    id: "1",
    date: new Date("2024-03-15"),
    description: "Cash Sale",
    type: "Income",
    amount: 500.0,
  },
  {
    id: "2",
    date: new Date("2024-03-14"),
    description: "Office Supplies",
    type: "Expense",
    amount: 150.0,
  },
];

export function CashTransactions() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{format(transaction.date, "MMM dd, yyyy")}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    transaction.type === "Income" ? "default" : "destructive"
                  }
                >
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell>${transaction.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

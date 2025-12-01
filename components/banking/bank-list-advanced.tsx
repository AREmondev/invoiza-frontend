"use client";

import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BankListAdvancedProps {
  userId?: string;
}

// Type for bank account data
interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  type: string;
  status: string;
  lastTransaction: Date;
}

// Mock data for bank accounts
const bankAccountsData: BankAccount[] = [
  {
    id: "1",
    bankName: "Chase Bank",
    accountNumber: "****1234",
    balance: 8234.5,
    type: "Checking",
    status: "Active",
    lastTransaction: new Date("2024-03-15"),
  },
  {
    id: "2",
    bankName: "Bank of America",
    accountNumber: "****5678",
    balance: 4111.17,
    type: "Savings",
    status: "Active",
    lastTransaction: new Date("2024-03-14"),
  },
  {
    id: "3",
    bankName: "Wells Fargo",
    accountNumber: "****9012",
    balance: 15678.25,
    type: "Business",
    status: "Active",
    lastTransaction: new Date("2024-03-13"),
  },
  {
    id: "4",
    bankName: "Citibank",
    accountNumber: "****3456",
    balance: 2345.8,
    type: "Checking",
    status: "Inactive",
    lastTransaction: new Date("2024-03-10"),
  },
  {
    id: "5",
    bankName: "HSBC",
    accountNumber: "****7890",
    balance: 9876.15,
    type: "Savings",
    status: "Active",
    lastTransaction: new Date("2024-03-12"),
  },
];

export function BankListAdvanced({ userId }: BankListAdvancedProps) {
  const columns: AdvancedColumnDef<BankAccount, unknown>[] = [
    {
      accessorKey: "bankName",
      header: "Bank Name",
      filterConfig: {
        type: "text",
        placeholder: "Filter by bank name"
      }
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      filterConfig: {
        type: "text",
        placeholder: "Filter by account number"
      }
    },
    {
      accessorKey: "type",
      header: "Account Type",
      filterConfig: {
        type: "select",
        options: [
          { label: "Checking", value: "Checking" },
          { label: "Savings", value: "Savings" },
          { label: "Business", value: "Business" }
        ],
        placeholder: "Filter by type"
      }
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const balance = row.getValue("balance") as number;
        return (
          <div className="text-right font-medium">
            ${balance.toFixed(2)}
          </div>
        );
      },
      filterConfig: {
        type: "range",
        placeholder: "Filter by balance"
      },
      aggregationFn: "sum"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "Active" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
      filterConfig: {
        type: "select",
        options: [
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" }
        ],
        placeholder: "Filter by status"
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditAccount(account.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteAccount(account.id)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleEditAccount = (id: string) => {
    console.log("Edit account:", id);
  };

  const handleDeleteAccount = (id: string) => {
    console.log("Delete account:", id);
  };

  return (
    <div className="space-y-4">
      <AdvancedDataTable
        columns={columns as any}
        data={bankAccountsData}
        tableId="banking-accounts"
        userId={userId ?? "default"}
        searchable={true}
        columnVisibility={true}
        pagination={true}
        rowSelection={true}
        enableGrouping={true}
        enableExport={true}
        exportFormats={["csv", "excel"]}
        enableAdvancedFilters={true}
        enableMultiSort={true}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 25, 50, 100]}
      />
    </div>
  );
}
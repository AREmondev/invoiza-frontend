"use client";

import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import { format } from "date-fns";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";

interface SalesReportAdvancedProps {
  userId?: string;
}

// Mock data for sales reports
const salesReportData = [
  {
    id: "1",
    date: new Date("2024-03-15"),
    totalSales: 2500.0,
    numberOfOrders: 12,
    averageOrderValue: 208.33,
    productCategory: "Electronics",
    salesRep: "John Doe",
  },
  {
    id: "2",
    date: new Date("2024-03-14"),
    totalSales: 1800.0,
    numberOfOrders: 8,
    averageOrderValue: 225.0,
    productCategory: "Clothing",
    salesRep: "Jane Smith",
  },
  {
    id: "3",
    date: new Date("2024-03-13"),
    totalSales: 3200.5,
    numberOfOrders: 15,
    averageOrderValue: 213.37,
    productCategory: "Electronics",
    salesRep: "John Doe",
  },
  {
    id: "4",
    date: new Date("2024-03-12"),
    totalSales: 1500.75,
    numberOfOrders: 6,
    averageOrderValue: 250.13,
    productCategory: "Home & Garden",
    salesRep: "Mike Johnson",
  },
  {
    id: "5",
    date: new Date("2024-03-11"),
    totalSales: 2800.25,
    numberOfOrders: 18,
    averageOrderValue: 155.57,
    productCategory: "Clothing",
    salesRep: "Jane Smith",
  },
];

export function SalesReportAdvanced({ userId }: SalesReportAdvancedProps) {
  const columns: AdvancedColumnDef<typeof salesReportData[0], any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(row.getValue("date"), "MMM dd, yyyy"),
      filterConfig: {
        type: "date",
        placeholder: "Filter by date"
      }
    },
    {
      accessorKey: "totalSales",
      header: "Total Sales",
      cell: ({ row }) => `$${(row.getValue("totalSales") as number).toFixed(2)}`,
      filterConfig: {
        type: "range",
        min: 0,
        max: 5000,
        placeholder: "Filter by sales range"
      }
    },
    {
      accessorKey: "numberOfOrders",
      header: "Number of Orders",
      filterConfig: {
        type: "range",
        min: 0,
        max: 50,
        placeholder: "Filter by order count"
      }
    },
    {
      accessorKey: "averageOrderValue",
      header: "Average Order Value",
      cell: ({ row }) => `$${(row.getValue("averageOrderValue") as number).toFixed(2)}`,
      filterConfig: {
        type: "range",
        min: 0,
        max: 500,
        placeholder: "Filter by average value"
      }
    },
    {
      accessorKey: "productCategory",
      header: "Product Category",
      filterConfig: {
        type: "select",
        options: [
          { label: "Electronics", value: "Electronics" },
          { label: "Clothing", value: "Clothing" },
          { label: "Home & Garden", value: "Home & Garden" }
        ],
        placeholder: "Filter by category"
      }
    },
    {
      accessorKey: "salesRep",
      header: "Sales Representative",
      filterConfig: {
        type: "select",
        options: [
          { label: "John Doe", value: "John Doe" },
          { label: "Jane Smith", value: "Jane Smith" },
          { label: "Mike Johnson", value: "Mike Johnson" }
        ],
        placeholder: "Filter by sales rep"
      }
    },
  ];

  return (
    <div className="space-y-4">
      <AdvancedDataTable
        columns={columns as AdvancedColumnDef<unknown, unknown>[]}
        data={salesReportData}
        tableId="sales-report"
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
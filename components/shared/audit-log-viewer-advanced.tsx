"use client";

import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";
import type { AuditLog } from "@/types/models";

interface AuditLogViewerAdvancedProps {
  userId?: string;
  entityType?: string;
  entityId?: string;
}

// Mock data for audit logs
const auditLogsData: AuditLog[] = [
  {
    id: "1",
    action: "create",
    entityType: "sale",
    entityId: "sale_001",
    userId: "user_001",
    userName: "John Doe",
    createdAt: new Date("2024-03-15T10:30:00Z"),
    updatedAt: new Date("2024-03-15T10:30:00Z"),
    createdBy: "user_001",
    updatedBy: "user_001",
    changes: [
      { field: "customerId", oldValue: null, newValue: "customer_001", dataType: "string" },
      { field: "total", oldValue: null, newValue: 1500, dataType: "number" }
    ],
    metadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
    },
  },
  {
    id: "2",
    action: "update",
    entityType: "product",
    entityId: "product_001",
    userId: "user_002",
    userName: "Jane Smith",
    createdAt: new Date("2024-03-15T11:15:00Z"),
    updatedAt: new Date("2024-03-15T11:15:00Z"),
    createdBy: "user_002",
    updatedBy: "user_002",
    changes: [
      { field: "price", oldValue: 100, newValue: 120, dataType: "number" }
    ],
    metadata: {
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0...",
    },
  },
  {
    id: "3",
    action: "delete",
    entityType: "customer",
    entityId: "customer_002",
    userId: "user_001",
    userName: "John Doe",
    createdAt: new Date("2024-03-15T14:20:00Z"),
    updatedAt: new Date("2024-03-15T14:20:00Z"),
    createdBy: "user_001",
    updatedBy: "user_001",
    changes: [
      { field: "name", oldValue: "Test Customer", newValue: null, dataType: "string" },
      { field: "email", oldValue: "test@example.com", newValue: null, dataType: "string" }
    ],
    metadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
    },
  },
  {
    id: "4",
    action: "create",
    entityType: "user",
    entityId: "user_003",
    userId: "user_003",
    userName: "Bob Johnson",
    createdAt: new Date("2024-03-15T16:45:00Z"),
    updatedAt: new Date("2024-03-15T16:45:00Z"),
    createdBy: "user_003",
    updatedBy: "user_003",
    changes: [],
    metadata: {
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0...",
    },
  },
  {
    id: "5",
    action: "update",
    entityType: "sale",
    entityId: "sale_002",
    userId: "user_002",
    userName: "Jane Smith",
    createdAt: new Date("2024-03-15T18:30:00Z"),
    updatedAt: new Date("2024-03-15T18:30:00Z"),
    createdBy: "user_002",
    updatedBy: "user_002",
    changes: [
      { field: "agreedPrice", oldValue: 200, newValue: 180, dataType: "number" }
    ],
    metadata: {
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0...",
      violationType: "below_agreement",
    },
  },
];

export function AuditLogViewerAdvanced({ userId, entityType, entityId }: AuditLogViewerAdvancedProps) {
  
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "login":
        return "outline";
      case "price_violation":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const columns: AdvancedColumnDef<AuditLog, any>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => format(new Date(row.getValue("createdAt")), "MMM dd, yyyy HH:mm"),
      filterConfig: {
        type: "date",
        placeholder: "Filter by date"
      }
    },
    {
      accessorKey: "userName",
      header: "User",
      filterConfig: {
        type: "text",
        placeholder: "Filter by user"
      }
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return (
          <Badge variant={getActionBadgeVariant(action)}>
            {action}
          </Badge>
        );
      },
      filterConfig: {
        type: "select",
        options: [
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "Delete", value: "delete" },
          { label: "Login", value: "login" },
          { label: "Price Violation", value: "price_violation" }
        ],
        placeholder: "Filter by action"
      }
    },
    {
      accessorKey: "entityType",
      header: "Entity Type",
      filterConfig: {
        type: "select",
        options: [
          { label: "Sale", value: "sale" },
          { label: "Product", value: "product" },
          { label: "Customer", value: "customer" },
          { label: "User", value: "user" }
        ],
        placeholder: "Filter by entity type"
      }
    },
    {
      accessorKey: "entityId",
      header: "Entity ID",
      cell: ({ row }) => (
        <code className="text-xs font-mono">
          {row.getValue("entityId")}
        </code>
      ),
      filterConfig: {
        type: "text",
        placeholder: "Filter by entity ID"
      }
    },
    {
      accessorKey: "changes",
      header: "Changes",
      cell: ({ row }) => {
        const changes = row.getValue("changes") as any[];
        return (
          <div className="max-w-xs truncate">
            {changes.length > 0 ? (
              <code className="text-xs">
                {JSON.stringify(changes).slice(0, 50)}...
              </code>
            ) : (
              <span className="text-muted-foreground">No changes</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "metadata.ipAddress",
      header: "IP Address",
      cell: ({ row }) => {
        const metadata = row.original.metadata;
        return metadata?.ipAddress || "N/A";
      },
      filterConfig: {
        type: "text",
        placeholder: "Filter by IP address"
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const log = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportLog(log)}>
                Export Log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleViewDetails = (log: AuditLog) => {
    console.log("View details for log:", log);
  };

  const handleExportLog = (log: AuditLog) => {
    const logData = {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userName: log.userName,
      timestamp: log.createdAt,
      changes: log.changes,
      metadata: log.metadata
    };
    
    const jsonContent = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${log.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <AdvancedDataTable
        columns={columns as AdvancedColumnDef<unknown, unknown>[]}
        data={auditLogsData}
        tableId="audit-logs"
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
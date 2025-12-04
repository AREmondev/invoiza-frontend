"use client";

import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
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
import { useMemo } from "react";

interface AuditLogViewerAdvancedProps {
  userId?: string;
  entityType?: string;
  entityId?: string;
}

export function AuditLogViewerAdvanced({ userId, entityType, entityId }: AuditLogViewerAdvancedProps) {
  // Build query args - only include userId if it's a valid Convex ID format
  // Convex IDs are strings that don't contain hyphens or spaces
  const queryArgs = useMemo(() => {
    const args: any = { limit: 1000 };
    
    if (entityType && entityId) {
      args.entityType = entityType;
      args.entityId = entityId;
    } else if (entityType) {
      args.entityType = entityType;
    } else if (userId && !userId.includes("-") && !userId.includes(" ") && userId.length > 5) {
      // Only pass userId if it looks like a Convex ID (no hyphens/spaces, reasonable length)
      // This filters out strings like "current-user"
      args.userId = userId as any;
    }
    
    return args;
  }, [userId, entityType, entityId]);

  // Fetch audit logs from Convex
  const convexLogs = useQuery(
    api.queries.auditLogs.getAuditLogs,
    queryArgs
  );

  // Transform Convex audit logs to match AuditLog type
  const auditLogsData: AuditLog[] = useMemo(() => {
    if (!convexLogs) return [];

    return convexLogs.map((log) => ({
      id: log._id,
      action: log.action as AuditLog["action"],
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.userName,
      createdAt: new Date(log.timestamp),
      updatedAt: new Date(log.updatedAt),
      createdBy: log.userId,
      updatedBy: log.userId,
      changes: log.changes.map((change) => ({
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        dataType: change.dataType,
      })),
      metadata: log.metadata || {},
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));
  }, [convexLogs]);
  
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
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(date, "MMM dd, yyyy HH:mm");
      },
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
          { label: "Product", value: "product" },
          { label: "Brand", value: "brand" },
          { label: "Category", value: "category" },
          { label: "Unit", value: "unit" },
          { label: "Godown", value: "godown" },
          { label: "Sale", value: "sale" },
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

  if (convexLogs === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {auditLogsData.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">No audit logs found</div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
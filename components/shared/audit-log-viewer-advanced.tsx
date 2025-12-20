"use client";

import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Download, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { AdvancedColumnDef } from "@/components/ui/advanced-data-table";
import type { AuditLog } from "@/types/models";
import { useMemo, useState } from "react";

interface AuditLogViewerAdvancedProps {
  userId?: string;
  entityType?: string;
  entityId?: string;
}

export function AuditLogViewerAdvanced({ userId, entityType, entityId }: AuditLogViewerAdvancedProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

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
          { label: "Product", value: "products" },
          { label: "Brand", value: "brands" },
          { label: "Category", value: "categories" },
          { label: "Unit", value: "units" },
          { label: "Godown", value: "godowns" },
          { label: "Invoice", value: "invoices" },
          { label: "Customer", value: "customers" },
          { label: "User", value: "users" },
          { label: "Payment Method", value: "paymentMethods" },
          { label: "Commission Agent", value: "commissionAgents" },
          { label: "Payment", value: "payments" },
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
        if (changes.length === 0) {
          return <span className="text-muted-foreground text-sm">No changes</span>;
        }
        return (
          <div className="max-w-xs">
            <Badge variant="outline" className="text-xs">
              {changes.length} field{changes.length !== 1 ? 's' : ''} changed
            </Badge>
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
              <DropdownMenuItem onClick={() => {
                setSelectedLog(log);
                setDetailsDialogOpen(true);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportLog(log)}>
                <Download className="h-4 w-4 mr-2" />
                Export Log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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

  const formatValue = (value: any, dataType: string): string => {
    if (value === null || value === undefined) return "N/A";
    if (dataType === "date" || value instanceof Date) {
      return format(new Date(value), "MMM dd, yyyy HH:mm:ss");
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
        <Lock className="h-4 w-4" />
        <span>Audit logs are read-only and cannot be edited or deleted. All changes are permanently recorded.</span>
      </div>
      
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

      {/* Audit Log Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete audit trail information. This log is read-only and cannot be modified.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Action</p>
                      <Badge variant={getActionBadgeVariant(selectedLog.action)} className="mt-1">
                        {selectedLog.action}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                      <p className="text-sm mt-1">{format(selectedLog.createdAt, "MMM dd, yyyy HH:mm:ss")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">User</p>
                      <p className="text-sm mt-1">{selectedLog.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
                      <p className="text-sm mt-1 font-mono">{selectedLog.entityType}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
                      <code className="text-xs font-mono bg-muted p-1 rounded mt-1 block break-all">
                        {selectedLog.entityId}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Changes */}
              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Changes</CardTitle>
                    <CardDescription>
                      {selectedLog.changes.length} field{selectedLog.changes.length !== 1 ? 's' : ''} modified
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedLog.changes.map((change, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{change.field}</span>
                            <Badge variant="outline" className="text-xs">
                              {change.dataType}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Old Value</p>
                              <code className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded block break-all">
                                {formatValue(change.oldValue, change.dataType)}
                              </code>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">New Value</p>
                              <code className="text-xs bg-green-50 dark:bg-green-950 p-2 rounded block break-all">
                                {formatValue(change.newValue, change.dataType)}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              {(selectedLog.metadata || selectedLog.ipAddress || selectedLog.userAgent) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedLog.ipAddress && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                        <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                      </div>
                    )}
                    {selectedLog.userAgent && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                        <p className="text-sm break-all">{selectedLog.userAgent}</p>
                      </div>
                    )}
                    {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Additional Metadata</p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleExportLog(selectedLog)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Log
                </Button>
                <Button onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
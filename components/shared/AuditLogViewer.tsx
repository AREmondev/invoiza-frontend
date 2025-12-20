"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Search, Filter, Download, RefreshCw, Calendar, User, Activity, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuditTimeline } from "@/components/shared/AuditTimeline";
import { useUserStore } from "@/store/useUserStore";
import { api } from "@/lib/convex";
import type { AuditLog } from "@/types/models";

interface AuditLogViewerProps {
  entityType?: string;
  entityId?: string;
  compact?: boolean;
}

export function AuditLogViewer({ entityType, entityId, compact = false }: AuditLogViewerProps) {
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [viewMode, setViewMode] = useState<"table" | "timeline">("timeline");
  
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { currentUser, hasPermission } = useUserStore();

  // Build query args
  const queryArgs = useMemo(() => {
    const args: any = { limit: 1000 };
    
    if (entityType && entityId) {
      args.entityType = entityType;
      args.entityId = entityId;
    } else if (entityType) {
      args.entityType = entityType;
    }
    
    return args;
  }, [entityType, entityId]);

  // Fetch audit logs from Convex
  const convexLogs = useQuery(
    api.queries.auditLogs.getAuditLogs,
    queryArgs
  );

  // Transform Convex audit logs to match AuditLog type
  const auditLogs: AuditLog[] = useMemo(() => {
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

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, actionFilter, userFilter, dateRange]);

  const filterLogs = () => {
    let filtered = [...auditLogs];

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.changes).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (userFilter !== "all") {
      filtered = filtered.filter(log => log.userId === userFilter);
    }

    if (dateRange.from) {
      filtered = filtered.filter(log => 
        new Date(log.createdAt) >= dateRange.from!
      );
    }

    if (dateRange.to) {
      filtered = filtered.filter(log => 
        new Date(log.createdAt) <= dateRange.to!
      );
    }

    setFilteredLogs(filtered);
  };

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

  const exportLogs = () => {
    const csvContent = [
      ["Date", "User", "Action", "Entity Type", "Entity ID", "Changes"],
      ...filteredLogs.map(log => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.userName,
        log.action,
        log.entityType,
        log.entityId,
        JSON.stringify(log.changes)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasPermission("audit", "view")) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">You don't have permission to view audit logs.</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAuditLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        
        <AuditTimeline
          auditLogs={filteredLogs.slice(0, 5)}
          entityType={entityType || ""}
          entityId={entityId || ""}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="price_violation">Price Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {Array.from(new Set(auditLogs.map(log => log.userId)))
                    .map(userId => {
                      const log = auditLogs.find(l => l.userId === userId);
                      return log ? (
                        <SelectItem key={userId} value={userId}>
                          {log.userName}
                        </SelectItem>
                      ) : null;
                    })
                    .filter(Boolean)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange as any}
                    onSelect={setDateRange as any}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {auditLogs.length} logs
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
              >
                <Activity className="h-4 w-4 mr-2" />
                Timeline
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <Filter className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {viewMode === "timeline" ? (
        <AuditTimeline
          auditLogs={filteredLogs}
          entityType={entityType || ""}
          entityId={entityId || ""}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No audit logs found matching your criteria.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {log.userName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell className="font-mono text-sm">{log.entityId}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {Object.keys(log.changes).length > 0 ? (
                              <code className="text-xs">
                                {JSON.stringify(log.changes).slice(0, 50)}...
                              </code>
                            ) : (
                              <span className="text-muted-foreground">No changes</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
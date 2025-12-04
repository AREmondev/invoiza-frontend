"use client";

import { useState, useMemo } from 'react';
import { Clock, User, Edit, Trash, Plus, CheckCircle, XCircle, AlertCircle, Filter, Calendar, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserStore } from '@/store/useUserStore';
import { AuditLog, AuditAction } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AuditTimelineProps {
  entityType: string;
  entityId: string;
  auditLogs: AuditLog[];
  className?: string;
}

interface AuditFilters {
  action?: AuditAction;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export function AuditTimeline({ 
  entityType, 
  entityId, 
  auditLogs,
  className 
}: AuditTimelineProps) {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const { currentUser } = useUserStore();
  
  // Get unique users from audit logs
  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>();
    auditLogs.forEach(log => {
      users.set(log.userId, log.userName);
    });
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  }, [auditLogs]);

  // Filter audit logs based on current filters
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Action filter
      if (filters.action && log.action !== filters.action) return false;
      
      // User filter
      if (filters.userId && log.userId !== filters.userId) return false;
      
      // Date range filter
      if (filters.dateRange) {
        const logDate = new Date(log.createdAt);
        if (logDate < filters.dateRange.start || logDate > filters.dateRange.end) return false;
      }
      
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesUser = log.userName.toLowerCase().includes(query);
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesChanges = log.changes.some(change => 
          change.field.toLowerCase().includes(query) ||
          JSON.stringify(change.oldValue).toLowerCase().includes(query) ||
          JSON.stringify(change.newValue).toLowerCase().includes(query)
        );
        
        if (!matchesUser && !matchesAction && !matchesChanges) return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [auditLogs, filters]);

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-green-600" />;
      case 'update': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete': return <Trash className="h-4 w-4 text-red-600" />;
      case 'approve': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancel': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getActionBadgeVariant = (action: AuditAction) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'approve': return 'default';
      case 'cancel': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatChangeValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof AuditFilters] !== undefined
  );

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Audit Timeline</h3>
            <Badge variant="outline">{filteredLogs.length} events</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
            
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="p-3 bg-accent/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={filters.searchQuery || ''}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select
                  value={filters.action || '__all__'}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    action: value === '__all__' ? undefined : (value as AuditAction)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="cancel">Cancel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select
                  value={filters.userId || '__all__'}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    userId: value === '__all__' ? undefined : value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={filters.dateRange ? 'custom' : '__all__'}
                  onValueChange={(value) => {
                    if (value === 'today') {
                      const today = new Date();
                      setFilters({ 
                        ...filters, 
                        dateRange: {
                          start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
                        }
                      });
                    } else if (value === 'week') {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 7);
                      setFilters({ 
                        ...filters, 
                        dateRange: { start, end }
                      });
                    } else if (value === 'month') {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 30);
                      setFilters({ 
                        ...filters, 
                        dateRange: { start, end }
                      });
                    } else {
                      const { dateRange, ...rest } = filters;
                      setFilters(rest);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Timeline */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No audit events found</p>
            {hasActiveFilters && (
              <p className="text-xs mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="relative">
                  {/* Timeline line */}
                  {index < filteredLogs.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                    
                    {/* Content */}
                    <Card className="flex-1 p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              by {log.userName}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>

                        {/* Changes */}
                        {log.changes.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Changes:</div>
                            <div className="space-y-1">
                              {log.changes.map((change, changeIndex) => (
                                <div key={changeIndex} className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-muted-foreground">{change.field}:</span>
                                  <span className="line-through text-muted-foreground">
                                    {formatChangeValue(change.oldValue)}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    → {formatChangeValue(change.newValue)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {Object.keys(log.metadata).length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground">
                              Additional metadata available
                            </div>
                          </div>
                        )}

                        {/* IP and User Agent */}
                        {(log.ipAddress || log.userAgent) && (
                          <div className="pt-2 border-t text-xs text-muted-foreground">
                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                            {log.ipAddress && log.userAgent && <span className="mx-2">•</span>}
                            {log.userAgent && <span>User Agent: {log.userAgent}</span>}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredLogs.filter(log => log.action === 'create').length}
              </div>
              <div className="text-xs text-muted-foreground">Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredLogs.filter(log => log.action === 'update').length}
              </div>
              <div className="text-xs text-muted-foreground">Updated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {filteredLogs.filter(log => log.action === 'delete').length}
              </div>
              <div className="text-xs text-muted-foreground">Deleted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredLogs.filter(log => log.action === 'approve').length}
              </div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {filteredLogs.filter(log => log.action === 'cancel').length}
              </div>
              <div className="text-xs text-muted-foreground">Cancelled</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
"use client";

import { AuditLogViewerAdvanced } from "@/components/shared/audit-log-viewer-advanced";

export default function AuditLogsPage() {
  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all system activities, user actions, and data changes. All logs are read-only and permanently recorded.
        </p>
      </div>
      
      <AuditLogViewerAdvanced />
    </div>
  );
}
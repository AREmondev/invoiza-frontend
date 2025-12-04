"use client";

import { useState } from "react";
import { AuditLogViewer } from "@/components/shared/AuditLogViewer";
import { AuditLogViewerAdvanced } from "@/components/shared/audit-log-viewer-advanced";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function AuditLogsPage() {
  const [useAdvancedTable, setUseAdvancedTable] = useState(true);

  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities, user actions, and data changes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseAdvancedTable(!useAdvancedTable)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {useAdvancedTable ? "Use Basic Table" : "Use Advanced Table"}
        </Button>
      </div>
      
      {useAdvancedTable ? (
        <AuditLogViewerAdvanced />
      ) : (
        <AuditLogViewer />
      )}
    </div>
  );
}
"use client";

import { CommissionAgentList } from "@/components/commission-agents/commission-agent-list";

export default function CommissionAgentsPage() {
  return (
    <div className="p-6 h-[calc(100vh-65px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Commission Agents</h1>
        <p className="text-muted-foreground">
          Manage commission agents for your organization
        </p>
      </div>
      <CommissionAgentList />
    </div>
  );
}


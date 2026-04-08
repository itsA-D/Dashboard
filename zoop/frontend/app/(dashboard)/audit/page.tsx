"use client";

import { PageShell } from "@/components/common/page-shell";
import { SimpleTable } from "@/components/common/simple-table";
import { useAuditLogs } from "@/hooks/use-audit";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const auditQuery = useAuditLogs();

  return (
    <PageShell eyebrow="Audit trail" title="Immutable activity log" description="State-changing events are exposed to finance and admin roles through the backend audit endpoint.">
      <SimpleTable
        columns={["Action", "Entity", "Actor", "IP", "Timestamp"]}
        rows={(auditQuery.data ?? []).map((log) => [
          log.action,
          `${log.entity_type} ${log.entity_id.slice(0, 8)}`,
          log.actor_name || "System",
          log.ip_address || "—",
          formatDate(log.created_at, "dd MMM yyyy, p")
        ])}
      />
    </PageShell>
  );
}

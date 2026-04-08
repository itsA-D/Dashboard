"use client";

import { ApprovalQueue } from "@/components/approval/approval-queue";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { useApprovalQueue } from "@/hooks/use-approvals";

export default function ApprovalsPage() {
  const queueQuery = useApprovalQueue();

  return (
    <PageShell eyebrow="Action queue" title="Pending approvals" description="Manager and finance approvals in one fast-moving queue.">
      {!queueQuery.data?.length ? (
        <EmptyState title="Queue is clear" description="There are no pending approvals for you right now." />
      ) : (
        <ApprovalQueue expenses={queueQuery.data} />
      )}
    </PageShell>
  );
}

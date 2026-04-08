"use client";

import { useState } from "react";
import { DataPanel } from "@/components/common/data-panel";
import { PageShell } from "@/components/common/page-shell";
import { useGenerateReport, useReport } from "@/hooks/use-dashboard";

export default function ReportsPage() {
  const [reportId, setReportId] = useState<string | null>(null);
  const generateMutation = useGenerateReport();
  const reportQuery = useReport(reportId);

  return (
    <PageShell eyebrow="Exports" title="Async reporting" description="Generate finance exports without locking the UI while the backend worker prepares the file.">
      <DataPanel title="Generate report" subtitle="This triggers the backend async generation endpoint">
        <button
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          onClick={() =>
            generateMutation.mutate(
              { report_type: "expenses" },
              {
                onSuccess: (data) => setReportId(data.report_id)
              }
            )
          }
        >
          {generateMutation.isPending ? "Generating..." : "Generate expense report"}
        </button>
        {reportId ? <p className="mt-4 text-sm text-slate">Report id: {reportId}</p> : null}
        {reportQuery.data ? (
          <div className="mt-4 rounded-2xl bg-paper p-4 text-sm text-slate">
            <p>Status: {reportQuery.data.status}</p>
            {reportQuery.data.content ? <pre className="mt-3 overflow-auto text-xs">{reportQuery.data.content}</pre> : null}
          </div>
        ) : null}
      </DataPanel>
    </PageShell>
  );
}

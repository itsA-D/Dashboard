"use client";

import { CategoryChart } from "@/components/dashboard/category-chart";
import { SpendTrendChart } from "@/components/dashboard/spend-trend-chart";
import { DataPanel } from "@/components/common/data-panel";
import { LoadingState } from "@/components/common/loading-state";
import { PageShell } from "@/components/common/page-shell";
import { StatCard } from "@/components/common/stat-card";
import { useDashboardAnalytics } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const analyticsQuery = useDashboardAnalytics();

  if (analyticsQuery.isLoading) {
    return <LoadingState />;
  }

  const analytics = analyticsQuery.data;
  if (!analytics) {
    return <div className="text-sm text-slate">Dashboard data is unavailable.</div>;
  }

  return (
    <PageShell eyebrow="Finance overview" title="Company spend pulse" description="A dense control surface for finance and admin teams.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total spend MTD" value={analytics.total_spend_mtd} currency />
        <StatCard label="Active employees" value={analytics.active_employees} tone="moss" />
        <StatCard label="Pending approvals" value={analytics.pending_approvals} tone="ember" />
        <StatCard label="Cards issued" value={analytics.cards_issued} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <DataPanel title="Spend trend" subtitle="Approved expenses over the last six months">
          <SpendTrendChart data={analytics.monthly_trend} />
        </DataPanel>
        <DataPanel title="Category mix" subtitle="Where the money is going this month">
          <CategoryChart data={analytics.category_breakdown} />
        </DataPanel>
      </div>
    </PageShell>
  );
}

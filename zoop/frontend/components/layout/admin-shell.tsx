import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell-grid">
      <Sidebar
        title="Control room"
        navigation={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/employees", label: "Employees" },
          { href: "/expenses", label: "Expenses" },
          { href: "/approvals", label: "Approvals" },
          { href: "/cards", label: "Cards" },
          { href: "/budgets", label: "Budgets" },
          { href: "/reports", label: "Reports" },
          { href: "/audit", label: "Audit" },
          { href: "/settings", label: "Settings" }
        ]}
      />
      <main className="min-w-0 p-4 lg:p-8">
        <Topbar />
        {children}
      </main>
    </div>
  );
}

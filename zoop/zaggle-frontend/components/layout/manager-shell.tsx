import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function ManagerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell-grid">
      <Sidebar
        title="Approvals"
        navigation={[
          { href: "/approvals", label: "Queue" },
          { href: "/expenses", label: "Team expenses" },
          { href: "/me", label: "My space" }
        ]}
      />
      <main className="min-w-0 p-4 lg:p-8">
        <Topbar />
        {children}
      </main>
    </div>
  );
}

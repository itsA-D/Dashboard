import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
      <Topbar />
      {children}
      <BottomNav />
    </div>
  );
}

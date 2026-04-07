"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AdminShell } from "@/components/layout/admin-shell";
import { ManagerShell } from "@/components/layout/manager-shell";
import { EmployeeShell } from "@/components/layout/employee-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    if (!user) {
      return;
    }

    if (user.role === "employee" && !pathname.startsWith("/me")) {
      router.replace("/me");
    }
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return <div className="p-8 text-sm text-slate">Loading session...</div>;
  }

  if (user.role === "admin" || user.role === "finance") {
    return <AdminShell>{children}</AdminShell>;
  }

  if (user.role === "manager") {
    return <ManagerShell>{children}</ManagerShell>;
  }

  return <EmployeeShell>{children}</EmployeeShell>;
}

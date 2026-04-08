"use client";

import { EmptyState } from "@/components/common/empty-state";
import { PageShell } from "@/components/common/page-shell";
import { SimpleTable } from "@/components/common/simple-table";
import { useUsers } from "@/hooks/use-users";
import { formatDate } from "@/lib/utils";

export default function EmployeesPage() {
  const usersQuery = useUsers();

  return (
    <PageShell eyebrow="People" title="Employee directory" description="The backend exposes the team list; admin-only editing can be layered onto this table.">
      {!usersQuery.data?.length ? (
        <EmptyState title="No users yet" description="Create company users from the backend API or admin flow." />
      ) : (
        <SimpleTable
          columns={["Name", "Email", "Role", "Department", "Status", "Joined"]}
          rows={usersQuery.data.map((user) => [
            user.full_name,
            user.email,
            user.role,
            user.department || "—",
            user.is_active ? "Active" : "Inactive",
            formatDate(user.created_at)
          ])}
        />
      )}
    </PageShell>
  );
}

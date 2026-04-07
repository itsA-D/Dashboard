"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { getInitials } from "@/lib/utils";

export function Topbar() {
  const { user } = useAuth();
  const notificationsQuery = useNotifications();
  const unreadCount = useMemo(
    () => notificationsQuery.data?.filter((notification) => !notification.is_read).length ?? 0,
    [notificationsQuery.data]
  );

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-white/60 bg-white/70 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate">Signed in as</p>
        <h3 className="mt-2 text-xl font-semibold text-ink">{user?.full_name}</h3>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-paper px-4 py-2 text-sm text-ink">
          Notifications <span className="font-semibold">{unreadCount}</span>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
          {getInitials(user?.full_name ?? "NA")}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { getInitials } from "@/lib/utils";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";

export function Topbar() {
  const { user, clearSession } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsQuery = useNotifications();
  
  const unreadCount = useMemo(
    () => notificationsQuery.data?.filter((notification) => !notification.is_read).length ?? 0,
    [notificationsQuery.data]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-40 mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-white/60 bg-white/70 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between backdrop-blur-sm">
      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate/80">Signed in as</p>
        <h3 className="mt-2 text-xl font-semibold text-ink tracking-tight">{user?.full_name}</h3>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-paper/80 border border-ink/5 px-4 py-2 text-sm text-ink font-medium backdrop-blur-sm shadow-sm transition-all hover:bg-paper">
          Notifications <span className="font-bold text-ink/80">{unreadCount}</span>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="group flex items-center gap-2.5 rounded-full bg-white/50 border border-white/60 p-1.5 pr-4 pl-1.5 shadow-sm transition-all hover:bg-white/80 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-ink/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white shadow-sm ring-2 ring-white/50 transition-transform group-hover:scale-105">
              {getInitials(user?.full_name ?? "NA")}
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-xs font-bold text-ink leading-tight">Account</span>
              <span className="text-[10px] font-medium text-slate/70 leading-tight">Settings</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate/60 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-4 w-72 origin-top-right rounded-3xl border border-white/60 bg-white/90 p-3 shadow-[0_30px_90px_rgba(16,34,60,0.15)] backdrop-blur-2xl animate-in fade-in zoom-in slide-in-from-top-2 duration-300 z-[100]">
              <div className="px-4 py-4 mb-2 rounded-2xl bg-gradient-to-br from-paper to-white/50 border border-ink/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-lg font-bold text-white shadow-lg">
                    {getInitials(user?.full_name ?? "NA")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate tracking-tight">{user?.full_name}</p>
                    <p className="text-xs font-medium text-slate/70 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-lg bg-ink text-[10px] uppercase tracking-widest text-white font-black shadow-sm">
                  {user?.role}
                </div>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate transition-all hover:bg-ink/5 hover:text-ink group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper text-slate transition-all group-hover:bg-white group-hover:text-ink group-hover:shadow-sm">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold tracking-tight">Profile Settings</span>
                </button>
                
                <div className="h-px bg-ink/5 mx-2 my-1" />
                
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    clearSession();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-500 transition-all hover:bg-red-50 hover:text-red-700 group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50/50 text-red-500 transition-all group-hover:bg-red-100 group-hover:text-red-600 group-hover:shadow-sm">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-bold tracking-tight">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

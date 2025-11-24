"use client";

import type { CSSProperties } from "react";

import { AppSidebar } from "@/app/components/AppSidebar";
import { AppSidebarProvider } from "@/app/components/AppSidebar/context";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const mobileSidebarStyle = {
    "--sidebar-width": "100%",
  } as CSSProperties;

  return (
    <ProtectedRoute>
      <AppSidebarProvider>
        {isMobile ? (
          <div className="flex min-h-svh flex-col bg-background w-full">
            <div className="flex flex-1 flex-col" style={mobileSidebarStyle}>
              <AppSidebar.HomeButton />
              <div className="flex flex-col gap-2 mt-auto w-full mb-4 px-2">
                <AppSidebar.LogoutButton />
                <AppSidebar.UserProfile />
              </div>
            </div>
            <div className="border-border border-t bg-red-400 px-4 py-6 text-center text-sm text-white">
              Dashboard nie jest dostępny na urządzeniach mobilnych.
            </div>
          </div>
        ) : (
          <div className="flex min-h-svh">
            <div className="sticky top-0 h-svh flex-shrink-0">
              <AppSidebar className="w-full" />
            </div>
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        )}
      </AppSidebarProvider>
    </ProtectedRoute>
  );
}

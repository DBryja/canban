"use client";

import { AppSidebar } from "@/app/components/AppSidebar";
import { AppSidebarProvider } from "@/app/components/AppSidebar/context";
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppSidebarProvider>
        <div className="flex h-screen sticky top-0">
          <AppSidebar />
        </div>
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </AppSidebarProvider>
    </ProtectedRoute>
  );
}

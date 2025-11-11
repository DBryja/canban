"use client";

import { SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/AppSidebar";
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen sticky top-0">
          <AppSidebar />
        </div>
        <main className="flex-1 overflow-auto p-4">
            {children}
        </main>
      </SidebarProvider>
    </ProtectedRoute>
  );
}


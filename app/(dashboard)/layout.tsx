"use client";
import { AppSidebar } from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Topbar />
          <div className="p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

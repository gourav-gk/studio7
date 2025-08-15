"use client";

import { useAuth } from "@/context/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "./shared/LoadingSpinner";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, permissions, isAuthLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Allow access to dashboard and common routes without specific permissions
    const allowedRoutes = ["dashboard", "employee", "attendance", "accounts", "projects", "clients", "enquiry", "events", "packages", "shoots", "deliverables", "task"];
    const routeSegment = pathname.split("/")[1];
    
    if (routeSegment && !allowedRoutes.includes(routeSegment)) {
      // Check if user has specific permissions for this route
      if (!permissions.includes(routeSegment)) {
        router.replace("/unauthorized");
        return;
      }
    }

    setAllowed(true);
  }, [user, permissions, pathname, isAuthLoaded]);

  return (
    <>
      {children}
      {(!isAuthLoaded || !allowed) && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-[2px] z-50">
          <LoadingSpinner message="Checking access..." />
        </div>
      )}
    </>
  );
}

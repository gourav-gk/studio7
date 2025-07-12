"use client";

import { useAuth } from "@/context/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

    const routeSegment = pathname.split("/")[1];
    if (routeSegment && !permissions.includes(routeSegment)) {
      router.replace("/unauthorized");
      return;
    }

    setAllowed(true);
  }, [user, permissions, pathname, isAuthLoaded]);

  if (!isAuthLoaded) return <div className="text-center mt-10">Checking access...</div>;

  return allowed ? <>{children}</> : null;
}

"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "@radix-ui/react-separator";

function Topbar() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter((segment) => segment && !/^[0-9a-fA-F]{24}$/.test(segment) && isNaN(Number(segment)))
    .map((segment) => segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            {segments.map((segment, index) => (
              <React.Fragment key={segment + index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === segments.length - 1 ? (
                    <BreadcrumbPage>{segment}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href="#">{segment}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

export default Topbar;

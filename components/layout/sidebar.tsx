"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Command,
  SquareTerminal,
  Users,
  Briefcase,
  FolderKanban,
  Camera,
  ClipboardList,
  CheckSquare,
  IndianRupee,
  Calendar,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthProvider";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
    },
    {
      title: "Enquiry",
      url: "/enquiry",
      icon: Bot,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Bot,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: BookOpen,
      items: [
        { title: "Add Project", url: "/projects/add" },
        { title: "Project Shoots", url: "/projects/shoots" },
        { title: "Project Deliverables", url: "/projects/deliverables" },
      ],
    },
    {
      title: "Employee",
      url: "#",
      icon: Users,
      items: [
        { title: "View", url: "/employee/view" },
        { title: "Employee Task", url: "/employee/employee-task" },
        { title: "Attendance", url: "/employee/attendance" },
        { title: "Salary", url: "/employee/salary" },
      ],
    },
    {
      title: "Events",
      url: "/events",
      icon: Calendar,
    },
    {
      title: "Packages",
      url: "/packages",
      icon: Briefcase,
    },
    {
      title: "Shoots",
      url: "/shoots",
      icon: Camera,
    },
    {
      title: "Deliverables",
      url: "/deliverables",
      icon: ClipboardList,
    },
    {
      title: "Task",
      url: "/task",
      icon: FolderKanban,
    },
    {
      title: "Attendance",
      url: "/attendance",
      icon: CheckSquare,
    },
    {
      title: "Accounts",
      url: "#",
      icon: IndianRupee,
      items: [
        { title: "Transaction", url: "/accounts/transaction" },
        { title: "Salary", url: "/accounts/salary" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const userDisplay = {
    name: user?.displayName || "Guest",
    email: user?.email || "No Email",
    avatar: user?.photoURL || "/avatars/default.jpg",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Studio7</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userDisplay} />
      </SidebarFooter>
    </Sidebar>
  );
}

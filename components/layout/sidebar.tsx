"use client";

import * as React from "react";
import { BookOpen, Bot, Command, Settings2, SquareTerminal } from "lucide-react";

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
      title: "Dahboard",
      url: "/dashboard",
      icon: SquareTerminal,
    },
    {
      title: "Enquiry",
      url: "/enquiry",
      icon: Bot,
      // items: [
      //   {
      //     title: "Add New",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Clients",
      url: "#",
      icon: Bot,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
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

"use client";

// External dependencies
import * as React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

// Internal components
import { NavMain } from "@/features/dashboard/components/sidebar/nav-main";
import { NavWorkspace } from "@/features/dashboard/components/sidebar/nav-workspace";
import { NavSecondary } from "@/features/dashboard/components/sidebar/nav-secondary";
import { NavUser } from "@/features/dashboard/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { sidebarMenus } from "@/data/sidebar-menus";
import { useUser } from "@/hooks/use-user";
import { useGodRole } from "@/hooks/use-god-role";

/**
 * AppSidebar Component
 *
 * Main application sidebar with navigation sections for the dashboard.
 * Includes app logo/header, main navigation, workspace selection,
 * secondary links, and user profile.
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  const { data: user, isLoading, isFetching } = useUser();
  const isGod = useGodRole();
  const isUserLoading = isLoading || isFetching || !user;

  // Persist sidebar open state in localStorage
  React.useEffect(() => {
    localStorage.setItem("sidebar-open", open.toString());
  }, [open]);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      {...props}
      aria-label="Main navigation"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/dashboard"
                className="hover:bg-transparent"
                aria-label="Go to dashboard home"
              >
                <div
                  className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                  aria-hidden="true"
                >
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Salesy</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarMenus.navMain} />
        {isGod ? <GodSection /> : null}
        <NavWorkspace workspaces={sidebarMenus.workspaces} />
        <NavSecondary items={sidebarMenus.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {isUserLoading ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-3 w-32 rounded-full" />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <NavUser user={user!} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function GodSection() {
  return (
    <SidebarMenu className="mt-2">
      <SidebarMenuItem>
        <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          God Admin
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/dashboard-dikshithpodhila-god">God Console</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/dashboard-dikshithpodhila-god/orgs">Organizations</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/dashboard-dikshithpodhila-god/orgs/new">Create Organization</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/dashboard-dikshithpodhila-god/plans">Plans</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/dashboard-dikshithpodhila-god/subscriptions">Subscriptions</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/dashboard-dikshithpodhila-god/login">God Login</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

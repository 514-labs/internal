"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SignedIn, UserButton, useOrganizationList } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  Building2,
  Briefcase,
  FlaskConical,
  Settings,
  Plug,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    shortcut: "D",
  },
  {
    title: "Work",
    url: "/work",
    icon: Briefcase,
    shortcut: "W",
  },
  {
    title: "Experiments",
    url: "/experiments",
    icon: FlaskConical,
    shortcut: "X",
  },
  {
    title: "Metrics",
    url: "/metrics",
    icon: TrendingUp,
    shortcut: "M",
  },
  {
    title: "Teams",
    url: "/teams",
    icon: Users,
    shortcut: "E",
  },
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
    shortcut: "G",
  },
  {
    title: "Company",
    url: "/company",
    icon: Building2,
    shortcut: "C",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  // Check if user is admin in any organization
  const isAdmin =
    userMemberships?.data?.some(
      (membership) => membership.role === "org:admin"
    ) ?? false;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Option (Alt) is pressed and no other modifiers
      if (e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        // Use code instead of key to get the physical key pressed
        // e.code is like "KeyD", "KeyM", etc.
        const code = e.code;
        if (code.startsWith("Key")) {
          const letter = code.replace("Key", "").toLowerCase();
          const item = menuItems.find(
            (item) => item.shortcut.toLowerCase() === letter
          );
          if (item) {
            e.preventDefault();
            router.push(item.url);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <span className="text-xl font-bold">Internal 514</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          ⌥{item.shortcut}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/settings/integrations"}
                  >
                    <Link href="/settings/integrations">
                      <Plug className="h-4 w-4" />
                      <span>Integrations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SignedIn>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <div className="flex items-center gap-2 px-2">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8",
                      },
                    }}
                  />
                  <span className="text-sm font-medium">Profile</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SignedIn>
      </SidebarFooter>
    </Sidebar>
  );
}

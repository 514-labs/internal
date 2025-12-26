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
import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  LineChart,
  Briefcase,
  Target,
  Users,
  BookOpen,
  Compass,
  Scale,
  PlayCircle,
  Plug,
} from "lucide-react";

// Top-level items (before Performance group)
const overviewItems = [
  {
    title: "Overview",
    url: "/",
    icon: LayoutDashboard,
    shortcut: "O",
  },
];

// Performance section
const performanceItems = [
  {
    title: "Metrics",
    url: "/metrics",
    icon: TrendingUp,
    shortcut: "M",
  },
  {
    title: "Financials",
    url: "/financials",
    icon: DollarSign,
    shortcut: "F",
  },
  {
    title: "Trends",
    url: "/trends",
    icon: LineChart,
    shortcut: "T",
  },
];

// Execution section
const executionItems = [
  {
    title: "Work",
    url: "/work",
    icon: Briefcase,
    shortcut: "W",
  },
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
    shortcut: "G",
  },
  {
    title: "Teams",
    url: "/teams",
    icon: Users,
    shortcut: "E",
  },
];

// Knowledge section
const knowledgeItems = [
  {
    title: "Handbook",
    url: "/handbook",
    icon: BookOpen,
    shortcut: "H",
  },
  {
    title: "Strategy",
    url: "/strategy",
    icon: Compass,
    shortcut: "S",
  },
  {
    title: "Decisions",
    url: "/decisions",
    icon: Scale,
    shortcut: "D",
  },
  {
    title: "Playbooks",
    url: "/playbooks",
    icon: PlayCircle,
    shortcut: "P",
  },
];

// Admin section
const adminItems = [
  {
    title: "Integrations",
    url: "/admin/integrations",
    icon: Plug,
    shortcut: "I",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const allItems = [
    ...overviewItems,
    ...performanceItems,
    ...executionItems,
    ...knowledgeItems,
    ...adminItems,
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        const code = e.code;
        if (code.startsWith("Key")) {
          const letter = code.replace("Key", "").toLowerCase();
          const item = allItems.find(
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

  const renderMenuItem = (item: (typeof allItems)[0]) => {
    const Icon = item.icon;
    const isActive =
      item.url === "/"
        ? pathname === "/"
        : pathname.startsWith(item.url);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive}>
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
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <span className="text-xl font-bold">Internal 514</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Performance */}
        <SidebarGroup>
          <SidebarGroupLabel>Performance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {performanceItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Execution */}
        <SidebarGroup>
          <SidebarGroupLabel>Execution</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {executionItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Knowledge */}
        <SidebarGroup>
          <SidebarGroupLabel>Knowledge</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {knowledgeItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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

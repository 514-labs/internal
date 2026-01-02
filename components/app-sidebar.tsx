"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
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
  Boxes,
  Scale,
  PlayCircle,
  Plug,
  Citrus,
  Package,
  Wrench,
  Rss,
  Calendar,
} from "lucide-react";

// Top-level items (before Performance group)
const overviewItems = [
  {
    title: "Overview",
    url: "/",
    icon: LayoutDashboard,
    shortcut: "O",
  },
  {
    title: "Strategy",
    url: "/strategy",
    icon: Compass,
    shortcut: "S",
  },
  {
    title: "Feed",
    url: "/feed",
    icon: Rss,
    shortcut: "A",
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    shortcut: "C",
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
    title: "Products",
    url: "/products",
    icon: Package,
    shortcut: "U",
  },
  {
    title: "Services",
    url: "/services",
    icon: Wrench,
    shortcut: "V",
  },
  {
    title: "Frameworks",
    url: "/frameworks",
    icon: Boxes,
    shortcut: "R",
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

// Fun section
const funItems = [
  {
    title: "Lemon Prizes",
    url: "/lemon-prizes",
    icon: Citrus,
    shortcut: "L",
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
    ...funItems,
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
      item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={`${item.title} (⌥${item.shortcut})`}
        >
          <Link href={item.url} prefetch={true}>
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
            <span className="ml-auto text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              ⌥{item.shortcut}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-transparent">
              <Link href="/" className="flex items-center ">
                <Image
                  src="/logo-dark.png"
                  alt="Logo"
                  width={16}
                  height={16}
                  className="dark:hidden size-4 shrink-0"
                />
                <Image
                  src="/logo-light.png"
                  alt="Logo"
                  width={16}
                  height={16}
                  className="hidden dark:block size-4 shrink-0"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{overviewItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Performance */}
        <SidebarGroup>
          <SidebarGroupLabel>Performance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{performanceItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Execution */}
        <SidebarGroup>
          <SidebarGroupLabel>Execution</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{executionItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Knowledge */}
        <SidebarGroup>
          <SidebarGroupLabel>Knowledge</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{knowledgeItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Fun */}
        <SidebarGroup>
          <SidebarGroupLabel>Fun</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{funItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{adminItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

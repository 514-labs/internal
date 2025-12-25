"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumb } from "@/components/breadcrumb-provider";
import { Home } from "lucide-react";

// Map pathnames to page titles
const pathToTitle: Record<string, string> = {
  "/": "Dashboard",
  "/work": "Work",
  "/metrics": "Metrics",
  "/experiments": "Experiments",
  "/teams": "Teams",
  "/goals": "Goals",
  "/company": "Company",
  "/settings/integrations": "Integrations",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const { items } = useBreadcrumb();

  // Get the page title from pathname
  const pageTitle = pathToTitle[pathname] || "Dashboard";

  // Build breadcrumb segments
  const segments: Array<{ label: string; href?: string; isLast: boolean }> = [];

  // Always start with Home
  segments.push({
    label: "Home",
    href: "/",
    isLast: false,
  });

  // Add current page if not home
  if (pathname !== "/") {
    segments.push({
      label: pageTitle,
      href: pathname,
      isLast: items.length === 0,
    });
  }

  // Add dynamic items from context
  items.forEach((item, index) => {
    segments.push({
      label: item.label,
      href: item.href,
      isLast: index === items.length - 1,
    });
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => (
          <React.Fragment key={index}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {segment.isLast ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : segment.href ? (
                <BreadcrumbLink asChild>
                  <Link href={segment.href}>
                    {index === 0 ? <Home className="h-4 w-4" /> : segment.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

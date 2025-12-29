"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import { Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { SearchDialog } from "@/components/content";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useFocusModeOptional } from "@/components/layouts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";

// Convert slug to readable title
function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface BreadcrumbSegment {
  label: string;
  href: string;
}

function useBreadcrumbs(): BreadcrumbSegment[] {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    // Always start with Internal as root
    const breadcrumbs: BreadcrumbSegment[] = [
      { label: "Internal", href: "/" },
    ];

    // If on root page, add Overview as the current page
    if (segments.length === 0) {
      breadcrumbs.push({ label: "Overview", href: "/" });
    } else {
      // Add each path segment
      let currentPath = "";
      for (const segment of segments) {
        currentPath += `/${segment}`;
        breadcrumbs.push({
          label: formatSegment(segment),
          href: currentPath,
        });
      }
    }

    return breadcrumbs;
  }, [pathname]);
}

export function AppHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const breadcrumbs = useBreadcrumbs();
  const focusModeContext = useFocusModeOptional();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine which breadcrumbs to show
  // Max 3 visible: root + (ellipsis if needed) + last 2
  const showEllipsis = breadcrumbs.length > 3;
  const hiddenBreadcrumbs = showEllipsis
    ? breadcrumbs.slice(1, breadcrumbs.length - 2)
    : [];
  const visibleBreadcrumbs = showEllipsis
    ? [breadcrumbs[0], ...breadcrumbs.slice(-2)]
    : breadcrumbs;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          {visibleBreadcrumbs.map((crumb, index) => {
            const isFirst = index === 0;
            const isLast = index === visibleBreadcrumbs.length - 1;

            return (
              <Fragment key={`${crumb.href}-${crumb.label}`}>
                {/* Show ellipsis after root if needed */}
                {isFirst && showEllipsis && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1">
                          <BreadcrumbEllipsis className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {hiddenBreadcrumbs.map((hidden) => (
                            <DropdownMenuItem key={hidden.href} asChild>
                              <Link href={hidden.href}>{hidden.label}</Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                  </>
                )}

                {/* Render the regular breadcrumb item */}
                {!(isFirst && showEllipsis) && (
                  <>
                    {!isFirst && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </>
                )}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {focusModeContext?.hasSidebars && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={focusModeContext.toggleFocusMode}
                className="h-7 w-7"
              >
                {focusModeContext.focusMode ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {focusModeContext.focusMode ? "Show sidebars" : "Focus mode"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {focusModeContext.focusMode ? "Show sidebars" : "Focus mode"}
            </TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex text-xs bg-muted px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </Button>
        <ModeToggle />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}


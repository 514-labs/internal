"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFocusMode } from "./focus-mode-context";
import { ContentSidebarContent } from "./content-sidebar";

interface ContentLayoutProps {
  // Left sidebar - both optional, sidebar renders if either provided
  filters?: React.ReactNode;
  navigation?: React.ReactNode;

  // Right sidebar - optional
  tableOfContents?: React.ReactNode;

  // Main content
  children: React.ReactNode;

  // Optional class name for main content area
  className?: string;
}

export function ContentLayout({
  filters,
  navigation,
  tableOfContents,
  children,
  className,
}: ContentLayoutProps) {
  const { focusMode, setHasSidebars } = useFocusMode();

  const hasLeftSidebar = !!filters || !!navigation;
  const hasRightSidebar = !!tableOfContents;
  const hasSidebars = hasLeftSidebar || hasRightSidebar;

  // Update the context so the header knows whether to show the toggle
  React.useEffect(() => {
    setHasSidebars(hasSidebars);
    return () => setHasSidebars(false);
  }, [hasSidebars, setHasSidebars]);

  // When in focus mode, collapse both sidebars
  const leftSidebarOpen = hasLeftSidebar && !focusMode;
  const rightSidebarOpen = hasRightSidebar && !focusMode;

  return (
    <div className="flex flex-1">
      {/* Left Sidebar */}
      {hasLeftSidebar && (
        <aside
          data-state={leftSidebarOpen ? "expanded" : "collapsed"}
          className={cn(
            "transition-all duration-200 ease-linear shrink-0",
            leftSidebarOpen ? "w-64" : "w-0 overflow-hidden"
          )}
        >
          <div className="w-64 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-4">
            <ContentSidebarContent filters={filters} navigation={navigation} />
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={cn("flex-1 min-w-0 p-6", className)}>
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>

      {/* Right Sidebar - Table of Contents */}
      {hasRightSidebar && (
        <aside
          data-state={rightSidebarOpen ? "expanded" : "collapsed"}
          className={cn(
            "transition-all duration-200 ease-linear shrink-0",
            rightSidebarOpen ? "w-64" : "w-0 overflow-hidden"
          )}
        >
          <div className="w-64 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-4">
            {tableOfContents}
          </div>
        </aside>
      )}
    </div>
  );
}

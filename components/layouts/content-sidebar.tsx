"use client";

import * as React from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface ContentSidebarProps {
  filters?: React.ReactNode;
  navigation?: React.ReactNode;
}

export function ContentSidebarContent({
  filters,
  navigation,
}: ContentSidebarProps) {
  const hasFilters = !!filters;
  const hasNavigation = !!navigation;

  if (!hasFilters && !hasNavigation) {
    return null;
  }

  return (
    <SidebarContent>
      {hasFilters && (
        <SidebarGroup>
          <SidebarGroupLabel>Filters</SidebarGroupLabel>
          <SidebarGroupContent>{filters}</SidebarGroupContent>
        </SidebarGroup>
      )}

      {hasFilters && hasNavigation && <SidebarSeparator />}

      {hasNavigation && (
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>{navigation}</SidebarGroupContent>
        </SidebarGroup>
      )}
    </SidebarContent>
  );
}


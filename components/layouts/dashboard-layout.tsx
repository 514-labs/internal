"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className={cn("flex-1 space-y-6 p-8 pt-6", className)}>
      {children}
    </div>
  );
}



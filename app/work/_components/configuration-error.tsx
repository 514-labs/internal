"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ConfigurationErrorProps {
  message: string;
}

export function ConfigurationError({ message }: ConfigurationErrorProps) {
  // Parse the error message to extract details
  const isLinearError = message.includes("Linear");
  const isPostHogError = message.includes("PostHog") || message.includes("POSTHOG");
  const isMercuryError = message.includes("Mercury");

  // Determine integration name and admin path
  let integrationName = "Integration";
  if (isLinearError) integrationName = "Linear";
  else if (isPostHogError) integrationName = "PostHog";
  else if (isMercuryError) integrationName = "Mercury";

  const description = isLinearError
    ? "Connect your Linear account to view initiatives, projects, and issues."
    : isPostHogError
    ? "Configure PostHog to view product analytics and metrics."
    : isMercuryError
    ? "Connect your Mercury account to view bank balances and transactions."
    : "Additional configuration is required to display this data.";

  return (
    <Empty className="border min-h-[400px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>{integrationName} Not Connected</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/admin/integrations">
              <Settings className="mr-2 h-4 w-4" />
              Configure Integrations
            </Link>
          </Button>
          <details className="w-full text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Show technical details
            </summary>
            <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono overflow-auto max-h-32 p-2 bg-muted rounded-md">
              {message}
            </pre>
          </details>
        </EmptyContent>
      </Empty>
  );
}

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ExternalLink, Key } from "lucide-react";
import Link from "next/link";

interface ConfigurationErrorProps {
  message: string;
}

export function ConfigurationError({ message }: ConfigurationErrorProps) {
  // Parse the error message to extract details
  const isLinearError = message.includes("Linear");
  const isDatabaseError = message.includes("Database migration");
  const needsApiKey = message.includes("LINEAR_API_KEY");

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Work</h1>
      </div>

      <Alert variant="destructive" className="border-2">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-base font-semibold">
          Configuration Required
        </AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            {isLinearError
              ? "Linear integration is not configured. Connect your Linear account to view your work dashboard."
              : "Your workspace needs additional setup to display Linear data."}
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {needsApiKey && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>Option 1: Quick Setup with API Key</CardTitle>
              </div>
              <CardDescription>
                Recommended for development and testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Steps to configure:</p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    Get your API key from Linear
                    <a
                      href="https://linear.app/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center text-primary hover:underline"
                    >
                      Open Linear Settings
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </li>
                  <li>Add to your .env.local file:</li>
                </ol>
                <div className="rounded-md bg-muted p-3 font-mono text-xs">
                  LINEAR_API_KEY=your_api_key_here
                </div>
                <p className="text-muted-foreground text-xs">
                  3. Restart your development server (Ctrl+C and run pnpm dev)
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a
                  href="https://linear.app/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Get Linear API Key
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isDatabaseError && (
          <Card>
            <CardHeader>
              <CardTitle>Option 2: OAuth Integration</CardTitle>
              <CardDescription>Recommended for production use</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Linear account through OAuth for secure, team-wide
                access without managing API keys.
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Prerequisites:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                  <li>Supabase database running</li>
                  <li>Database migrations applied</li>
                </ul>
              </div>
              <Button asChild className="w-full">
                <Link href="/settings/integrations">
                  Go to Integrations Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isDatabaseError && (
          <Card>
            <CardHeader>
              <CardTitle>Database Setup Required</CardTitle>
              <CardDescription>
                Run migrations to enable OAuth features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Run these commands:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li className="text-muted-foreground">
                    Start Supabase:
                    <div className="mt-1 rounded-md bg-muted p-2 font-mono text-xs">
                      pnpm db:start
                    </div>
                  </li>
                  <li className="text-muted-foreground">
                    Run migrations:
                    <div className="mt-1 rounded-md bg-muted p-2 font-mono text-xs">
                      pnpm db:migrate
                    </div>
                  </li>
                  <li className="text-muted-foreground">
                    Restart your dev server
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Technical Details - Collapsible */}
      <details className="rounded-lg border bg-muted/50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Show technical details
        </summary>
        <pre className="mt-4 text-xs text-muted-foreground whitespace-pre-wrap font-mono overflow-auto max-h-64">
          {message}
        </pre>
      </details>
    </div>
  );
}

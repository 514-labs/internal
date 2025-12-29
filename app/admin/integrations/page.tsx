"use client";

/**
 * Admin Settings - Integrations
 * Manage third-party integrations (Linear, Rippling, Mercury, etc.)
 *
 * INTEGRATION TYPES:
 * - Linear: Workspace-level OAuth (admin only)
 * - Rippling: Per-user API tokens (each user manages their own)
 * - Mercury: Per-user API tokens (each user manages their own)
 */

import { useEffect, useState } from "react";
import { useAuth, useOrganizationList } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RipplingApiExplorer } from "./_components/rippling-api-explorer";
import { MercuryApiExplorer } from "./_components/mercury-api-explorer";
import { ContentLayout } from "@/components/layouts";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Puzzle } from "lucide-react";

interface LinearStatus {
  connected: boolean;
  expiresAt?: string;
  scope?: string;
  hasRefreshToken?: boolean;
  message?: string;
}

interface RipplingStatus {
  connected: boolean;
  createdAt?: string;
  message?: string;
}

interface MercuryStatus {
  connected: boolean;
  createdAt?: string;
  message?: string;
}

export default function IntegrationsPage() {
  const { userId } = useAuth();
  const { userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  // Linear state (admin only)
  const [linearStatus, setLinearStatus] = useState<LinearStatus | null>(null);
  const [linearLoading, setLinearLoading] = useState(true);
  const [linearDisconnecting, setLinearDisconnecting] = useState(false);

  // Rippling state (per-user)
  const [ripplingStatus, setRipplingStatus] = useState<RipplingStatus | null>(
    null
  );
  const [ripplingLoading, setRipplingLoading] = useState(true);
  const [ripplingToken, setRipplingToken] = useState("");
  const [ripplingSaving, setRipplingSaving] = useState(false);
  const [ripplingDisconnecting, setRipplingDisconnecting] = useState(false);
  const [showRipplingTokenInput, setShowRipplingTokenInput] = useState(false);
  const [showRipplingExplorer, setShowRipplingExplorer] = useState(false);

  // Mercury state (per-user)
  const [mercuryStatus, setMercuryStatus] = useState<MercuryStatus | null>(
    null
  );
  const [mercuryLoading, setMercuryLoading] = useState(true);
  const [mercuryToken, setMercuryToken] = useState("");
  const [mercurySaving, setMercurySaving] = useState(false);
  const [mercuryDisconnecting, setMercuryDisconnecting] = useState(false);
  const [showMercuryTokenInput, setShowMercuryTokenInput] = useState(false);
  const [showMercuryExplorer, setShowMercuryExplorer] = useState(false);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is admin in any organization
  const isAdmin =
    userMemberships?.data?.some(
      (membership) => membership.role === "org:admin"
    ) ?? false;

  useEffect(() => {
    // Check for success/error messages in URL
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const successParam = params.get("success");
    const errorDetails =
      params.get("error_description") || params.get("details");

    if (errorParam) {
      setError(
        `Error: ${errorParam}${errorDetails ? ` - ${errorDetails}` : ""}`
      );
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (successParam === "linear_connected") {
      setSuccessMessage("Linear integration connected successfully!");
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Fetch integration statuses
    if (isAdmin) {
      fetchLinearStatus();
    } else {
      setLinearLoading(false);
    }

    // Rippling and Mercury are per-user, so fetch for all authenticated users
    if (userId) {
      fetchRipplingStatus();
      fetchMercuryStatus();
    }
  }, [isAdmin, userId]);

  const fetchLinearStatus = async () => {
    try {
      setLinearLoading(true);
      const response = await fetch("/api/integrations/linear/status");

      if (!response.ok) {
        throw new Error("Failed to fetch Linear status");
      }

      const data = await response.json();
      setLinearStatus(data);
    } catch (err) {
      console.error("Error fetching Linear status:", err);
      setError("Failed to load Linear integration status");
    } finally {
      setLinearLoading(false);
    }
  };

  const fetchRipplingStatus = async () => {
    try {
      setRipplingLoading(true);
      const response = await fetch("/api/integrations/rippling/status");

      if (!response.ok) {
        throw new Error("Failed to fetch Rippling status");
      }

      const data = await response.json();
      setRipplingStatus(data);
    } catch (err) {
      console.error("Error fetching Rippling status:", err);
      // Don't set error for Rippling - it's optional
    } finally {
      setRipplingLoading(false);
    }
  };

  const fetchMercuryStatus = async () => {
    try {
      setMercuryLoading(true);
      const response = await fetch("/api/integrations/mercury/status");

      if (!response.ok) {
        throw new Error("Failed to fetch Mercury status");
      }

      const data = await response.json();
      setMercuryStatus(data);
    } catch (err) {
      console.error("Error fetching Mercury status:", err);
      // Don't set error for Mercury - it's optional
    } finally {
      setMercuryLoading(false);
    }
  };

  const handleConnectLinear = () => {
    window.location.href = "/api/integrations/linear/authorize";
  };

  const handleDisconnectLinear = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Linear? This will revoke access to your Linear data."
      )
    ) {
      return;
    }

    try {
      setLinearDisconnecting(true);
      setError(null);

      const response = await fetch("/api/integrations/linear/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to disconnect");
      }

      setSuccessMessage("Linear integration disconnected successfully");
      await fetchLinearStatus();
    } catch (err) {
      console.error("Error disconnecting Linear:", err);
      setError((err as Error).message);
    } finally {
      setLinearDisconnecting(false);
    }
  };

  const handleSaveRipplingToken = async () => {
    if (!ripplingToken.trim()) {
      setError("Please enter your Rippling API token");
      return;
    }

    try {
      setRipplingSaving(true);
      setError(null);

      const response = await fetch("/api/integrations/rippling/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: ripplingToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save token");
      }

      setSuccessMessage("Rippling API token saved successfully");
      setRipplingToken("");
      setShowRipplingTokenInput(false);
      await fetchRipplingStatus();
    } catch (err) {
      console.error("Error saving Rippling token:", err);
      setError((err as Error).message);
    } finally {
      setRipplingSaving(false);
    }
  };

  const handleDisconnectRippling = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Rippling? You will need to re-enter your API token to reconnect."
      )
    ) {
      return;
    }

    try {
      setRipplingDisconnecting(true);
      setError(null);

      const response = await fetch("/api/integrations/rippling/token", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to disconnect");
      }

      setSuccessMessage("Rippling integration disconnected successfully");
      await fetchRipplingStatus();
    } catch (err) {
      console.error("Error disconnecting Rippling:", err);
      setError((err as Error).message);
    } finally {
      setRipplingDisconnecting(false);
    }
  };

  const handleSaveMercuryToken = async () => {
    if (!mercuryToken.trim()) {
      setError("Please enter your Mercury API token");
      return;
    }

    try {
      setMercurySaving(true);
      setError(null);

      const response = await fetch("/api/integrations/mercury/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: mercuryToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save token");
      }

      setSuccessMessage("Mercury API token saved successfully");
      setMercuryToken("");
      setShowMercuryTokenInput(false);
      await fetchMercuryStatus();
    } catch (err) {
      console.error("Error saving Mercury token:", err);
      setError((err as Error).message);
    } finally {
      setMercurySaving(false);
    }
  };

  const handleDisconnectMercury = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect Mercury? You will need to re-enter your API token to reconnect."
      )
    ) {
      return;
    }

    try {
      setMercuryDisconnecting(true);
      setError(null);

      const response = await fetch("/api/integrations/mercury/token", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to disconnect");
      }

      setSuccessMessage("Mercury integration disconnected successfully");
      await fetchMercuryStatus();
    } catch (err) {
      console.error("Error disconnecting Mercury:", err);
      setError((err as Error).message);
    } finally {
      setMercuryDisconnecting(false);
    }
  };

  if (!userId) {
    return (
      <ContentLayout >
        <div className="max-w-4xl">
          <p className="text-destructive">Please sign in to access this page.</p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect and manage third-party integrations for your workspace
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 underline text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <p className="text-green-600 dark:text-green-400">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 dark:text-green-400 underline text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Rippling Integration (Per-User) */}
        <div className="border rounded-lg p-6 bg-card shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                Rippling
                {ripplingLoading ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    Loading...
                  </span>
                ) : ripplingStatus?.connected ? (
                  <span className="text-sm font-normal text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    Connected
                  </span>
                ) : (
                  <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                    Not Connected
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground mb-2">
                Connect your Rippling account to access employee, team, and
                department data.
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded mb-4">
                <strong>Note:</strong> Your Rippling API token is personal and
                provides access based on your Rippling permissions. It is stored
                securely and not shared with other users.
              </p>

              {ripplingStatus?.connected && ripplingStatus.createdAt && (
                <div className="text-sm text-muted-foreground mb-4">
                  <p>
                    <strong>Connected since:</strong>{" "}
                    {new Date(ripplingStatus.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="ml-4 flex flex-col gap-2">
              {ripplingStatus?.connected ? (
                <>
                  <Button
                    onClick={() => setShowRipplingExplorer(!showRipplingExplorer)}
                    variant={showRipplingExplorer ? "secondary" : "default"}
                  >
                    {showRipplingExplorer ? "Hide Explorer" : "API Explorer"}
                  </Button>
                  <Button
                    onClick={handleDisconnectRippling}
                    disabled={ripplingDisconnecting}
                    variant="outline"
                    size="sm"
                  >
                    {ripplingDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowRipplingTokenInput(true)}
                  disabled={ripplingLoading || showRipplingTokenInput}
                >
                  Connect Rippling
                </Button>
              )}
            </div>
          </div>

          {/* Token Input Form */}
          {showRipplingTokenInput && !ripplingStatus?.connected && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Enter your Rippling API Token</h3>
              <div className="flex gap-3">
                <Input
                  type="password"
                  placeholder="Paste your Rippling API token here"
                  value={ripplingToken}
                  onChange={(e) => setRipplingToken(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveRipplingToken}
                  disabled={ripplingSaving || !ripplingToken.trim()}
                >
                  {ripplingSaving ? "Saving..." : "Save Token"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRipplingTokenInput(false);
                    setRipplingToken("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Your token will be validated before saving.
              </p>
            </div>
          )}

          {/* Setup Instructions */}
          {!ripplingStatus?.connected && !ripplingLoading && !showRipplingTokenInput && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">How to get your API Token</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Go to the{" "}
                  <a
                    href="https://app.rippling.com/developer/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Rippling API Tokens page
                  </a>
                </li>
                <li>
                  Click <strong>Create API Key</strong>
                </li>
                <li>
                  Assign the scopes you need (e.g., users.read, teams.read, departments.read)
                </li>
                <li>Copy the generated API token</li>
                <li>Click "Connect Rippling" above and paste your token</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                For detailed instructions, see the{" "}
                <a
                  href="https://developer.rippling.com/documentation/rest-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Rippling API documentation
                </a>
                .
              </p>
            </div>
          )}

          {/* API Explorer */}
          {ripplingStatus?.connected && showRipplingExplorer && (
            <div className="mt-6 pt-6 border-t">
              <RipplingApiExplorer />
            </div>
          )}
        </div>

        {/* Mercury Integration (Per-User) */}
        <div className="border rounded-lg p-6 bg-card shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                Mercury
                {mercuryLoading ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    Loading...
                  </span>
                ) : mercuryStatus?.connected ? (
                  <span className="text-sm font-normal text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    Connected
                  </span>
                ) : (
                  <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                    Not Connected
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground mb-2">
                Connect your Mercury banking account to access accounts,
                transactions, and financial data.
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded mb-4">
                <strong>Note:</strong> Your Mercury API token is personal and
                provides access based on your Mercury permissions. It is stored
                securely and not shared with other users.
              </p>

              {mercuryStatus?.connected && mercuryStatus.createdAt && (
                <div className="text-sm text-muted-foreground mb-4">
                  <p>
                    <strong>Connected since:</strong>{" "}
                    {new Date(mercuryStatus.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="ml-4 flex flex-col gap-2">
              {mercuryStatus?.connected ? (
                <>
                  <Button
                    onClick={() => setShowMercuryExplorer(!showMercuryExplorer)}
                    variant={showMercuryExplorer ? "secondary" : "default"}
                  >
                    {showMercuryExplorer ? "Hide Explorer" : "API Explorer"}
                  </Button>
                  <Button
                    onClick={handleDisconnectMercury}
                    disabled={mercuryDisconnecting}
                    variant="outline"
                    size="sm"
                  >
                    {mercuryDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowMercuryTokenInput(true)}
                  disabled={mercuryLoading || showMercuryTokenInput}
                >
                  Connect Mercury
                </Button>
              )}
            </div>
          </div>

          {/* Token Input Form */}
          {showMercuryTokenInput && !mercuryStatus?.connected && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Enter your Mercury API Token</h3>
              <div className="flex gap-3">
                <Input
                  type="password"
                  placeholder="Paste your Mercury API token here"
                  value={mercuryToken}
                  onChange={(e) => setMercuryToken(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveMercuryToken}
                  disabled={mercurySaving || !mercuryToken.trim()}
                >
                  {mercurySaving ? "Saving..." : "Save Token"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMercuryTokenInput(false);
                    setMercuryToken("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Your token will be validated before saving.
              </p>
            </div>
          )}

          {/* Setup Instructions */}
          {!mercuryStatus?.connected && !mercuryLoading && !showMercuryTokenInput && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">How to get your API Token</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Go to the{" "}
                  <a
                    href="https://app.mercury.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Mercury API Tokens page
                  </a>
                </li>
                <li>
                  Click <strong>Create Token</strong>
                </li>
                <li>
                  Select the appropriate permissions (Read Only, Read and Write, or Custom)
                </li>
                <li>Copy the generated API token</li>
                <li>Click "Connect Mercury" above and paste your token</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                For detailed instructions, see the{" "}
                <a
                  href="https://docs.mercury.com/reference/getting-started-with-your-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Mercury API documentation
                </a>
                .
              </p>
            </div>
          )}

          {/* API Explorer */}
          {mercuryStatus?.connected && showMercuryExplorer && (
            <div className="mt-6 pt-6 border-t">
              <MercuryApiExplorer />
            </div>
          )}
        </div>

        {/* Linear Integration (Admin Only) */}
        {isAdmin && (
          <div className="border rounded-lg p-6 bg-card shadow-sm mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  Linear
                  <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                    Admin
                  </span>
                  {linearLoading ? (
                    <span className="text-sm font-normal text-muted-foreground">
                      Loading...
                    </span>
                  ) : linearStatus?.connected ? (
                    <span className="text-sm font-normal text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">
                      Connected
                    </span>
                  ) : (
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                      Not Connected
                    </span>
                  )}
                </h2>
                <p className="text-muted-foreground mb-4">
                  Connect your Linear workspace to sync issues, projects, and
                  initiatives. This is a workspace-wide integration managed by
                  administrators.
                </p>

                {linearStatus?.connected && (
                  <div className="text-sm text-muted-foreground space-y-1 mb-4">
                    {linearStatus.expiresAt && (
                      <p>
                        <strong>Token expires:</strong>{" "}
                        {new Date(linearStatus.expiresAt).toLocaleString()}
                      </p>
                    )}
                    {linearStatus.scope && (
                      <p>
                        <strong>Scopes:</strong> {linearStatus.scope}
                      </p>
                    )}
                    {linearStatus.hasRefreshToken && (
                      <p className="text-green-600 dark:text-green-400">
                        ✓ Automatic token refresh enabled
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="ml-4">
                {linearStatus?.connected ? (
                  <Button
                    onClick={handleDisconnectLinear}
                    disabled={linearDisconnecting}
                    variant="outline"
                  >
                    {linearDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </Button>
                ) : (
                  <Button onClick={handleConnectLinear} disabled={linearLoading}>
                    Connect Linear
                  </Button>
                )}
              </div>
            </div>

            {/* Setup Instructions */}
            {!linearStatus?.connected && !linearLoading && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">Setup Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    Create an OAuth app in Linear at{" "}
                    <a
                      href="https://linear.app/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      linear.app/settings/api
                    </a>
                  </li>
                  <li>
                    Set the callback URL to your deployment URL +{" "}
                    <code className="bg-muted px-1 rounded">
                      /api/integrations/linear/callback
                    </code>
                  </li>
                  <li>
                    Copy the Client ID and Client Secret to your environment
                    variables
                  </li>
                  <li>
                    Set environment variables:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>
                        <code className="bg-muted px-1 rounded">
                          LINEAR_CLIENT_ID
                        </code>
                      </li>
                      <li>
                        <code className="bg-muted px-1 rounded">
                          LINEAR_CLIENT_SECRET
                        </code>
                      </li>
                      <li>
                        <code className="bg-muted px-1 rounded">
                          LINEAR_OAUTH_REDIRECT_URI
                        </code>
                      </li>
                    </ul>
                  </li>
                  <li>Click "Connect Linear" above to authorize</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Non-admin Linear info */}
        {!isAdmin && (
          <div className="border rounded-lg p-6 bg-muted/50 mb-6">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold">Linear</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Linear is a workspace-wide integration managed by administrators.
                  Contact your admin to set up or modify the Linear connection.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Future integrations */}
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Puzzle className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>More integrations coming soon</EmptyTitle>
            <EmptyDescription>
              Additional integrations like GitHub, Jira, and Slack will be available here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </ContentLayout>
  );
}

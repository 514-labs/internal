"use client";

/**
 * Admin Settings - Integrations
 * Manage third-party integrations (Linear, Rippling, etc.)
 *
 * INTEGRATION TYPES:
 * - Linear: Workspace-level OAuth (admin only)
 * - Rippling: Per-user API tokens (each user manages their own)
 */

import { useEffect, useState } from "react";
import { useAuth, useOrganizationList } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RipplingApiExplorer } from "./_components/rippling-api-explorer";

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

    // Rippling is per-user, so fetch for all authenticated users
    if (userId) {
      fetchRipplingStatus();
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

  if (!userId) {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-600">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-gray-600 mb-8">
          Connect and manage third-party integrations for your workspace.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 underline text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 underline text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Rippling Integration (Per-User) */}
        <div className="border rounded-lg p-6 bg-white shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                Rippling
                {ripplingLoading ? (
                  <span className="text-sm font-normal text-gray-500">
                    Loading...
                  </span>
                ) : ripplingStatus?.connected ? (
                  <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                    Connected
                  </span>
                ) : (
                  <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Not Connected
                  </span>
                )}
              </h2>
              <p className="text-gray-600 mb-2">
                Connect your Rippling account to access employee, team, and
                department data.
              </p>
              <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded mb-4">
                <strong>Note:</strong> Your Rippling API token is personal and
                provides access based on your Rippling permissions. It is stored
                securely and not shared with other users.
              </p>

              {ripplingStatus?.connected && ripplingStatus.createdAt && (
                <div className="text-sm text-gray-600 mb-4">
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
              <p className="text-sm text-gray-500 mt-2">
                Your token will be validated before saving.
              </p>
            </div>
          )}

          {/* Setup Instructions */}
          {!ripplingStatus?.connected && !ripplingLoading && !showRipplingTokenInput && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">How to get your API Token</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>
                  Go to the{" "}
                  <a
                    href="https://app.rippling.com/developer/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
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
              <p className="text-sm text-gray-500 mt-4">
                For detailed instructions, see the{" "}
                <a
                  href="https://developer.rippling.com/documentation/rest-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
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

        {/* Linear Integration (Admin Only) */}
        {isAdmin && (
          <div className="border rounded-lg p-6 bg-white shadow-sm mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  Linear
                  <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Admin
                  </span>
                  {linearLoading ? (
                    <span className="text-sm font-normal text-gray-500">
                      Loading...
                    </span>
                  ) : linearStatus?.connected ? (
                    <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                      Connected
                    </span>
                  ) : (
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Not Connected
                    </span>
                  )}
                </h2>
                <p className="text-gray-600 mb-4">
                  Connect your Linear workspace to sync issues, projects, and
                  initiatives. This is a workspace-wide integration managed by
                  administrators.
                </p>

                {linearStatus?.connected && (
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
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
                      <p className="text-green-600">
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
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>
                    Create an OAuth app in Linear at{" "}
                    <a
                      href="https://linear.app/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      linear.app/settings/api
                    </a>
                  </li>
                  <li>
                    Set the callback URL to your deployment URL +{" "}
                    <code className="bg-gray-100 px-1 rounded">
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
                        <code className="bg-gray-100 px-1 rounded">
                          LINEAR_CLIENT_ID
                        </code>
                      </li>
                      <li>
                        <code className="bg-gray-100 px-1 rounded">
                          LINEAR_CLIENT_SECRET
                        </code>
                      </li>
                      <li>
                        <code className="bg-gray-100 px-1 rounded">
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
          <div className="border rounded-lg p-6 bg-gray-50 mb-6">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5"
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
                <h3 className="font-semibold text-gray-700">Linear</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Linear is a workspace-wide integration managed by administrators.
                  Contact your admin to set up or modify the Linear connection.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Future integrations */}
        <div className="p-6 border rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-700 mb-2">
            More integrations coming soon
          </h3>
          <p className="text-sm text-gray-600">
            Additional integrations like GitHub, Jira, and Slack will be
            available here.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * Admin Settings - Integrations
 * Manage third-party integrations (Linear, etc.)
 */

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface LinearStatus {
  connected: boolean;
  expiresAt?: string;
  scope?: string;
  hasRefreshToken?: boolean;
  message?: string;
}

export default function IntegrationsPage() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [linearStatus, setLinearStatus] = useState<LinearStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === "admin";

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
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (successParam === "linear_connected") {
      setSuccessMessage("Linear integration connected successfully!");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Fetch Linear connection status
    if (isAdmin) {
      fetchLinearStatus();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchLinearStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/linear/status");

      if (!response.ok) {
        throw new Error("Failed to fetch Linear status");
      }

      const data = await response.json();
      setLinearStatus(data);
    } catch (err) {
      console.error("Error fetching Linear status:", err);
      setError("Failed to load integration status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectLinear = () => {
    // Redirect to Linear OAuth authorization
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
      setDisconnecting(true);
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
      setDisconnecting(false);
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

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Integrations</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Admin access required to manage integrations.
            </p>
          </div>
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

        {/* Linear Integration */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                Linear
                {loading ? (
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
                initiatives.
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
                  disabled={disconnecting}
                  variant="outline"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button onClick={handleConnectLinear} disabled={loading}>
                  Connect Linear
                </Button>
              )}
            </div>
          </div>

          {/* Setup Instructions */}
          {!linearStatus?.connected && !loading && (
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

        {/* Future integrations can be added here */}
        <div className="mt-6 p-6 border rounded-lg bg-gray-50">
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

import { MetricsClient } from "./_components/metrics-client";
import { ConfigurationError } from "../work/_components/configuration-error";
import { ConfigurationError as ConfigError } from "@/lib/analytics/shared/errors";

export default async function MetricsPage() {
  try {
    // Check if PostHog is configured
    const posthogApiKey = process.env.POSTHOG_API_KEY;
    const posthogProjectId = process.env.POSTHOG_PROJECT_ID;

    if (!posthogApiKey || !posthogProjectId) {
      return (
        <ConfigurationError message="PostHog is not configured. Set POSTHOG_API_KEY and POSTHOG_PROJECT_ID environment variables to enable metrics tracking." />
      );
    }

    // Render the metrics dashboard
    return <MetricsClient />;
  } catch (error) {
    // Handle configuration errors
    if (error instanceof ConfigError) {
      return <ConfigurationError message={error.message} />;
    }

    // Handle generic errors
    if (error instanceof Error) {
      const isConfigError =
        error.message.includes("PostHog") ||
        error.message.includes("POSTHOG_API_KEY") ||
        error.message.includes("POSTHOG_PROJECT_ID");

      if (isConfigError) {
        return <ConfigurationError message={error.message} />;
      }
    }

    // Log unexpected errors for debugging
    console.error("Unexpected error in MetricsPage:", error);

    // Display a generic error UI
    return (
      <ConfigurationError
        message={`An unexpected error occurred: ${
          error instanceof Error ? error.message : String(error)
        }`}
      />
    );
  }
}

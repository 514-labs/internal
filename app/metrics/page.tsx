import { MetricsClient } from "./_components/metrics-client";
import { ConfigurationError } from "../work/_components/configuration-error";
import { ConfigurationError as ConfigError } from "@/lib/analytics/shared/errors";
import { DashboardLayout } from "@/components/layouts";

export default async function MetricsPage() {
  try {
    // Check if PostHog is configured
    const posthogApiKey = process.env.POSTHOG_API_KEY;
    const posthogProjectId = process.env.POSTHOG_PROJECT_ID;

    if (!posthogApiKey || !posthogProjectId) {
      return (
        <DashboardLayout>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
            <p className="text-muted-foreground">
              Track key metrics across Boreal and Moosestack products
            </p>
          </div>
          <ConfigurationError message="PostHog is not configured. Set POSTHOG_API_KEY and POSTHOG_PROJECT_ID environment variables to enable metrics tracking." />
        </DashboardLayout>
      );
    }

    // Render the metrics dashboard
    return <MetricsClient />;
  } catch (error) {
    // Handle configuration errors
    if (error instanceof ConfigError) {
      return (
        <DashboardLayout>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
            <p className="text-muted-foreground">
              Track key metrics across Boreal and Moosestack products
            </p>
          </div>
          <ConfigurationError message={error.message} />
        </DashboardLayout>
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      const isConfigError =
        error.message.includes("PostHog") ||
        error.message.includes("POSTHOG_API_KEY") ||
        error.message.includes("POSTHOG_PROJECT_ID");

      if (isConfigError) {
        return (
          <DashboardLayout>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
              <p className="text-muted-foreground">
                Track key metrics across Boreal and Moosestack products
              </p>
            </div>
            <ConfigurationError message={error.message} />
          </DashboardLayout>
        );
      }
    }

    // Log unexpected errors for debugging
    console.error("Unexpected error in MetricsPage:", error);

    // Display a generic error UI
    return (
      <DashboardLayout>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
          <p className="text-muted-foreground">
            Track key metrics across Boreal and Moosestack products
          </p>
        </div>
        <ConfigurationError
          message={`An unexpected error occurred: ${
            error instanceof Error ? error.message : String(error)
          }`}
        />
      </DashboardLayout>
    );
  }
}

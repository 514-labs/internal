import {
  getProjects,
  getInitiatives,
  getIssues,
} from "@/lib/analytics/linear/queries";
import { WorkClient } from "./_components/work-client";
import {
  ConfigurationError as ConfigError,
  AnalyticsError,
} from "@/lib/analytics/shared/errors";
import { ConfigurationError } from "./_components/configuration-error";

export default async function WorkPage() {
  // Fetch initial data server-side for better initial page load
  try {
    const [projects, initiatives, issues] = await Promise.all([
      getProjects({ state: "started", limit: 50 }),
      // Fetch all initiatives first to see what statuses exist
      // Linear might use different status names than "active"
      getInitiatives({ limit: 50 }),
      getIssues({ completed: true, limit: 10 }),
    ]);

    return (
      <WorkClient
        initialProjects={projects}
        initialInitiatives={initiatives}
        initialIssues={issues}
      />
    );
  } catch (error) {
    // Display configuration errors prominently
    if (error instanceof ConfigError) {
      return <ConfigurationError message={error.message} />;
    }

    // Handle any analytics errors (including wrapped configuration errors)
    if (error instanceof AnalyticsError) {
      // Check if the underlying error is a configuration issue
      const isConfigError =
        error.message.includes("Linear is not configured") ||
        error.message.includes("Database migration required") ||
        error.message.includes("SUPABASE_URL") ||
        error.message.includes("LINEAR_API_KEY");

      if (isConfigError) {
        return <ConfigurationError message={error.message} />;
      }
    }

    // Handle generic errors that might contain configuration messages
    if (error instanceof Error) {
      const isConfigError =
        error.message.includes("Linear is not configured") ||
        error.message.includes("Database migration required") ||
        error.message.includes("SUPABASE_URL") ||
        error.message.includes("LINEAR_API_KEY") ||
        error.message.includes("CLERK_SECRET_KEY");

      if (isConfigError) {
        return <ConfigurationError message={error.message} />;
      }
    }

    // Log unexpected errors for debugging
    console.error("Unexpected error in WorkPage:", error);

    // Display a generic error UI instead of crashing
    return (
      <ConfigurationError
        message={`An unexpected error occurred: ${
          error instanceof Error ? error.message : String(error)
        }`}
      />
    );
  }
}

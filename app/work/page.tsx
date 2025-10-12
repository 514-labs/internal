import {
  getProjects,
  getInitiatives,
  getIssues,
} from "@/lib/analytics/linear/queries";
import { WorkClient } from "./_components/work-client";
import { ConfigurationError as ConfigError } from "@/lib/analytics/shared/errors";
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

    // For other errors, rethrow to trigger error boundary
    throw error;
  }
}

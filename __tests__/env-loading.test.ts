/**
 * Test to verify environment variables are loaded correctly
 */

describe("Environment Variable Loading", () => {
  it("should show what API keys are loaded", () => {
    console.log("\n=== PostHog ===");
    console.log("POSTHOG_API_KEY:", process.env.POSTHOG_API_KEY);
    console.log("POSTHOG_PROJECT_ID:", process.env.POSTHOG_PROJECT_ID);

    console.log("\n=== Linear OAuth ===");
    console.log("LINEAR_CLIENT_ID:", process.env.LINEAR_CLIENT_ID);
    console.log(
      "LINEAR_CLIENT_SECRET:",
      process.env.LINEAR_CLIENT_SECRET ? "[REDACTED]" : "NOT SET"
    );
    console.log(
      "LINEAR_OAUTH_REDIRECT_URI:",
      process.env.LINEAR_OAUTH_REDIRECT_URI
    );

    console.log("\n=== Rippling ===");
    console.log(
      "RIPPLING_API_KEY:",
      process.env.RIPPLING_API_KEY ? "[REDACTED]" : "NOT SET"
    );

    console.log("\n=== Supabase ===");
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

    console.log("\n=== Status ===");
    if (
      process.env.POSTHOG_API_KEY?.startsWith("phx_") ||
      process.env.POSTHOG_API_KEY?.startsWith("phc_")
    ) {
      console.log("✅ Real PostHog key detected!");
    } else {
      console.log("⚠️  Test PostHog key");
    }

    if (
      process.env.LINEAR_CLIENT_ID &&
      !process.env.LINEAR_CLIENT_ID.startsWith("test_")
    ) {
      console.log("✅ Real Linear OAuth credentials detected!");
    } else {
      console.log("⚠️  Test Linear OAuth credentials");
    }

    if (
      process.env.RIPPLING_API_KEY &&
      !process.env.RIPPLING_API_KEY.startsWith("test_")
    ) {
      console.log("✅ Real Rippling key detected!");
    } else {
      console.log("⚠️  Test Rippling key");
    }
  });
});

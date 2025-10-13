/**
 * Check PostHog configuration
 * Run with: pnpm tsx scripts/analytics/check-posthog-config.ts
 */

console.log("=== PostHog Configuration Check ===\n");

const config = {
  POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
  POSTHOG_PROJECT_ID: process.env.POSTHOG_PROJECT_ID,
  POSTHOG_HOST: process.env.POSTHOG_HOST || "https://app.posthog.com",
};

console.log("Environment Variables:");
console.log(
  "- POSTHOG_API_KEY:",
  config.POSTHOG_API_KEY
    ? `${config.POSTHOG_API_KEY.substring(0, 10)}... (${
        config.POSTHOG_API_KEY.length
      } chars)`
    : "❌ NOT SET"
);
console.log("- POSTHOG_PROJECT_ID:", config.POSTHOG_PROJECT_ID || "❌ NOT SET");
console.log("- POSTHOG_HOST:", config.POSTHOG_HOST);

if (!config.POSTHOG_API_KEY || !config.POSTHOG_PROJECT_ID) {
  console.log("\n❌ Missing required environment variables!");
  console.log("\nPlease set in .env.local:");
  console.log("POSTHOG_API_KEY=phx_...");
  console.log("POSTHOG_PROJECT_ID=12345");
  process.exit(1);
}

console.log("\n✅ All environment variables are set!");

// Test a simple query
async function testQuery() {
  console.log("\n=== Testing PostHog API Connection ===\n");

  const url = `${config.POSTHOG_HOST}/api/projects/${config.POSTHOG_PROJECT_ID}/query/`;

  console.log("Testing URL:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: "SELECT 1 as test",
        },
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log("❌ API Error:", error);
      return;
    }

    const data = await response.json();
    console.log("✅ API Connection successful!");
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("❌ Connection failed:", error);
  }
}

testQuery();

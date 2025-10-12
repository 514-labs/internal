/**
 * Test Configuration Validator
 *
 * Validates that required API keys are present for integration tests.
 * Provides clear error messages about which keys are missing.
 */

interface ServiceConfig {
  name: string;
  envVars: string[];
  required: boolean;
}

const SERVICES: ServiceConfig[] = [
  {
    name: "Supabase",
    envVars: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    required: true,
  },
  {
    name: "PostHog",
    envVars: ["POSTHOG_API_KEY", "POSTHOG_PROJECT_ID"],
    required: true,
  },
  {
    name: "Linear OAuth",
    envVars: [
      "LINEAR_CLIENT_ID",
      "LINEAR_CLIENT_SECRET",
      "LINEAR_OAUTH_REDIRECT_URI",
    ],
    required: true, // OAuth is required, no API key fallback
  },
];

interface ValidationResult {
  valid: boolean;
  missing: Array<{
    service: string;
    envVars: string[];
  }>;
  message: string;
}

/**
 * Check if integration tests can run with real APIs
 */
export function validateIntegrationTestConfig(): ValidationResult {
  const missing: Array<{ service: string; envVars: string[] }> = [];

  for (const service of SERVICES) {
    const missingVars = service.envVars.filter(
      (varName) =>
        !process.env[varName] || process.env[varName]?.startsWith("test_")
    );

    if (missingVars.length > 0) {
      if (service.required) {
        missing.push({
          service: service.name,
          envVars: missingVars,
        });
      }
    }
  }

  if (missing.length === 0) {
    return {
      valid: true,
      missing: [],
      message: "✅ All required API keys are configured for integration tests",
    };
  }

  const message = formatMissingKeysMessage(missing);

  return {
    valid: false,
    missing,
    message,
  };
}

/**
 * Format a clear error message about missing keys
 */
function formatMissingKeysMessage(
  missing: Array<{ service: string; envVars: string[] }>
): string {
  const lines = [
    "",
    "❌ INTEGRATION TESTS REQUIRE REAL API KEYS",
    "",
    "The following API keys are missing or set to test values:",
    "",
  ];

  for (const { service, envVars } of missing) {
    lines.push(`  ${service}:`);
    for (const varName of envVars) {
      const currentValue = process.env[varName];
      if (!currentValue) {
        lines.push(`    ❌ ${varName} - NOT SET`);
      } else if (currentValue.startsWith("test_")) {
        lines.push(`    ⚠️  ${varName} - Using test value (need real key)`);
      }
    }
    lines.push("");
  }

  lines.push(
    "To run integration tests with real APIs, add these to .env.local:"
  );
  lines.push("");

  for (const { service, envVars } of missing) {
    lines.push(`# ${service}`);
    for (const varName of envVars) {
      lines.push(`${varName}=your_real_key_here`);
    }
    lines.push("");
  }

  lines.push("Then restart your test suite.");
  lines.push("");
  lines.push("📝 Note: Unit tests will still work with mock keys.");
  lines.push(
    "📝 Integration tests require real API keys to test actual API interactions."
  );
  lines.push("");

  return lines.join("\n");
}

/**
 * Check a specific service configuration
 */
export function isServiceConfigured(serviceName: string): boolean {
  const service = SERVICES.find((s) => s.name === serviceName);
  if (!service) return false;

  // Special handling for Linear OAuth (matches "Linear OAuth" or "Linear")
  if (serviceName === "Linear OAuth" || serviceName === "Linear") {
    // Require OAuth credentials (no fallback to API key)
    return service.envVars.every(
      (varName) =>
        process.env[varName] && !process.env[varName]?.startsWith("test_")
    );
  }

  return service.envVars.every(
    (varName) =>
      process.env[varName] && !process.env[varName]?.startsWith("test_")
  );
}

/**
 * Get configuration status for all services
 */
export function getConfigurationStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};

  for (const service of SERVICES) {
    status[service.name] = service.envVars.every(
      (varName) =>
        process.env[varName] && !process.env[varName]?.startsWith("test_")
    );
  }

  return status;
}

/**
 * Throw error if integration test requirements not met
 */
export function requireIntegrationTestConfig(): void {
  const validation = validateIntegrationTestConfig();

  if (!validation.valid) {
    throw new Error(validation.message);
  }
}

/**
 * Skip test if service is not configured
 */
export function skipIfNotConfigured(serviceName: string): void {
  if (!isServiceConfigured(serviceName)) {
    const service = SERVICES.find((s) => s.name === serviceName);
    const vars = service?.envVars.join(", ") || "";

    throw new Error(
      `\n\n⚠️  ${serviceName} is not configured for integration tests.\n` +
        `Set the following environment variables in .env.local:\n` +
        `${vars}\n\n` +
        `Current values are mock/test values. Integration tests need real API keys.\n`
    );
  }
}

/**
 * Print configuration status
 */
export function printConfigurationStatus(): void {
  const status = getConfigurationStatus();

  console.log("\n📊 Integration Test Configuration Status:\n");

  for (const [service, configured] of Object.entries(status)) {
    const icon = configured ? "✅" : "❌";
    const serviceInfo = SERVICES.find((s) => s.name === service);
    const required = serviceInfo?.required ? "(required)" : "(optional)";

    console.log(`  ${icon} ${service} ${required}`);

    // Special message for Linear OAuth
    if (service === "Linear OAuth") {
      if (configured) {
        console.log(`      OAuth credentials configured ✓`);
      } else {
        console.log(`      Missing: ${serviceInfo?.envVars.join(", ")}`);
        console.log(
          `      Get from: https://linear.app/settings/api/applications`
        );
      }
    } else if (!configured && serviceInfo) {
      console.log(`      Missing: ${serviceInfo.envVars.join(", ")}`);
    }
  }

  console.log("");

  const validation = validateIntegrationTestConfig();
  if (!validation.valid) {
    console.log(validation.message);
  }
}

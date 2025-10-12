import "@testing-library/jest-dom";
import * as dotenv from "dotenv";
import * as path from "path";

// IMPORTANT: Load .env.local FIRST before setting any test defaults
// This ensures real API keys from .env.local are preserved
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// Mock environment variables for tests (only if not set in .env.local)
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
    "pk_test_dGVzdGluZy1jbGVyay1kb21haW4=";
}
if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = "sk_test_mock_secret_key";
}

// Supabase test environment (local development keys)
// Use real values from .env.local if present, otherwise use defaults
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = "http://localhost:54321";
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
}

// Analytics test environment - ONLY set if not in .env.local
// This preserves real API keys for integration testing
if (!process.env.POSTHOG_API_KEY) {
  process.env.POSTHOG_API_KEY = "test_posthog_key";
}
if (!process.env.POSTHOG_PROJECT_ID) {
  process.env.POSTHOG_PROJECT_ID = "test_project_id";
}
if (!process.env.POSTHOG_HOST) {
  process.env.POSTHOG_HOST = "https://app.posthog.com";
}
// Linear - OAuth credentials (primary) or API key (fallback)
if (!process.env.LINEAR_CLIENT_ID) {
  process.env.LINEAR_CLIENT_ID = "test_linear_client_id";
}
if (!process.env.LINEAR_CLIENT_SECRET) {
  process.env.LINEAR_CLIENT_SECRET = "test_linear_client_secret";
}
if (!process.env.LINEAR_OAUTH_REDIRECT_URI) {
  process.env.LINEAR_OAUTH_REDIRECT_URI =
    "http://localhost:3000/api/integrations/linear/callback";
}
if (!process.env.LINEAR_API_KEY) {
  process.env.LINEAR_API_KEY = "test_linear_key";
}

// NOTE: NODE_ENV is set by Jest automatically and cannot be overridden

// Reset in-memory database before each test
beforeEach(() => {
  const { resetInMemoryDb } = require("./__mocks__/@supabase/supabase-js");
  resetInMemoryDb();
});

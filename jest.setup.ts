import "@testing-library/jest-dom";

// Mock environment variables for tests
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
  "pk_test_dGVzdGluZy1jbGVyay1kb21haW4=";
process.env.CLERK_SECRET_KEY = "sk_test_mock_secret_key";
// NOTE: NODE_ENV is set by Jest automatically and cannot be overridden

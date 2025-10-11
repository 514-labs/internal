# OAuth Testing Guide

This document describes the test suite for verifying OAuth 2.1 implementation compliance with the MCP Authorization Spec and OpenAI Apps SDK Auth Guidelines.

## Test Suite Overview

The test suite validates that the OAuth implementation correctly follows:
- **MCP Authorization Spec**: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
- **OpenAI Apps SDK Auth Guidelines**: https://developers.openai.com/apps-sdk/build/auth
- **RFC 9728**: OAuth 2.0 Protected Resource Metadata
- **RFC 8414**: OAuth 2.0 Authorization Server Metadata

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Categories

### 1. RFC 9728: Protected Resource Metadata
Tests the `/.well-known/oauth-protected-resource` endpoint:
- ✓ Returns valid protected resource metadata with required fields
- ✓ Includes proper CORS headers for cross-origin requests
- ✓ Resource URL correctly points to `/mcp` endpoint

### 2. RFC 8414: Authorization Server Metadata
Tests the `/.well-known/oauth-authorization-server` endpoint:
- ✓ Returns all required OAuth 2.0 metadata fields (issuer, endpoints, etc.)
- ✓ Includes dynamic client registration endpoint
- ✓ Declares OAuth 2.1 specific features (PKCE, grant types)
- ✓ Lists supported scopes (openid, profile, email)
- ✓ Issuer URL matches between protected resource and auth server metadata

### 3. OpenID Connect Discovery
Tests the `/.well-known/openid-configuration` endpoint:
- ✓ Provides valid OIDC configuration
- ✓ Metadata is consistent with OAuth authorization server endpoint

### 4. CORS and HTTP Headers
- ✓ Handles OPTIONS requests properly
- ✓ Returns appropriate Cache-Control headers

### 5. Error Handling
- ✓ Handles missing Clerk configuration gracefully

### 6. MCP Spec Compliance
- ✓ All OAuth URLs use HTTPS in production
- ✓ No token in query string patterns (security best practice)

### 7. Security Best Practices
- ✓ Requires PKCE (S256) for all authorization flows
- ✓ Doesn't expose sensitive information in metadata

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

All tests pass successfully! ✅

## Key OAuth Endpoints Tested

1. **`/.well-known/oauth-protected-resource`**
   - Returns RFC 9728 compliant metadata
   - Specifies authorization servers and required scopes
   - Points to the MCP resource server

2. **`/.well-known/oauth-authorization-server`**
   - Returns RFC 8414 compliant metadata
   - Proxies to Clerk's OAuth/OIDC configuration
   - Includes all required endpoints (authorization, token, jwks, registration)

3. **`/.well-known/openid-configuration`**
   - OpenID Connect discovery endpoint
   - Compatible with OIDC-compliant clients
   - Consistent with oauth-authorization-server metadata

## Mocking Strategy

The test suite uses Jest mocks for:
- **Clerk MCP Tools**: Mock implementations of `protectedResourceHandlerClerk`, `authServerMetadataHandlerClerk`, and helper functions
- **Fetch API**: Mocked for OIDC configuration tests to avoid external dependencies
- **Environment Variables**: Pre-configured test values for Clerk keys

## Test Files

- `__tests__/oauth.test.ts` - Main OAuth test suite
- `__mocks__/@clerk/mcp-tools/next.ts` - Mock implementations
- `jest.config.ts` - Jest configuration
- `jest.setup.ts` - Test environment setup

## What the Tests Validate

### Compliance Checks
- [x] OAuth 2.1 with PKCE (S256 required)
- [x] Protected Resource Metadata (RFC 9728)
- [x] Authorization Server Metadata (RFC 8414)
- [x] Dynamic Client Registration (RFC 7591)
- [x] HTTPS Only (production requirement)
- [x] CORS headers for cross-origin requests
- [x] Proper Cache-Control headers
- [x] Secure scope handling

### Security Checks
- [x] No secrets in metadata
- [x] No private keys exposed
- [x] No actual tokens in metadata
- [x] PKCE required (no plain challenge method)
- [x] HTTPS for all OAuth URLs

## Continuous Integration

These tests should be run:
- Before each commit
- In CI/CD pipelines
- Before deploying to production

## Extending the Tests

To add new OAuth tests:

1. Add test case to `__tests__/oauth.test.ts`
2. Group by category (RFC compliance, security, etc.)
3. Use descriptive test names that explain what's being validated
4. Mock external dependencies appropriately
5. Validate against spec requirements

## Troubleshooting

### Tests fail with "Cannot find module"
- Run `pnpm install` to ensure all dependencies are installed
- Check that mocks in `__mocks__/` directory match import paths

### Fetch errors in tests
- Ensure `global.fetch` is mocked for tests that make external requests
- Check that mock responses match expected format

### Type errors
- Ensure `@types/jest` is installed
- Check that `jest.setup.ts` is properly configured in `jest.config.ts`

## References

- [MCP Authorization Specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization)
- [OpenAI Apps SDK Auth Guide](https://developers.openai.com/apps-sdk/build/auth)
- [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 8414: OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13)


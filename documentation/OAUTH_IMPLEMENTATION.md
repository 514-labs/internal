# OAuth 2.1 Implementation for ChatGPT MCP Integration

This document describes the OAuth 2.1 implementation following the [MCP Authorization Spec](https://spec.modelcontextprotocol.io/specification/2025-06-18/basic/authorization/) and [OpenAI Apps SDK Auth Guidelines](https://developers.openai.com/apps-sdk/build/auth).

## ✅ Required Endpoints (All Implemented)

### 1. `/.well-known/oauth-protected-resource` (RFC 9728)
**Status:** ✅ Implemented  
**Location:** `app/.well-known/oauth-protected-resource/route.ts`

- Lists authorization servers and required scopes for the MCP endpoint
- Specifies the resource server URL: `${baseURL}/mcp`
- Supports scopes: `["profile", "email"]`
- Includes proper CORS headers for OPTIONS requests

**What it does:**
- Tells ChatGPT which authorization server to use
- Specifies which scopes are needed to access the MCP server

### 2. `/.well-known/oauth-authorization-server` (RFC 8414)
**Status:** ✅ Implemented  
**Location:** `app/.well-known/oauth-authorization-server/route.ts`

- Proxies to Clerk's OAuth/OIDC configuration
- Provides all required fields:
  - `authorization_endpoint`
  - `token_endpoint`
  - `jwks_uri`
  - `registration_endpoint`
  - `issuer`
- Includes OAuth 2.1 specific metadata:
  - `response_types_supported: ["code"]`
  - `grant_types_supported: ["authorization_code", "refresh_token"]`
  - `code_challenge_methods_supported: ["S256"]` (PKCE)

**What it does:**
- Discovery document that tells ChatGPT where to find Clerk's OAuth endpoints
- Enables dynamic client registration
- Declares PKCE support (required by MCP spec)

### 3. `/.well-known/openid-configuration` (OpenID Connect)
**Status:** ✅ Implemented  
**Location:** `app/.well-known/openid-configuration/route.ts`

- Alternative discovery endpoint (OpenID Connect standard)
- Provides the same information as oauth-authorization-server
- Compatible with OIDC-compliant clients

**What it does:**
- OpenID Connect discovery endpoint
- Some clients may use this instead of oauth-authorization-server

### 4. `/mcp` - MCP Server Endpoint
**Status:** ✅ Implemented with Auth  
**Location:** `app/[transport]/route.ts` (dynamic route, accessible at `/mcp`)

- Protected by `withMcpAuth` wrapper
- Requires OAuth token on all requests
- Token verification via Clerk
- Returns 401 with `WWW-Authenticate` header when auth fails

## 🔒 Security Implementation

### MCP Spec Compliance Checklist

- ✅ **OAuth 2.1 with PKCE** - Clerk supports PKCE for authorization code flow
- ✅ **Protected Resource Metadata (RFC 9728)** - Implemented at `/.well-known/oauth-protected-resource`
- ✅ **Authorization Server Metadata (RFC 8414)** - Implemented at `/.well-known/oauth-authorization-server`
- ✅ **Dynamic Client Registration (RFC 7591)** - Supported by Clerk
- ✅ **Token Audience Validation** - Enforced via `verifyClerkToken`
- ✅ **WWW-Authenticate Headers** - Handled by `withMcpAuth` middleware
- ✅ **HTTPS Only** - Enforced by Vercel deployment
- ✅ **Access Token in Authorization Header** - Required by `withMcpAuth`
- ✅ **No Token in Query String** - Enforced by implementation

### Clerk-Specific Configuration

**Required Environment Variables:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Clerk Features Used:**
1. **OAuth 2.1 Authorization Server** - Clerk handles the full OAuth flow
2. **Dynamic Client Registration** - ChatGPT can register itself automatically
3. **JWT Token Validation** - `verifyClerkToken` validates tokens on each request
4. **PKCE Support** - Built into Clerk's OAuth implementation

## 🔄 OAuth Flow

```
1. ChatGPT → /mcp (no token)
   ↓
2. MCP Server → 401 with WWW-Authenticate header
   ↓
3. ChatGPT → /.well-known/oauth-protected-resource
   ↓
4. MCP Server → Returns { authorization_servers: [...], scopes: [...] }
   ↓
5. ChatGPT → /.well-known/oauth-authorization-server
   ↓
6. MCP Server → Returns Clerk's OAuth metadata (proxied)
   ↓
7. ChatGPT → Clerk's registration_endpoint
   ↓
8. Clerk → Returns client_id
   ↓
9. ChatGPT → Opens browser to Clerk's authorization_endpoint
   ↓
10. User → Authenticates with Clerk
   ↓
11. Clerk → Redirects back to ChatGPT with authorization code
   ↓
12. ChatGPT → Clerk's token_endpoint (with code + PKCE verifier)
   ↓
13. Clerk → Returns access_token
   ↓
14. ChatGPT → /mcp (with Authorization: Bearer <token>)
   ↓
15. MCP Server → Verifies token, executes tool, returns response
```

## 🔍 Testing & Verification

### 1. Local Testing

Start your dev server:
```bash
pnpm dev
```

Test the endpoints:
```bash
# Test protected resource metadata
curl http://localhost:3000/.well-known/oauth-protected-resource

# Test authorization server metadata
curl http://localhost:3000/.well-known/oauth-authorization-server

# Test OpenID configuration
curl http://localhost:3000/.well-known/openid-configuration

# Test MCP endpoint (should return 401)
curl http://localhost:3000/mcp
```

### 2. Production Testing

After deploying to Vercel:
```bash
curl https://your-app.vercel.app/.well-known/oauth-protected-resource
curl https://your-app.vercel.app/.well-known/oauth-authorization-server
```

### 3. ChatGPT Integration

1. Navigate to ChatGPT → **Settings → Connectors → Create**
2. Add your MCP server URL: `https://your-app.vercel.app/mcp`
3. ChatGPT will automatically:
   - Discover the OAuth endpoints
   - Register itself with Clerk
   - Prompt the user to authenticate
   - Store the access token
   - Use it for all subsequent MCP requests

## 🚨 Common Issues & Solutions

### Issue: "MCP server does not implement OAuth"

**Causes:**
- `/.well-known/oauth-protected-resource` is not accessible
- Endpoint is returning 404 or error
- Middleware is blocking access

**Solution:**
- Verify middleware allows public access to `/.well-known/*` paths
- Check that endpoint is deployed and returning valid JSON

### Issue: "Error fetching OAuth configuration"

**Causes:**
- `/.well-known/oauth-authorization-server` is missing or erroring
- Clerk domain not properly extracted from publishable key
- Network error connecting to Clerk

**Solution:**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
- Check server logs for Clerk API errors
- Ensure endpoint returns all required fields

### Issue: "Token validation failed"

**Causes:**
- Token audience doesn't match
- Token expired
- Invalid signature

**Solution:**
- Verify `verifyClerkToken` is properly configured
- Ensure tokens are issued for the correct resource server
- Check Clerk dashboard for token settings

## 📚 References

- [MCP Authorization Specification](https://spec.modelcontextprotocol.io/specification/2025-06-18/basic/authorization/)
- [OpenAI Apps SDK Authentication Guide](https://developers.openai.com/apps-sdk/build/auth)
- [OAuth 2.1 Draft Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13)
- [RFC 8414: OAuth 2.0 Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414)
- [RFC 9728: OAuth 2.0 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 7591: OAuth 2.0 Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591)
- [RFC 8707: Resource Indicators for OAuth 2.0](https://www.rfc-editor.org/rfc/rfc8707.html)
- [Clerk OAuth Documentation](https://clerk.com/docs/authentication/oauth)

## ✨ Best Practices Implemented

1. ✅ **Separation of Concerns** - Authorization server (Clerk) separate from resource server (MCP)
2. ✅ **Token Audience Validation** - Tokens are validated for the correct resource
3. ✅ **No Token Passthrough** - MCP server doesn't forward tokens to other services
4. ✅ **Short-lived Tokens** - Clerk issues tokens with appropriate expiration
5. ✅ **Refresh Token Rotation** - Clerk handles refresh token rotation
6. ✅ **PKCE Required** - Protects against authorization code interception
7. ✅ **Exact Redirect URI Matching** - Clerk validates redirect URIs
8. ✅ **State Parameter** - ChatGPT and Clerk use state for CSRF protection


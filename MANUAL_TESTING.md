# Manual OAuth Testing Guide

This guide walks you through manually testing the OAuth implementation to verify it's working correctly with ChatGPT Apps.

## Prerequisites

1. Deploy your app to Vercel (or have it running locally on an HTTPS tunnel like ngrok)
2. Ensure these environment variables are set in Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. **Important:** Disable Vercel Deployment Protection for OAuth endpoints
   - Either use the `vercel.json` configuration (recommended)
   - Or disable protection in Vercel Dashboard → Settings → Deployment Protection

## Step 1: Test OAuth Discovery Endpoints

These endpoints should be publicly accessible and return JSON metadata.

### Test Protected Resource Metadata (RFC 9728)

```bash
curl https://your-app.vercel.app/.well-known/oauth-protected-resource
```

**Expected Response:**
```json
{
  "resource": "https://your-app.vercel.app/mcp",
  "authorization_servers": ["https://your-clerk-domain.clerk.accounts.dev"],
  "scopes_supported": ["profile", "email"],
  "token_types_supported": ["urn:ietf:params:oauth:token-type:access_token"],
  "jwks_uri": "https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json",
  ...
}
```

✅ **What to check:**
- Status: `200 OK`
- `resource` field points to your `/mcp` endpoint
- `authorization_servers` array is not empty
- `scopes_supported` includes your required scopes

❌ **If it fails:**
- 404: Check your route file exists at `app/.well-known/oauth-protected-resource/route.ts`
- 500: Check Clerk env vars are set correctly

### Test Authorization Server Metadata (RFC 8414)

```bash
curl https://your-app.vercel.app/.well-known/oauth-authorization-server
```

**Expected Response:**
```json
{
  "issuer": "https://your-clerk-domain.clerk.accounts.dev",
  "authorization_endpoint": "https://your-clerk-domain.clerk.accounts.dev/oauth/authorize",
  "token_endpoint": "https://your-clerk-domain.clerk.accounts.dev/oauth/token",
  "jwks_uri": "https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json",
  "registration_endpoint": "https://your-clerk-domain.clerk.accounts.dev/oauth/register",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  ...
}
```

✅ **What to check:**
- Status: `200 OK`
- All required endpoints present (authorization, token, jwks, registration)
- `code_challenge_methods_supported` includes `"S256"` (PKCE)
- `issuer` field matches the value in `authorization_servers` from previous endpoint

❌ **If it fails:**
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
- Verify Clerk domain extraction is working

### Test OpenID Configuration (Optional)

```bash
curl https://your-app.vercel.app/.well-known/openid-configuration
```

Should return similar metadata to the authorization server endpoint.

## Step 2: Test MCP Endpoint Without Auth (Expected to Fail)

```bash
curl -X POST https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

**Expected Response:**
```json
{
  "error": "invalid_token",
  "error_description": "No authorization provided"
}
```

✅ **What to check:**
- Status: `401 Unauthorized`
- Response includes `WWW-Authenticate` header with `resource_metadata` parameter

**Check the WWW-Authenticate header:**
```bash
curl -i -X POST https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

Should include:
```
WWW-Authenticate: Bearer error="invalid_token", error_description="No authorization provided", resource_metadata="https://your-app.vercel.app/.well-known/oauth-protected-resource"
```

✅ **This is CORRECT behavior!** The MCP endpoint should reject requests without valid OAuth tokens.

## Step 3: Verify Clerk OAuth Configuration

### Check Clerk Dashboard Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **"OAuth Applications"** or **"API Keys"**
4. Verify:
   - ✅ OAuth 2.0 is enabled
   - ✅ Dynamic client registration is enabled
   - ✅ PKCE is required
   - ✅ At least one authentication method is configured (e.g., email/password, social login)

### Verify Clerk OAuth Endpoints are Accessible

```bash
# Get your Clerk domain from the publishable key
# If key is pk_test_abc123, decode the base64 part to get the domain

curl https://your-clerk-domain.clerk.accounts.dev/.well-known/openid-configuration
```

This should return Clerk's OAuth configuration with all required endpoints.

## Step 4: Test with ChatGPT Apps

This is the real end-to-end test.

### Add MCP Server to ChatGPT

1. Open ChatGPT
2. Go to **Settings** → **[Connectors](https://chatgpt.com/#settings/Connectors)**
3. Click **"Create"** or **"Add Connector"**
4. Enter your MCP server URL: `https://your-app.vercel.app/mcp`
5. Click **"Add"**

### Expected OAuth Flow

When ChatGPT tries to connect:

1. **Discovery Phase:**
   - ChatGPT makes POST request to `/mcp`
   - Gets `401` with `WWW-Authenticate` header
   - Follows `resource_metadata` URL to `/.well-known/oauth-protected-resource`
   - Discovers authorization server URL

2. **Authorization Server Discovery:**
   - ChatGPT fetches `/.well-known/oauth-authorization-server`
   - Gets all OAuth endpoints (authorize, token, registration)

3. **Dynamic Client Registration:**
   - ChatGPT registers itself at Clerk's `registration_endpoint`
   - Receives a `client_id`

4. **User Authorization:**
   - ChatGPT opens browser to Clerk's authorization URL
   - User logs in with Clerk
   - User grants permissions (scopes: profile, email)
   - Clerk redirects back to ChatGPT with authorization code

5. **Token Exchange:**
   - ChatGPT exchanges code + PKCE verifier for access token
   - Receives `access_token` from Clerk

6. **Authenticated Request:**
   - ChatGPT retries POST to `/mcp` with `Authorization: Bearer <token>`
   - Request succeeds, tools are listed

### Troubleshooting ChatGPT Apps Integration

**If ChatGPT says "does not implement OAuth":**

❌ **Check #1: Discovery endpoints are accessible**
```bash
curl https://your-app.vercel.app/.well-known/oauth-protected-resource
# Should return 200 OK with JSON
```

❌ **Check #2: WWW-Authenticate header is correct**
```bash
curl -i -X POST https://your-app.vercel.app/mcp
# Check for WWW-Authenticate header with resource_metadata parameter
```

❌ **Check #3: CORS headers are present**
```bash
curl -i -X OPTIONS https://your-app.vercel.app/.well-known/oauth-protected-resource
# Should return Access-Control-Allow-Origin: *
```

❌ **Check #4: Clerk endpoints are reachable**
```bash
# Get authorization_servers URL from protected resource metadata
curl https://your-clerk-domain.clerk.accounts.dev/.well-known/openid-configuration
# Should return 200 OK
```

❌ **Check #5: Middleware isn't blocking OAuth endpoints**
Check `middleware.ts` includes:
```typescript
const isPublicRoute = createRouteMatcher([
  "/.well-known/oauth-authorization-server(.*)",
  "/.well-known/oauth-protected-resource(.*)",
  "/.well-known/openid-configuration(.*)",
  "/mcp(.*)", // MCP endpoint must be publicly accessible for OAuth flow
]);
```

## Step 5: Test with Real OAuth Token (Advanced)

If you want to test with a real token:

### Option A: Use Clerk Dashboard

1. Go to Clerk Dashboard → Your App → Users
2. Select a test user
3. Generate an OAuth token for that user
4. Use it in requests:

```bash
curl -X POST https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

### Option B: Full OAuth Flow with Postman/cURL

This is complex - easier to let ChatGPT do it automatically.

## Debugging Checklist

Use this checklist to verify each component:

- [ ] `.well-known/oauth-protected-resource` returns 200 OK
- [ ] Protected resource metadata includes `resource` and `authorization_servers`
- [ ] `.well-known/oauth-authorization-server` returns 200 OK
- [ ] Auth server metadata includes all required endpoints
- [ ] Auth server supports PKCE (S256)
- [ ] Auth server has `registration_endpoint`
- [ ] `/mcp` without token returns 401 with `WWW-Authenticate` header
- [ ] `WWW-Authenticate` header includes `resource_metadata` URL
- [ ] CORS headers are present on all `.well-known` endpoints
- [ ] Middleware allows public access to OAuth endpoints
- [ ] Clerk OAuth is enabled in dashboard
- [ ] Clerk domain is correctly extracted from publishable key
- [ ] Environment variables are set in Vercel

## Common Issues and Solutions

### Vercel Deployment Protection Blocking Access

**Symptom:** Curl returns HTML authentication page instead of JSON

**Cause:** Vercel's deployment protection requires authentication to access preview deployments

**Solution:**
1. Add `vercel.json` with `deploymentProtection.bypassForRoutes` configuration
2. Or disable protection in Vercel Dashboard → Settings → Deployment Protection
3. Or test on production deployment (usually has protection disabled)

### "does not implement OAuth"

**Cause:** ChatGPT can't discover OAuth endpoints

**Solution:**
1. Verify all `.well-known` endpoints return 200
2. Check CORS headers are present
3. Ensure middleware doesn't block these endpoints
4. Verify URLs are publicly accessible (not behind auth)

### "Invalid token" or "Token verification failed"

**Cause:** Token verification is failing

**Solution:**
1. Check Clerk secret key is correct
2. Verify token audience matches your resource URL
3. Ensure Clerk domain matches between endpoints
4. Check token isn't expired

### "Registration failed"

**Cause:** Dynamic client registration issues

**Solution:**
1. Enable dynamic registration in Clerk dashboard
2. Verify `registration_endpoint` is in auth server metadata
3. Check Clerk application settings allow new clients

## Success Criteria

✅ Your OAuth implementation is working when:

1. All discovery endpoints return 200 OK
2. `/mcp` without token returns 401 with proper headers
3. ChatGPT successfully authenticates users
4. Users can see and use your MCP tools in ChatGPT
5. Subsequent requests work without re-authentication

## Next Steps

Once OAuth is working:

1. Test tool invocations from ChatGPT
2. Verify user data is correctly passed to tools
3. Test token refresh (if implemented)
4. Monitor logs for any errors
5. Add analytics/monitoring for OAuth flows

## Getting Help

If you're still having issues:

1. Check Vercel deployment logs for errors
2. Check browser developer console in ChatGPT
3. Verify all environment variables are set
4. Review the test suite results (`pnpm test`)
5. Check the MCP spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization


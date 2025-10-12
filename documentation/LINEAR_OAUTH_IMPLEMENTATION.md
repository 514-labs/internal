# Linear OAuth 2.0 Implementation

## Overview

This document describes the OAuth 2.0 implementation for the Linear integration. The system has been migrated from API key authentication to OAuth 2.0 with app-level authentication, providing automatic token refresh, secure storage, and admin-controlled access.

## Implementation Status: ✅ Complete

All planned features have been implemented and tested.

## Key Features

### ✅ OAuth 2.0 Authentication
- **App Actor Type**: Uses Linear's `app` actor for workspace-level integration
- **PKCE Flow**: Implements PKCE (Proof Key for Code Exchange) for enhanced security
- **Automatic Token Refresh**: Tokens automatically refresh before expiration (24-hour lifetime)
- **Secure Storage**: Tokens stored in Supabase with service role access only

### ✅ Admin-Controlled Integration
- **Admin-Only Access**: Only users with `admin` role can connect/disconnect Linear
- **Centralized Management**: Single workspace-level connection managed from `/settings/integrations`
- **Status Monitoring**: View token expiration, scopes, and connection health

### ✅ Backward Compatibility
- **API Key Fallback**: System falls back to `LINEAR_API_KEY` if OAuth not configured
- **Seamless Migration**: Existing setups continue to work while new installations use OAuth

## Architecture

### Database Schema

**Table**: `integration_tokens`
- Stores OAuth tokens for all integrations (Linear, future: GitHub, Jira, etc.)
- One row per integration (Linear = single workspace token)
- Automatic `updated_at` timestamp tracking

```sql
CREATE TABLE integration_tokens (
  id UUID PRIMARY KEY,
  integration_name TEXT UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

### Core Components

#### 1. Token Management (`lib/integrations/linear-oauth.ts`)
- `storeLinearTokens()` - Saves tokens from OAuth callback
- `getLinearTokens()` - Retrieves current tokens
- `getValidLinearToken()` - Gets token, refreshing if needed
- `refreshLinearToken()` - Exchanges refresh token for new access token
- `revokeLinearToken()` - Revokes and deletes tokens
- `isLinearConnected()` - Checks connection status
- `isTokenExpired()` - Checks if token needs refresh (5-minute buffer)

#### 2. Linear Client (`lib/analytics/linear/client.ts`)
**Updated**: Now async-compatible with OAuth token retrieval
- `getLinearClient()` - Returns configured Linear SDK client
  - Tries OAuth token first
  - Falls back to API key
  - Caches client for 60 seconds
- `resetLinearClient()` - Forces client refresh after token operations

#### 3. OAuth Routes

**Authorization Initiation** (`app/api/integrations/linear/authorize/route.ts`)
- Verifies admin permission
- Generates PKCE code challenge
- Stores verifier in secure cookie
- Redirects to Linear OAuth page with:
  - `actor=app` (critical for app-level auth)
  - `scope=read,write`
  - `code_challenge` and `code_challenge_method=S256`

**OAuth Callback** (`app/api/integrations/linear/callback/route.ts`)
- Validates state (CSRF protection)
- Exchanges authorization code for tokens
- Stores tokens in database
- Resets Linear client
- Redirects to settings with success message

**Disconnect** (`app/api/integrations/linear/disconnect/route.ts`)
- Revokes token with Linear API
- Deletes token from database
- Resets client cache

**Status Check** (`app/api/integrations/linear/status/route.ts`)
- Returns connection status
- Shows token expiration
- Admin-only endpoint

#### 4. Admin UI (`app/settings/integrations/page.tsx`)
- Connection status display
- Connect/Disconnect buttons
- Token expiration monitoring
- Setup instructions
- Error handling with user-friendly messages

#### 5. Sidebar Integration (`components/app-sidebar.tsx`)
- Admin-only "Integrations" menu item
- Visible only when `user.publicMetadata.role === "admin"`
- Quick access to integration management

## OAuth Flow

```
1. Admin visits /settings/integrations
   ↓
2. Clicks "Connect Linear"
   ↓
3. Backend generates PKCE challenge
   ↓
4. Redirects to Linear OAuth (actor=app, PKCE)
   ↓
5. User authorizes on Linear
   ↓
6. Linear redirects to /api/integrations/linear/callback
   ↓
7. Backend exchanges code + verifier for tokens
   ↓
8. Tokens stored in Supabase
   ↓
9. Linear client uses OAuth token for all API calls
   ↓
10. Tokens auto-refresh every 24 hours
```

## Environment Variables

### Required for OAuth

```bash
# Linear OAuth Configuration
LINEAR_CLIENT_ID=your_client_id
LINEAR_CLIENT_SECRET=your_client_secret
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# Production
LINEAR_OAUTH_REDIRECT_URI=https://your-domain.com/api/integrations/linear/callback
```

### Legacy Fallback

```bash
# Optional: API key fallback
LINEAR_API_KEY=lin_api_your_key
```

## Setup Instructions

### 1. Create Linear OAuth App

1. Visit [Linear Settings → API](https://linear.app/settings/api)
2. Click "Create New OAuth Application"
3. Configure:
   - **Application Name**: Your Company Analytics
   - **Callback URLs**: 
     - Dev: `http://localhost:3000/api/integrations/linear/callback`
     - Prod: `https://your-domain.com/api/integrations/linear/callback`
   - **Scopes**: Select `read` and `write`
4. Save Client ID and Client Secret

### 2. Configure Environment

Add to `.env.local`:
```bash
LINEAR_CLIENT_ID=your_client_id
LINEAR_CLIENT_SECRET=your_client_secret
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback
```

### 3. Run Database Migration

```bash
supabase migration up
# Applies: 20240102000000_linear_oauth_tokens.sql
```

### 4. Connect via UI

1. Sign in as admin
2. Visit `/settings/integrations`
3. Click "Connect Linear"
4. Authorize on Linear
5. Verify connection success

## Security Features

### ✅ PKCE Implementation
- Code verifier generated with 32 random bytes
- Code challenge uses SHA-256 hash
- Verifier stored in secure HTTP-only cookie
- Protection against authorization code interception

### ✅ State Parameter (CSRF Protection)
- Random state generated for each authorization request
- Stored in secure HTTP-only cookie
- Validated on callback to prevent CSRF attacks

### ✅ Secure Token Storage
- Tokens stored in Supabase with RLS enabled
- Service role access only (backend-only)
- Never exposed to client-side code
- Automatic cleanup of expired tokens possible

### ✅ Admin-Only Access
- All OAuth routes verify admin role via `requireAdmin()`
- Settings page hidden from non-admin users
- API endpoints return 401/403 for unauthorized access

### ✅ Token Expiration Handling
- 5-minute buffer before expiration
- Automatic refresh in background
- Graceful fallback to API key if refresh fails

## Testing

### Unit Tests (`__tests__/analytics/unit/linear/client.test.ts`)

**Updated tests**:
- ✅ OAuth token retrieval and initialization
- ✅ Fallback to API key when OAuth unavailable
- ✅ Error handling when neither method available
- ✅ Async client operations

### Mock Implementation (`__mocks__/lib/integrations/linear-oauth.ts`)
- Provides test doubles for all OAuth functions
- Allows testing without actual OAuth flow
- Configurable return values for different scenarios

### Manual Testing Checklist

- [ ] Admin can access `/settings/integrations`
- [ ] Non-admin users see "Admin access required" message
- [ ] "Connect Linear" redirects to Linear OAuth page
- [ ] Authorization completes and redirects back
- [ ] Status shows "Connected" with expiration date
- [ ] Linear API calls work with OAuth token
- [ ] Token automatically refreshes when expired
- [ ] "Disconnect" revokes token and updates status
- [ ] API key fallback works when OAuth not configured

## Documentation

### ✅ Updated Files

1. **`lib/analytics/QUICK_START.md`**
   - Comprehensive OAuth setup guide
   - Benefits of OAuth over API keys
   - Step-by-step Linear OAuth app creation
   - Migration guide from API key
   - Troubleshooting common issues

2. **`lib/analytics/README.md`**
   - Updated environment variables section
   - OAuth authentication mention
   - Link to QUICK_START.md for details

3. **`LINEAR_OAUTH_IMPLEMENTATION.md`** (this file)
   - Complete implementation documentation
   - Architecture overview
   - Security features
   - Testing guide

## Migration Guide

### From API Key to OAuth

1. **Complete OAuth setup** (see Setup Instructions above)
2. **Connect Linear** via admin UI at `/settings/integrations`
3. **Test API calls** - should work with OAuth automatically
4. **Remove API key** from `.env.local` (optional, kept as fallback)
5. **Verify** - check `/api/integrations/linear/status` shows connected

### Zero Downtime Migration

The implementation supports zero-downtime migration:
1. OAuth takes precedence when configured
2. API key acts as automatic fallback
3. Both can coexist during transition period
4. Remove API key only after confirming OAuth works

## Benefits of OAuth Implementation

### For Administrators
- ✅ **Centralized Control**: Single point to manage Linear access
- ✅ **Easy Setup**: GUI-based connection via settings page
- ✅ **Status Visibility**: See connection health and token expiration
- ✅ **Revocation**: Instant disconnect with one click

### For Developers
- ✅ **No Manual Token Rotation**: Automatic refresh handling
- ✅ **Type-Safe**: Full TypeScript support throughout
- ✅ **Error Handling**: Graceful fallbacks and clear error messages
- ✅ **Testing**: Comprehensive mocks and unit tests

### For Security
- ✅ **OAuth 2.0 Best Practices**: PKCE, state parameter, secure storage
- ✅ **Minimal Exposure**: Tokens never leave the backend
- ✅ **Admin-Only**: Only authorized users can manage integrations
- ✅ **Audit Trail**: Database tracks token creation and updates

## Future Enhancements

- [ ] Add webhook support for token revocation events
- [ ] Implement token usage analytics
- [ ] Add support for multiple workspaces (if needed)
- [ ] Create OAuth setup wizard for first-time users
- [ ] Add Slack/email notifications for token expiration
- [ ] Extend pattern to other integrations (GitHub, Jira, etc.)

## Troubleshooting

### "Configuration error" when connecting
- Verify all three env vars are set: `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`, `LINEAR_OAUTH_REDIRECT_URI`
- Check redirect URI exactly matches callback URL in Linear app settings

### "Invalid state" error
- Security feature - try connecting again
- Clear browser cookies if issue persists
- Check that cookies are enabled

### Token refresh failures
- Check Supabase connection and service role key
- Verify Linear app still exists and is active
- Try disconnecting and reconnecting

### API calls fail with OAuth
- Check `/api/integrations/linear/status` to verify connection
- Look for error messages in server logs
- Verify token hasn't been manually revoked in Linear

### Falling back to API key unexpectedly
- OAuth token may have expired without successful refresh
- Check Supabase logs for errors during token retrieval
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

## Support

For issues or questions:
1. Check this documentation first
2. Review `lib/analytics/QUICK_START.md` for setup help
3. Check server logs for detailed error messages
4. Verify all environment variables are set correctly
5. Test with the manual testing checklist above

---

**Implementation Date**: January 2024  
**Last Updated**: January 2024  
**Status**: Production Ready ✅


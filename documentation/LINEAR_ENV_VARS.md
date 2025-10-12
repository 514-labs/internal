# Linear Environment Variables

## Required for OAuth (Recommended Method)

```bash
# Get these from: https://linear.app/settings/api/applications
# Create a new OAuth application

LINEAR_CLIENT_ID=your_linear_client_id
LINEAR_CLIENT_SECRET=your_linear_client_secret
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback
```

### How to Get OAuth Credentials

1. Go to **https://linear.app/settings/api/applications**
2. Click **"Create new application"**
3. Fill in:
   - **Name**: "Your App Name - Internal Analytics"
   - **Redirect URI**: `http://localhost:3000/api/integrations/linear/callback`
   - **Actor**: Select **"Application"** (for app-level access)
4. Click **Create**
5. Copy:
   - **Client ID** → `LINEAR_CLIENT_ID`
   - **Client Secret** → `LINEAR_CLIENT_SECRET`
6. Add to `.env.local`

### Production Setup

For production, update the redirect URI:
```bash
LINEAR_OAUTH_REDIRECT_URI=https://your-domain.com/api/integrations/linear/callback
```

And update it in Linear application settings.

## Alternative: API Key (Fallback Method)

```bash
# Get from: https://linear.app/settings/api
# Create a Personal API Key

LINEAR_API_KEY=lin_api_your_personal_key
```

### Limitations of API Key

- ⚠️ Personal key tied to your user account
- ⚠️ No automatic token refresh
- ⚠️ Limited to your personal access
- ⚠️ Not recommended for production

### How to Get API Key

1. Go to **https://linear.app/settings/api**
2. Click **"Create new key"**
3. Give it a name (e.g., "Development Testing")
4. Copy the key → `LINEAR_API_KEY`
5. Add to `.env.local`

## Which Method Should You Use?

### Use OAuth (Recommended) When:
- ✅ Running in production
- ✅ Need workspace-level access (not tied to one user)
- ✅ Want automatic token refresh
- ✅ Want admin-controlled integrations
- ✅ Building for team use

### Use API Key When:
- ⚠️ Quick local testing
- ⚠️ Don't want to set up OAuth app
- ⚠️ Personal development only
- ⚠️ Temporary access needed

## Complete .env.local Example

```bash
# ===== Linear OAuth (Recommended) =====
LINEAR_CLIENT_ID=abc123...
LINEAR_CLIENT_SECRET=xyz789...
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# ===== Linear API Key (Optional Fallback) =====
# LINEAR_API_KEY=lin_api_...

# Note: If both are set:
# - OAuth takes priority when connected via /settings/integrations
# - API key used as fallback if OAuth token expires or fails
```

## Authentication Flow

### With OAuth Configured:
```
1. Admin visits /settings/integrations
2. Clicks "Connect Linear"
3. GET /api/integrations/linear/authorize
   - Generates PKCE challenge
   - Redirects to Linear OAuth
4. User authorizes in Linear
5. Linear redirects to callback with code
6. GET /api/integrations/linear/callback
   - Exchanges code for tokens
   - Stores in Supabase integration_tokens table
7. All Linear queries use OAuth token
8. Token auto-refreshes before expiration
```

### With API Key Only:
```
1. Set LINEAR_API_KEY in .env.local
2. All Linear queries use API key
3. No token refresh (static key)
```

## Testing

### For Unit Tests
Mock values are fine (set automatically in jest.setup.ts):
```bash
# These are set automatically - no action needed
LINEAR_CLIENT_ID=test_linear_client_id
LINEAR_CLIENT_SECRET=test_linear_client_secret
```

### For Integration Tests  
Use real OAuth credentials or real API key:
```bash
# Option 1: Real OAuth credentials (recommended)
LINEAR_CLIENT_ID=your_real_client_id
LINEAR_CLIENT_SECRET=your_real_client_secret
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# Option 2: Real API key (fallback)
LINEAR_API_KEY=lin_api_your_real_key
```

Integration tests will show:
```
✅ Linear (optional)
    OAuth configured (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
```

Or:
```
✅ Linear (optional)
    Using API key as fallback
```

## Migration Path

### Current: API Key Only
```bash
LINEAR_API_KEY=lin_api_123
```

### Add OAuth (Keep API Key as Fallback)
```bash
# Add OAuth credentials
LINEAR_CLIENT_ID=abc123
LINEAR_CLIENT_SECRET=xyz789
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# Keep API key as fallback
LINEAR_API_KEY=lin_api_123
```

### Final: OAuth Only (Recommended)
```bash
# OAuth credentials
LINEAR_CLIENT_ID=abc123
LINEAR_CLIENT_SECRET=xyz789
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# Remove API key (OAuth is primary)
# LINEAR_API_KEY=lin_api_123
```

## Summary

**Required for OAuth:**
- `LINEAR_CLIENT_ID` - From Linear OAuth app
- `LINEAR_CLIENT_SECRET` - From Linear OAuth app  
- `LINEAR_OAUTH_REDIRECT_URI` - Callback URL

**Optional Fallback:**
- `LINEAR_API_KEY` - Personal API key

**Recommendation**: Set up OAuth for production, keep API key for quick local testing.


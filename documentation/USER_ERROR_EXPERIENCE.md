# User Error Experience Guide

## Overview

This document describes how errors are presented to end users and how they can remediate issues directly from the UI.

## User-Facing Error Display

### Configuration Errors

When Linear integration is not configured, users see a friendly, actionable error page instead of a broken dashboard.

#### Visual Design

- **Alert Banner**: Red destructive alert at the top with clear messaging
- **Option Cards**: Side-by-side cards showing different setup methods
- **Action Buttons**: Prominent buttons for quick fixes
- **Technical Details**: Collapsible section for advanced users

#### Example User Flow

**User visits `/work` without Linear configured:**

1. **Alert Banner Appears**
   ```
   ⚠️ Configuration Required
   Linear integration is not configured. Connect your Linear account 
   to view your work dashboard.
   ```

2. **Two Option Cards Displayed**

   **Card 1: Quick Setup with API Key**
   - Icon: 🔑 Key icon
   - Description: "Recommended for development and testing"
   - Steps listed with direct link to Linear settings
   - Code snippet showing exact `.env.local` entry needed
   - Button: "Get Linear API Key" → opens Linear settings in new tab

   **Card 2: OAuth Integration**
   - Description: "Recommended for production use"
   - Explanation of OAuth benefits
   - Prerequisites listed
   - Button: "Go to Integrations Settings" → links to `/settings/integrations`

3. **User Can Take Action**
   - Click button to get API key
   - Or navigate to integrations settings
   - Instructions are clear and actionable

## Actionable Elements

### Buttons and Links

#### "Get Linear API Key" Button
- Opens `https://linear.app/settings/api` in new tab
- User can copy API key directly
- Returns to add it to `.env.local`

#### "Go to Integrations Settings" Button
- Navigates to `/settings/integrations`
- User can connect Linear OAuth there
- Handles OAuth flow automatically

### Copy-Paste Ready Code

Environment variable snippets are formatted for easy copying:
```bash
LINEAR_API_KEY=your_api_key_here
```

Command snippets for database setup:
```bash
pnpm db:start
pnpm db:migrate
```

## Error Remediation Flows

### Flow 1: API Key Setup (Fastest)

1. User clicks "Get Linear API Key"
2. Linear settings page opens
3. User copies API key
4. User adds to `.env.local` file:
   ```bash
   echo "LINEAR_API_KEY=copied_key" >> .env.local
   ```
5. User restarts dev server (Ctrl+C, then `pnpm dev`)
6. Page refreshes → work dashboard loads! ✅

**Time to fix: ~2 minutes**

### Flow 2: OAuth Setup (Production)

1. User clicks "Go to Integrations Settings"
2. Integration settings page loads
3. User sees Linear integration card
4. User clicks "Connect Linear"
5. OAuth flow initiates
6. User authorizes in Linear
7. Redirects back → connected! ✅
8. Work page now loads automatically

**Time to fix: ~1 minute**

### Flow 3: Database Migration Required

If user chose OAuth but migrations aren't run:

1. Error shows "Database Setup Required" card
2. Commands listed with copy buttons:
   ```bash
   pnpm db:start
   pnpm db:migrate
   ```
3. User runs commands in terminal
4. Page refreshes → works! ✅

**Time to fix: ~30 seconds**

## Error Recovery

### Automatic Retry

- When user fixes configuration and refreshes page
- Data loads automatically
- No need to clear cache or do anything special

### Progressive Enhancement

- Page doesn't crash or show blank screen
- Error is contained and displayed nicely
- Other parts of the app continue working
- User can navigate away and come back

## UI Components Used

### shadcn Components

- **Alert**: For the warning banner
- **AlertTitle**: Error heading
- **AlertDescription**: User-friendly message
- **Card**: For option cards
- **CardHeader/CardTitle/CardDescription**: Card structure
- **Button**: Action buttons with variants
- **Icons**: lucide-react icons (AlertCircle, Key, ExternalLink)

### Layout

```tsx
<div className="flex-1 space-y-4 p-8 pt-6">
  <h1>Work</h1>
  
  <Alert variant="destructive">
    <AlertCircle />
    <AlertTitle>Configuration Required</AlertTitle>
    <AlertDescription>...</AlertDescription>
  </Alert>
  
  <div className="grid gap-4 md:grid-cols-2">
    <Card><!-- API Key Option --></Card>
    <Card><!-- OAuth Option --></Card>
  </div>
  
  <details><!-- Technical Details --></details>
</div>
```

## Accessibility

- **ARIA roles**: Alert has `role="alert"`
- **Semantic HTML**: Proper heading hierarchy
- **Keyboard navigation**: All buttons/links keyboard accessible
- **Screen readers**: Clear error messages read aloud
- **Color contrast**: Meets WCAG AA standards

## Mobile Responsiveness

- Cards stack vertically on mobile (`md:grid-cols-2`)
- Buttons are full-width on small screens
- Text is readable without zooming
- Touch targets are 44px minimum

## User Feedback

### What Users See vs Technical Details

**User-Friendly Message:**
> "Linear integration is not configured. Connect your Linear account to view your work dashboard."

**Technical Details (Collapsible):**
```
ConfigurationError: Linear is not configured.

You need to set up Linear authentication using ONE of these methods:

Option 1 - Linear API Key (Recommended for development):
  1. Get your API key from: https://linear.app/settings/api
  2. Add to .env.local: LINEAR_API_KEY=your_api_key_here
  3. Restart your dev server

Current environment:
  - LINEAR_API_KEY: ✗ Not set
  - SUPABASE_URL: http://localhost:54321
```

### Benefits

- **Non-technical users**: See friendly message and clear buttons
- **Developers**: Can expand technical details for debugging
- **Both**: Get actionable next steps

## Testing the Error Experience

### Manual Testing

1. **Remove Linear config**:
   ```bash
   # Comment out in .env.local
   # LINEAR_API_KEY=xxx
   ```

2. **Visit `/work`** - Should see nice error UI

3. **Test buttons**:
   - Click "Get Linear API Key" → Opens Linear
   - Click "Go to Integrations" → Navigates correctly

4. **Fix issue** and verify page loads

### E2E Testing

Error handling is tested in Playwright tests:
- Mock API returning configuration errors
- Verify error UI displays
- Check buttons/links are present
- Ensure no console errors

## Future Enhancements

- **Inline API key input**: Add key without editing `.env.local`
- **Test connection button**: Verify key works before saving
- **Status indicators**: Show which integrations are active
- **Guided setup wizard**: Step-by-step configuration flow
- **Toast notifications**: "Configuration saved!" feedback
- **Auto-retry**: Attempt to load data after configuration

## See Also

- [Error Handling Guide](./ERROR_HANDLING.md) - Technical error handling
- [Work Page Documentation](./WORK_PAGE.md) - Work dashboard features
- [Linear OAuth Implementation](./LINEAR_OAUTH_IMPLEMENTATION.md) - OAuth setup


# Organization Setup Guide

## Overview

This application uses **Clerk Organizations** for role-based access control. Administrative features like managing integrations require users to be **admins in an organization**.

## Why Organizations?

- ✅ **Native Clerk Feature**: Uses Clerk's built-in organization and role system
- ✅ **Team-Based**: Supports multiple users with different roles
- ✅ **Scalable**: Easy to add/remove members and manage permissions
- ✅ **Secure**: Proper separation of admin and member access

## Quick Start

### 🚀 Fastest: Create Organization via Clerk Dashboard (2 minutes)

1. **Go to** https://dashboard.clerk.com
2. **Navigate to** Organizations in the sidebar
3. **Click** "Create Organization"
4. **Fill in**:
   - Name: Your company/team name
   - Created by: Select your user
5. **Click** Create
6. **Sign out** and **sign back in** to your app
7. **Done!** Visit `/settings/integrations` ✅

### 💻 Alternative: Create Organization via CLI (30 seconds)

```bash
# Get your user ID from the integrations page error message
pnpm admin:create-org user_2abc123xyz "My Company"
```

Then sign out and back in.

## Setting Up Your First Admin

### Step 1: Check if You Have an Organization

Visit `/settings/integrations`. If you see "Admin access required", you need to create an organization.

### Step 2: Create Organization (Choose One Method)

#### Method A: Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Organizations → Create Organization
3. Add your user as creator (automatically becomes admin)

#### Method B: Command Line
```bash
pnpm admin:create-org <your-user-id> "Organization Name"
```

Your user ID is displayed on the integrations error page.

### Step 3: Sign Out & Back In

**Important**: Organization membership is cached in your session.
1. Sign out completely
2. Sign back in
3. Visit `/settings/integrations`
4. You should now have access! ✅

## Adding More Admins

### Via Clerk Dashboard

1. Go to Clerk Dashboard → Organizations
2. Select your organization
3. Go to Members tab
4. Click "Add Member"
5. Select user and set role to "Admin"

### Via Command Line

```bash
pnpm admin:add-member <org-id> <user-id> org:admin
```

Get the organization ID from Clerk Dashboard.

## Roles Explained

| Role | Access Level | Can Do |
|------|-------------|---------|
| `org:admin` | Full admin access | Manage integrations, add/remove members, configure settings |
| `org:member` | Standard access | Use the application, no admin features |

## How It Works

### Client-Side Check
```typescript
import { useOrganization } from "@clerk/nextjs";

const { membership } = useOrganization();
const isAdmin = membership?.role === "org:admin";
```

### Server-Side Check
```typescript
import { requireAdmin } from "@/lib/auth/api-keys";

// In your API route
const { userId } = await auth();
await requireAdmin(userId); // Throws error if not admin
```

The `requireAdmin` function:
1. Fetches user's organization memberships
2. Checks if any membership has `role === "org:admin"`
3. Throws `AuthorizationError` if not an admin

## Troubleshooting

### "Admin access required" Error

**Cause**: You're not an admin in any organization.

**Fix**:
1. Create an organization (see above)
2. Or ask an existing admin to add you
3. Sign out and back in
4. Check again

### Organization Exists But Still No Access

**Possible issues**:

1. **Not a member**: Ask an admin to add you
2. **Wrong role**: Must be `org:admin`, not `org:member`
3. **Session cache**: Sign out completely and back in
4. **Browser cache**: Clear cookies and try again

### Can't Find Your User ID

Your user ID is shown on the integrations error page. If you can't access that:

1. Go to Clerk Dashboard
2. Users → Find your user
3. Copy the User ID

Or add this temporarily to any page:
```tsx
import { useAuth } from "@clerk/nextjs";

export function UserIdDisplay() {
  const { userId } = useAuth();
  return <div>Your ID: {userId}</div>;
}
```

### Multiple Organizations

If you're a member of multiple organizations:
- You only need to be an admin in ONE organization
- The first admin membership grants access
- You can switch active organizations in your app

## CLI Commands Reference

### Create Organization
```bash
pnpm admin:create-org <user-id> <org-name>

# Example
pnpm admin:create-org user_2abc123xyz "Acme Corp"
```

### Add Member as Admin
```bash
pnpm admin:add-member <org-id> <user-id> org:admin

# Example
pnpm admin:add-member org_2xyz user_2abc org:admin
```

### Add Member (Standard)
```bash
pnpm admin:add-member <org-id> <user-id> org:member

# Example
pnpm admin:add-member org_2xyz user_2abc org:member
```

## Production Setup

### Initial Organization

For your first deployment:

1. Deploy your app
2. Create your user account
3. Use Clerk Dashboard to create organization with you as admin
4. Sign back in

### Team Onboarding

For new team members:

1. **New user signs up**
2. **Admin** adds them to organization via Dashboard or CLI
3. **New user** signs out and back in
4. **Access granted** based on their role

### Best Practices

- ✅ Create one organization per company/team
- ✅ Use `org:admin` sparingly (only for actual admins)
- ✅ Use `org:member` for standard users
- ✅ Review organization members regularly
- ✅ Remove inactive members

## Security

### Why This Is Secure

1. **Clerk-Managed**: Clerk handles all authentication and authorization
2. **Server-Side Checks**: Admin status verified on every API call
3. **Session-Based**: Can't be bypassed by manipulating client code
4. **Audit Trail**: Clerk logs all organization changes

### What Admins Can Do

Admins in your organization can:
- Manage Linear integration (connect/disconnect)
- Access sensitive integration settings
- View integration status
- Configure workspace-wide settings

### What Admins CANNOT Do

- Modify other users' personal data
- Access data outside the organization
- Change Clerk authentication settings
- Delete the organization without permission

## Migration from Public Metadata

If you previously used public metadata for roles:

1. **Identify users** with admin metadata
2. **Create organization** if you don't have one
3. **Add users** to organization with admin role
4. **Remove** old public metadata (optional)
5. **Users sign out and back in**

Old approach (deprecated):
```typescript
// ❌ Don't use
user.publicMetadata.role === "admin"
```

New approach (current):
```typescript
// ✅ Use this
membership.role === "org:admin"
```

## Common Patterns

### Protect a Page
```typescript
// app/admin/page.tsx
import { useOrganization } from "@clerk/nextjs";

export default function AdminPage() {
  const { membership } = useOrganization();
  
  if (membership?.role !== "org:admin") {
    return <div>Admin access required</div>;
  }
  
  return <div>Admin content</div>;
}
```

### Protect an API Route
```typescript
// app/api/admin/route.ts
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";

export async function POST(request: Request) {
  const { userId } = await auth();
  await requireAdmin(userId);
  
  // Admin-only logic here
}
```

### Check Role Conditionally
```typescript
import { useOrganization } from "@clerk/nextjs";

export function MyComponent() {
  const { membership } = useOrganization();
  const isAdmin = membership?.role === "org:admin";
  
  return (
    <div>
      {isAdmin ? <AdminPanel /> : <StandardView />}
    </div>
  );
}
```

## See Also

- [Work Page Documentation](./WORK_PAGE.md) - Linear dashboard features
- [Error Handling Guide](./ERROR_HANDLING.md) - Error messages and debugging
- [Clerk Organizations Docs](https://clerk.com/docs/organizations/overview) - Official Clerk documentation


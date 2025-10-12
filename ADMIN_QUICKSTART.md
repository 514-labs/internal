# Admin Access Quick Start

You're seeing "Admin access required" because you need to be an **admin in a Clerk organization**.

## ⚡ 2-Minute Setup

### Step 1: Create Organization

**Via Clerk Dashboard** (Easiest):
1. Go to https://dashboard.clerk.com
2. Click **Organizations** → **Create Organization**
3. Name: Your company name
4. Created by: Select your user (you)
5. Click **Create**

**Or via command line**:
```bash
# Your user ID is shown on the error page
pnpm admin:create-org <your-user-id> "My Company"
```

### Step 2: Sign Out & Back In

**Important!** You must sign out and back in for changes to take effect.

1. Sign out completely
2. Sign back in
3. Visit `/settings/integrations`
4. ✅ You should now have access!

## 🔍 Finding Your User ID

Your user ID is displayed on the integrations error page under "Or: Join your organization".

## 📚 Full Documentation

See `documentation/ORGANIZATION_SETUP.md` for:
- Adding more admins
- Managing team members
- Troubleshooting
- CLI commands
- Security details

## 🆘 Still Having Issues?

1. **Clear browser cache and cookies**
2. **Make sure you signed out completely** (not just closed tab)
3. **Check Clerk Dashboard** - verify organization was created
4. **Check your role** - must be "Admin", not "Member"
5. **Try a different browser** - test if it's a caching issue

## 💡 Key Points

- ✅ Uses Clerk's built-in organization system (not public metadata)
- ✅ You only need to be admin in ONE organization
- ✅ Creating an organization makes you the admin automatically
- ✅ Must sign out and back in for changes to apply
- ✅ Team members can be added later from Clerk Dashboard

Need help? Check the full documentation or your Clerk Dashboard.


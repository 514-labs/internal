#!/usr/bin/env tsx
/**
 * Create an organization and add a user as admin
 * Usage: tsx scripts/admin/create-org.ts <user-id> <org-name>
 * Or: pnpm admin:create-org <user-id> <org-name>
 */

import { clerkClient } from "@clerk/nextjs/server";

async function createOrganization(userId: string, orgName: string) {
  try {
    console.log(
      `Creating organization "${orgName}" with user ${userId} as admin...`
    );

    const client = await clerkClient();

    // Check if user exists
    const user = await client.users.getUser(userId);
    console.log(
      `\n✓ Found user: ${user.emailAddresses[0]?.emailAddress || userId}`
    );

    // Create organization
    const org = await client.organizations.createOrganization({
      name: orgName,
      createdBy: userId,
    });

    console.log(`\n✅ Organization created successfully!`);
    console.log(`Organization ID: ${org.id}`);
    console.log(`Organization Name: ${org.name}`);

    // The creating user is automatically added as admin
    console.log(`\n✓ User added as organization admin`);

    console.log("\n📝 Next steps:");
    console.log("  1. Sign out of your application");
    console.log("  2. Sign back in");
    console.log("  3. Visit /settings/integrations");
    console.log("  4. You should now have admin access!");

    console.log("\n💡 To add more admins:");
    console.log(`  pnpm admin:add-member ${org.id} <user-id> org:admin`);
  } catch (error) {
    console.error("\n❌ Error creating organization:");
    console.error((error as Error).message);

    if ((error as any).status === 404) {
      console.error("\nUser not found. Please check the user ID.");
      console.error("Get your user ID from:");
      console.error("  - Clerk Dashboard → Users → Click user → Copy ID");
    }

    if ((error as any).status === 422) {
      console.error("\nOrganization with this name might already exist.");
      console.error("Try a different name or check existing organizations.");
    }

    process.exit(1);
  }
}

// Parse command line arguments
const userId = process.argv[2];
const orgName = process.argv[3];

if (!userId || !orgName) {
  console.error("❌ Error: User ID and organization name are required\n");
  console.error("Usage:");
  console.error("  tsx scripts/admin/create-org.ts <user-id> <org-name>");
  console.error("  pnpm admin:create-org <user-id> <org-name>\n");
  console.error("Example:");
  console.error(
    '  tsx scripts/admin/create-org.ts user_2abc123xyz "My Company"\n'
  );
  console.error("Get your user ID from:");
  console.error("  - Clerk Dashboard → Users → Click user → Copy ID");
  console.error("  - Or visit your app and check the integrations page");
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ Error: CLERK_SECRET_KEY environment variable not set");
  console.error("\nMake sure your .env.local has:");
  console.error("  CLERK_SECRET_KEY=sk_test_...");
  process.exit(1);
}

createOrganization(userId, orgName);

#!/usr/bin/env tsx
/**
 * Add a user to an organization with a specific role
 * Usage: tsx scripts/admin/add-member.ts <org-id> <user-id> <role>
 * Or: pnpm admin:add-member <org-id> <user-id> <role>
 *
 * Roles: org:admin, org:member
 */

import { clerkClient } from "@clerk/nextjs/server";

async function addMember(orgId: string, userId: string, role: string) {
  try {
    console.log(
      `Adding user ${userId} to organization ${orgId} with role ${role}...`
    );

    const client = await clerkClient();

    // Verify organization exists
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    console.log(`\n✓ Found organization: ${org.name}`);

    // Verify user exists
    const user = await client.users.getUser(userId);
    console.log(
      `✓ Found user: ${user.emailAddresses[0]?.emailAddress || userId}`
    );

    // Add user to organization
    const membership = await client.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId: userId,
      role: role as "org:admin" | "org:member",
    });

    console.log(`\n✅ User added successfully!`);
    console.log(`Membership ID: ${membership.id}`);
    console.log(`Role: ${membership.role}`);

    console.log("\n📝 Next steps:");
    console.log("  1. The user should sign out");
    console.log("  2. Sign back in");
    console.log("  3. Visit /settings/integrations");
    console.log(
      `  4. ${
        role === "org:admin"
          ? "They will have admin access"
          : "They will have member access"
      }`
    );
  } catch (error) {
    console.error("\n❌ Error adding member:");
    console.error((error as Error).message);

    if ((error as any).status === 404) {
      console.error("\nOrganization or user not found.");
      console.error("Please check the IDs.");
    }

    if ((error as any).status === 422) {
      console.error("\nUser might already be a member of this organization.");
      console.error("Use Clerk Dashboard to update their role instead.");
    }

    process.exit(1);
  }
}

// Parse command line arguments
const orgId = process.argv[2];
const userId = process.argv[3];
const role = process.argv[4] || "org:member";

if (!orgId || !userId) {
  console.error("❌ Error: Organization ID and User ID are required\n");
  console.error("Usage:");
  console.error("  tsx scripts/admin/add-member.ts <org-id> <user-id> [role]");
  console.error("  pnpm admin:add-member <org-id> <user-id> [role]\n");
  console.error("Example:");
  console.error(
    "  tsx scripts/admin/add-member.ts org_2abc user_2xyz org:admin\n"
  );
  console.error("Roles:");
  console.error("  org:admin  - Full admin access");
  console.error("  org:member - Standard member (default)\n");
  console.error("Get IDs from Clerk Dashboard");
  process.exit(1);
}

if (role !== "org:admin" && role !== "org:member") {
  console.error(`❌ Error: Invalid role "${role}"`);
  console.error("Valid roles: org:admin, org:member");
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ Error: CLERK_SECRET_KEY environment variable not set");
  console.error("\nMake sure your .env.local has:");
  console.error("  CLERK_SECRET_KEY=sk_test_...");
  process.exit(1);
}

addMember(orgId, userId, role);

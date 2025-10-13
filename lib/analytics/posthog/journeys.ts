/**
 * Codified user journeys for Boreal and Moosestack products
 */

import type { JourneyDefinition } from "./schemas";

/**
 * Boreal (Hosting Service) Journeys
 */
export const borealJourneys: Record<string, JourneyDefinition> = {
  "boreal-onboarding": {
    id: "boreal-onboarding",
    name: "Boreal Onboarding",
    description:
      "User journey from signup to first deployment and domain configuration",
    product: "boreal",
    events: [
      "boreal_signup",
      "boreal_project_created",
      "boreal_first_deployment",
      "boreal_domain_configured",
    ],
    expectedDuration: "2 hours",
    successCriteria:
      "User completes domain configuration within 24 hours of signup",
  },
  "boreal-activation": {
    id: "boreal-activation",
    name: "Boreal Activation",
    description: "User journey from account creation to production traffic",
    product: "boreal",
    events: [
      "boreal_account_created",
      "boreal_environment_setup",
      "boreal_app_deployed",
      "boreal_production_traffic",
    ],
    expectedDuration: "1 day",
    successCriteria: "User receives production traffic within 3 days",
  },
  "boreal-retention": {
    id: "boreal-retention",
    name: "Boreal Retention",
    description: "User retention journey tracking activity over 3 months",
    product: "boreal",
    events: [
      "boreal_first_deploy",
      "boreal_week_1_activity",
      "boreal_week_4_activity",
      "boreal_month_3_active",
    ],
    expectedDuration: "3 months",
    successCriteria: "User remains active after 3 months",
  },
};

/**
 * Moosestack (Framework) Journeys
 */
export const moosestackJourneys: Record<string, JourneyDefinition> = {
  "moosestack-discovery": {
    id: "moosestack-discovery",
    name: "Moosestack Discovery",
    description: "User journey from documentation to installation",
    product: "moosestack",
    events: [
      "moosestack_docs_landing",
      "moosestack_docs_read",
      "moosestack_install_viewed",
      "moosestack_installed",
    ],
    expectedDuration: "1 hour",
    successCriteria: "User installs Moosestack after viewing documentation",
  },
  "moosestack-first-value": {
    id: "moosestack-first-value",
    name: "Moosestack First Value",
    description: "User journey from installation to running dev server",
    product: "moosestack",
    events: [
      "moosestack_installed",
      "moosestack_init_project",
      "moosestack_first_build",
      "moosestack_dev_server",
    ],
    expectedDuration: "30 minutes",
    successCriteria: "User starts dev server within 1 hour of installation",
  },
  "moosestack-adoption": {
    id: "moosestack-adoption",
    name: "Moosestack Adoption",
    description:
      "User journey from first project to production and repeat usage",
    product: "moosestack",
    events: [
      "moosestack_first_project",
      "moosestack_feature_used",
      "moosestack_production_build",
      "moosestack_repeat_usage",
    ],
    expectedDuration: "1 week",
    successCriteria:
      "User builds for production and continues using Moosestack",
  },
};

/**
 * All journeys combined
 */
export const allJourneys: Record<string, JourneyDefinition> = {
  ...borealJourneys,
  ...moosestackJourneys,
};

/**
 * Get journey by ID
 */
export function getJourneyById(
  journeyId: string
): JourneyDefinition | undefined {
  return allJourneys[journeyId];
}

/**
 * Get all journeys for a specific product
 */
export function getJourneysByProduct(
  product: "boreal" | "moosestack"
): JourneyDefinition[] {
  return Object.values(allJourneys).filter(
    (journey) => journey.product === product
  );
}

/**
 * Get all journey IDs
 */
export function getAllJourneyIds(): string[] {
  return Object.keys(allJourneys);
}

/**
 * Helper to get human-readable event labels
 */
export function getEventLabel(eventName: string): string {
  const labels: Record<string, string> = {
    // Boreal events
    boreal_signup: "Sign Up",
    boreal_project_created: "Project Created",
    boreal_first_deployment: "First Deployment",
    boreal_domain_configured: "Domain Configured",
    boreal_account_created: "Account Created",
    boreal_environment_setup: "Environment Setup",
    boreal_app_deployed: "App Deployed",
    boreal_production_traffic: "Production Traffic",
    boreal_first_deploy: "First Deploy",
    boreal_week_1_activity: "Week 1 Activity",
    boreal_week_4_activity: "Week 4 Activity",
    boreal_month_3_active: "Month 3 Active",

    // Moosestack events
    moosestack_docs_landing: "Docs Landing",
    moosestack_docs_read: "Docs Read",
    moosestack_install_viewed: "Install Viewed",
    moosestack_installed: "Installed",
    moosestack_init_project: "Init Project",
    moosestack_first_build: "First Build",
    moosestack_dev_server: "Dev Server Started",
    moosestack_first_project: "First Project",
    moosestack_feature_used: "Feature Used",
    moosestack_production_build: "Production Build",
    moosestack_repeat_usage: "Repeat Usage",
  };

  return labels[eventName] || eventName;
}

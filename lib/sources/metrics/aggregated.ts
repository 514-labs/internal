/**
 * Aggregated metrics derived from entities
 *
 * These metrics are computed by aggregating entity data from
 * Linear and HubSpot (and potentially other sources).
 */

import { fetchLinearIssues, fetchLinearProjects, fetchLinearInitiatives } from "../entities/linear";
import { fetchHubSpotDeals } from "../entities/hubspot";

/**
 * Linear aggregated metric configuration
 */
interface LinearMetricConfig {
  projectId?: string;
  initiativeId?: string;
  teamId?: string;
}

/**
 * HubSpot aggregated metric configuration
 */
interface HubSpotMetricConfig {
  stage?: string;
}

/**
 * Fetch Linear issues completed count
 */
async function fetchIssuesCompleted(config?: LinearMetricConfig): Promise<number> {
  const issues = await fetchLinearIssues({
    projectId: config?.projectId,
    teamId: config?.teamId,
    state: "completed",
  });

  return issues.length;
}

/**
 * Fetch Linear project progress (percentage)
 */
async function fetchProjectProgress(config?: LinearMetricConfig): Promise<number> {
  if (!config?.projectId) {
    // Return average progress across all projects
    const projects = await fetchLinearProjects({ teamId: config?.teamId });
    if (projects.length === 0) return 0;

    const totalProgress = projects.reduce((sum, p) => sum + p.progress, 0);
    return Math.round((totalProgress / projects.length) * 100);
  }

  const projects = await fetchLinearProjects({ teamId: config?.teamId });
  const project = projects.find((p) => p.id === config.projectId);

  return project ? Math.round(project.progress * 100) : 0;
}

/**
 * Fetch Linear initiative progress (average of project progress)
 */
async function fetchInitiativeProgress(config?: LinearMetricConfig): Promise<number> {
  if (!config?.initiativeId) {
    return 0;
  }

  const initiatives = await fetchLinearInitiatives({ ids: [config.initiativeId] });
  const initiative = initiatives[0];

  if (!initiative || initiative.projects.length === 0) {
    return 0;
  }

  // Fetch all projects in the initiative and average their progress
  const projects = await fetchLinearProjects();
  const initiativeProjects = projects.filter((p) =>
    initiative.projects.some((ip) => ip.id === p.id)
  );

  if (initiativeProjects.length === 0) return 0;

  const totalProgress = initiativeProjects.reduce((sum, p) => sum + p.progress, 0);
  return Math.round((totalProgress / initiativeProjects.length) * 100);
}

/**
 * Fetch HubSpot deals count
 */
async function fetchDealsCount(config?: HubSpotMetricConfig): Promise<number> {
  const deals = await fetchHubSpotDeals({ stage: config?.stage });
  return deals.length;
}

/**
 * Fetch HubSpot pipeline value (sum of deal amounts)
 */
async function fetchPipelineValue(config?: HubSpotMetricConfig): Promise<number> {
  const deals = await fetchHubSpotDeals({ stage: config?.stage });
  return deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
}

/**
 * Fetch aggregated metric from Linear
 */
export async function fetchLinearAggregatedMetric(
  type: string,
  config?: LinearMetricConfig
): Promise<number> {
  switch (type) {
    case "issuesCompleted":
      return fetchIssuesCompleted(config);
    case "projectProgress":
      return fetchProjectProgress(config);
    case "initiativeProgress":
      return fetchInitiativeProgress(config);
    default:
      throw new Error(`Unknown Linear metric type: ${type}`);
  }
}

/**
 * Fetch aggregated metric from HubSpot
 */
export async function fetchHubSpotAggregatedMetric(
  type: string,
  config?: HubSpotMetricConfig
): Promise<number> {
  switch (type) {
    case "deals":
      return fetchDealsCount(config);
    case "pipelineValue":
      return fetchPipelineValue(config);
    case "contacts":
      // Would count contacts
      return 0;
    default:
      throw new Error(`Unknown HubSpot metric type: ${type}`);
  }
}

/**
 * Generic aggregated metric fetcher
 */
export async function fetchAggregatedMetric(
  source: "linear" | "hubspot",
  type: string,
  config?: Record<string, unknown>
): Promise<number> {
  if (source === "linear") {
    return fetchLinearAggregatedMetric(type, config as LinearMetricConfig);
  }

  if (source === "hubspot") {
    return fetchHubSpotAggregatedMetric(type, config as HubSpotMetricConfig);
  }

  throw new Error(`Unknown aggregated metric source: ${source}`);
}


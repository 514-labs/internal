/**
 * Linear entity fetching
 */

import { getLinearClient } from "../connectors/linear/client";
import type { LinearIssue, LinearProject, LinearInitiative, LinearTeam, Entity } from "./types";

/**
 * Fetch Linear issues
 */
export async function fetchLinearIssues(filters?: {
  projectId?: string;
  teamId?: string;
  state?: string;
}): Promise<LinearIssue[]> {
  const client = await getLinearClient();

  const issuesConnection = await client.issues({
    filter: {
      ...(filters?.projectId && { project: { id: { eq: filters.projectId } } }),
      ...(filters?.teamId && { team: { id: { eq: filters.teamId } } }),
      ...(filters?.state && { state: { type: { eq: filters.state } } }),
    },
    first: 100,
  });

  const issues = await issuesConnection.nodes;

  return Promise.all(
    issues.map(async (issue) => {
      const state = await issue.state;
      const project = await issue.project;
      const team = await issue.team;

      return {
        id: issue.id,
        title: issue.title,
        state: {
          name: state?.name || "Unknown",
          type: state?.type || "unknown",
        },
        priority: issue.priority,
        project: project ? { id: project.id, name: project.name } : undefined,
        team: team ? { id: team.id, name: team.name } : undefined,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
      };
    })
  );
}

/**
 * Fetch Linear projects
 */
export async function fetchLinearProjects(filters?: {
  teamId?: string;
}): Promise<LinearProject[]> {
  const client = await getLinearClient();

  const projectsConnection = await client.projects({
    filter: {
      ...(filters?.teamId && {
        accessibleTeams: { some: { id: { eq: filters.teamId } } },
      }),
    },
    first: 100,
  });

  const projects = await projectsConnection.nodes;

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    progress: project.progress,
    state: project.state,
    startDate: project.startDate || undefined,
    targetDate: project.targetDate || undefined,
  }));
}

/**
 * Fetch Linear initiatives
 */
export async function fetchLinearInitiatives(filters?: {
  ids?: string[];
}): Promise<LinearInitiative[]> {
  const client = await getLinearClient();

  const initiativesConnection = await client.initiatives({
    filter: filters?.ids ? { id: { in: filters.ids } } : undefined,
    first: 100,
  });

  const initiatives = await initiativesConnection.nodes;

  return Promise.all(
    initiatives.map(async (initiative) => {
      const projectsConnection = await initiative.projects({ first: 50 });
      const projects = await projectsConnection.nodes;

      return {
        id: initiative.id,
        name: initiative.name,
        description: initiative.description || undefined,
        status: initiative.status,
        projects: projects.map((p) => ({ id: p.id, name: p.name })),
      };
    })
  );
}

/**
 * Fetch Linear teams
 */
export async function fetchLinearTeams(): Promise<LinearTeam[]> {
  const client = await getLinearClient();

  const teamsConnection = await client.teams({ first: 100 });
  const teams = await teamsConnection.nodes;

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    key: team.key,
    description: team.description || undefined,
  }));
}

/**
 * Generic Linear entity fetcher
 */
export async function fetchLinearEntity(
  type: string,
  filters?: Record<string, unknown>
): Promise<Entity[]> {
  switch (type) {
    case "issue":
      return fetchLinearIssues(filters as { projectId?: string; teamId?: string; state?: string });
    case "project":
      return fetchLinearProjects(filters as { teamId?: string });
    case "initiative":
      return fetchLinearInitiatives(filters as { ids?: string[] });
    case "team":
      return fetchLinearTeams();
    default:
      throw new Error(`Unknown Linear entity type: ${type}`);
  }
}


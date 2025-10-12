/**
 * Linear query functions
 */

import { linearAnalyticsClient } from "./client";
import type {
  LinearQueryOptions,
  Issue,
  Project,
  Initiative,
  User,
} from "./schemas";
import { ExternalAPIError } from "../shared/errors";

/**
 * Get issues from Linear
 */
export async function getIssues(
  options: Partial<LinearQueryOptions> = {}
): Promise<Issue[]> {
  try {
    const client = await linearAnalyticsClient.getClient();

    // Build filter
    const filter: Record<string, unknown> = {};

    if (options.teamId) filter.team = { id: { eq: options.teamId } };
    if (options.projectId) filter.project = { id: { eq: options.projectId } };
    if (options.assigneeId)
      filter.assignee = { id: { eq: options.assigneeId } };
    if (options.stateId) filter.state = { id: { eq: options.stateId } };
    if (options.labelId)
      filter.labels = { some: { id: { eq: options.labelId } } };
    if (options.search)
      filter.searchableContent = { containsIgnoreCase: options.search };

    const issuesConnection = await client.issues({
      first: options.limit || 50,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      includeArchived: options.includeArchived,
    });

    const issues = await Promise.all(
      issuesConnection.nodes.map(async (issue) => {
        const [state, assignee, creator, labels, project, team] =
          await Promise.all([
            issue.state,
            issue.assignee,
            issue.creator,
            issue.labels(),
            issue.project,
            issue.team,
          ]);

        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description || undefined,
          priority: issue.priority,
          estimate: issue.estimate || undefined,
          state: state
            ? {
                id: state.id,
                name: state.name,
                color: state.color,
                type: state.type,
                position: state.position,
              }
            : undefined,
          assignee: assignee
            ? {
                id: assignee.id,
                name: assignee.name,
                displayName: assignee.displayName,
                email: assignee.email,
                avatarUrl: assignee.avatarUrl || undefined,
                active: assignee.active,
                admin: assignee.admin,
                createdAt: assignee.createdAt.toISOString(),
                updatedAt: assignee.updatedAt.toISOString(),
              }
            : undefined,
          creator: creator
            ? {
                id: creator.id,
                name: creator.name,
                displayName: creator.displayName,
                email: creator.email,
                avatarUrl: creator.avatarUrl || undefined,
                active: creator.active,
                admin: creator.admin,
                createdAt: creator.createdAt.toISOString(),
                updatedAt: creator.updatedAt.toISOString(),
              }
            : undefined,
          labels: labels.nodes.map((label) => ({
            id: label.id,
            name: label.name,
            color: label.color,
            description: label.description || undefined,
          })),
          createdAt: issue.createdAt.toISOString(),
          updatedAt: issue.updatedAt.toISOString(),
          completedAt: issue.completedAt?.toISOString(),
          canceledAt: issue.canceledAt?.toISOString(),
          dueDate: issue.dueDate?.toISOString(),
          url: issue.url,
          project: project
            ? {
                id: project.id,
                name: project.name,
              }
            : undefined,
          team: team
            ? {
                id: team.id,
                name: team.name,
                key: team.key,
              }
            : { id: "", name: "", key: "" },
        };
      })
    );

    return issues;
  } catch (error) {
    throw new ExternalAPIError(
      "Linear",
      `Error fetching issues: ${(error as Error).message}`
    );
  }
}

/**
 * Get projects from Linear
 */
export async function getProjects(
  options: Partial<LinearQueryOptions> = {}
): Promise<Project[]> {
  try {
    const client = await linearAnalyticsClient.getClient();

    const filter: Record<string, unknown> = {};
    if (options.search)
      filter.searchableContent = { containsIgnoreCase: options.search };

    const projectsConnection = await client.projects({
      first: options.limit || 50,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      includeArchived: options.includeArchived,
    });

    const projects = await Promise.all(
      projectsConnection.nodes.map(async (project) => {
        const lead = await project.lead;

        return {
          id: project.id,
          name: project.name,
          description: project.description || undefined,
          icon: project.icon || undefined,
          color: project.color,
          state: project.state,
          status: undefined,
          lead: lead
            ? {
                id: lead.id,
                name: lead.name,
                displayName: lead.displayName,
                email: lead.email,
                avatarUrl: lead.avatarUrl || undefined,
                active: lead.active,
                admin: lead.admin,
                createdAt: lead.createdAt.toISOString(),
                updatedAt: lead.updatedAt.toISOString(),
              }
            : undefined,
          startDate: project.startDate?.toISOString(),
          targetDate: project.targetDate?.toISOString(),
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          completedAt: project.completedAt?.toISOString(),
          canceledAt: project.canceledAt?.toISOString(),
          url: project.url,
          progress: project.progress,
        };
      })
    );

    return projects;
  } catch (error) {
    throw new ExternalAPIError(
      "Linear",
      `Error fetching projects: ${(error as Error).message}`
    );
  }
}

/**
 * Get initiatives (roadmaps) from Linear
 */
export async function getInitiatives(
  options: Partial<LinearQueryOptions> = {}
): Promise<Initiative[]> {
  try {
    const client = await linearAnalyticsClient.getClient();

    const initiativesConnection = await client.initiatives({
      first: options.limit || 50,
    });

    const initiatives = await Promise.all(
      initiativesConnection.nodes.map(async (initiative) => {
        const projects = await initiative.projects();

        return {
          id: initiative.id,
          name: initiative.name,
          description: initiative.description || undefined,
          icon: initiative.icon || undefined,
          color: initiative.color || undefined,
          sortOrder: initiative.sortOrder,
          createdAt: initiative.createdAt.toISOString(),
          updatedAt: initiative.updatedAt.toISOString(),
          targetDate: initiative.targetDate?.toISOString(),
          projects: await Promise.all(
            projects.nodes.map(async (project) => ({
              id: project.id,
              name: project.name,
              description: project.description || undefined,
              icon: project.icon || undefined,
              color: project.color,
              state: project.state,
              status: undefined,
              lead: undefined,
              startDate: project.startDate?.toISOString(),
              targetDate: project.targetDate?.toISOString(),
              createdAt: project.createdAt.toISOString(),
              updatedAt: project.updatedAt.toISOString(),
              completedAt: project.completedAt?.toISOString(),
              canceledAt: project.canceledAt?.toISOString(),
              url: project.url,
              progress: project.progress,
            }))
          ),
        };
      })
    );

    return initiatives;
  } catch (error) {
    throw new ExternalAPIError(
      "Linear",
      `Error fetching initiatives: ${(error as Error).message}`
    );
  }
}

/**
 * Get users from Linear
 */
export async function getUsers(
  options: Partial<LinearQueryOptions> = {}
): Promise<User[]> {
  try {
    const client = await linearAnalyticsClient.getClient();

    const filter: Record<string, unknown> = {};
    if (!options.includeArchived) {
      filter.active = { eq: true };
    }

    const usersConnection = await client.users({
      first: options.limit || 50,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    const users = usersConnection.nodes.map((user) => ({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl || undefined,
      active: user.active,
      admin: user.admin,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return users;
  } catch (error) {
    throw new ExternalAPIError(
      "Linear",
      `Error fetching users: ${(error as Error).message}`
    );
  }
}

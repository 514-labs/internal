/**
 * Rippling entity fetching
 */

import { createRipplingClient } from "../connectors/rippling/client";
import type { RipplingWorker, RipplingTeam, RipplingDepartment, Entity } from "./types";

/**
 * Fetch Rippling workers
 */
export async function fetchRipplingWorkers(
  userId: string,
  filters?: { teamId?: string; departmentId?: string }
): Promise<RipplingWorker[]> {
  const client = await createRipplingClient(userId);
  const response = (await client.getWorkers()) as { data?: unknown[] };

  if (!response?.data || !Array.isArray(response.data)) {
    return [];
  }

  const workers = response.data as Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    department?: { id: string; name: string };
    team?: { id: string; name: string };
    startDate?: string;
    employmentType?: string;
  }>;

  let filtered = workers;

  if (filters?.teamId) {
    filtered = filtered.filter((w) => w.team?.id === filters.teamId);
  }

  if (filters?.departmentId) {
    filtered = filtered.filter((w) => w.department?.id === filters.departmentId);
  }

  return filtered.map((worker) => ({
    id: worker.id,
    firstName: worker.firstName || "",
    lastName: worker.lastName || "",
    email: worker.email || "",
    department: worker.department,
    team: worker.team,
    startDate: worker.startDate,
    employmentType: worker.employmentType,
  }));
}

/**
 * Fetch Rippling teams
 */
export async function fetchRipplingTeams(userId: string): Promise<RipplingTeam[]> {
  const client = await createRipplingClient(userId);
  const response = (await client.getTeams()) as { data?: unknown[] };

  if (!response?.data || !Array.isArray(response.data)) {
    return [];
  }

  const teams = response.data as Array<{
    id: string;
    name?: string;
    description?: string;
    manager?: { id: string; name: string };
  }>;

  return teams.map((team) => ({
    id: team.id,
    name: team.name || "",
    description: team.description,
    manager: team.manager,
  }));
}

/**
 * Fetch Rippling departments
 */
export async function fetchRipplingDepartments(userId: string): Promise<RipplingDepartment[]> {
  const client = await createRipplingClient(userId);
  const response = (await client.getDepartments()) as { data?: unknown[] };

  if (!response?.data || !Array.isArray(response.data)) {
    return [];
  }

  const departments = response.data as Array<{
    id: string;
    name?: string;
    parentDepartment?: { id: string; name: string };
  }>;

  return departments.map((dept) => ({
    id: dept.id,
    name: dept.name || "",
    parentDepartment: dept.parentDepartment,
  }));
}

/**
 * Generic Rippling entity fetcher
 */
export async function fetchRipplingEntity(
  userId: string,
  type: string,
  filters?: Record<string, unknown>
): Promise<Entity[]> {
  switch (type) {
    case "worker":
      return fetchRipplingWorkers(
        userId,
        filters as { teamId?: string; departmentId?: string }
      );
    case "team":
      return fetchRipplingTeams(userId);
    case "department":
      return fetchRipplingDepartments(userId);
    default:
      throw new Error(`Unknown Rippling entity type: ${type}`);
  }
}


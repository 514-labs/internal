/**
 * Rippling query functions
 */

import { ripplingAnalyticsClient } from "./client";
import type {
  Company,
  Employee,
  Department,
  RipplingQueryOptions,
} from "./schemas";
import { ExternalAPIError } from "../shared/errors";

/**
 * Get company details from Rippling
 */
export async function getCompany(): Promise<Company> {
  try {
    const response = await ripplingAnalyticsClient.get<{ data: Company }>(
      "/company"
    );

    return response.data;
  } catch (error) {
    throw new ExternalAPIError(
      "Rippling",
      `Error fetching company: ${(error as Error).message}`
    );
  }
}

/**
 * Get employees from Rippling
 */
export async function getEmployees(
  options: Partial<RipplingQueryOptions> = {}
): Promise<Employee[]> {
  try {
    const params = new URLSearchParams({
      limit: String(options.limit || 100),
      offset: String(options.offset || 0),
    });

    if (options.status) {
      params.append("status", options.status);
    }
    if (options.departmentId) {
      params.append("department_id", options.departmentId);
    }
    if (options.managerId) {
      params.append("manager_id", options.managerId);
    }
    if (options.search) {
      params.append("search", options.search);
    }

    const response = await ripplingAnalyticsClient.get<{ data: Employee[] }>(
      `/employees?${params}`
    );

    return response.data;
  } catch (error) {
    throw new ExternalAPIError(
      "Rippling",
      `Error fetching employees: ${(error as Error).message}`
    );
  }
}

/**
 * Get single employee by ID from Rippling
 */
export async function getEmployee(id: string): Promise<Employee> {
  try {
    const response = await ripplingAnalyticsClient.get<{ data: Employee }>(
      `/employees/${id}`
    );

    return response.data;
  } catch (error) {
    throw new ExternalAPIError(
      "Rippling",
      `Error fetching employee: ${(error as Error).message}`
    );
  }
}

/**
 * Get departments from Rippling
 */
export async function getDepartments(): Promise<Department[]> {
  try {
    const response = await ripplingAnalyticsClient.get<{ data: Department[] }>(
      "/departments"
    );

    return response.data;
  } catch (error) {
    throw new ExternalAPIError(
      "Rippling",
      `Error fetching departments: ${(error as Error).message}`
    );
  }
}

/**
 * Get employees by department
 */
export async function getEmployeesByDepartment(
  departmentId: string,
  options: Partial<RipplingQueryOptions> = {}
): Promise<Employee[]> {
  return getEmployees({
    ...options,
    departmentId,
  });
}

/**
 * Get direct reports for a manager
 */
export async function getDirectReports(
  managerId: string,
  options: Partial<RipplingQueryOptions> = {}
): Promise<Employee[]> {
  return getEmployees({
    ...options,
    managerId,
  });
}

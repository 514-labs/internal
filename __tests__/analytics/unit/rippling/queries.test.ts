/**
 * Unit tests for Rippling query functions
 */

import {
  getCompany,
  getEmployees,
  getEmployee,
  getDepartments,
} from "@/lib/analytics/rippling/queries";
import { ExternalAPIError } from "@/lib/analytics/shared/errors";

describe("Rippling Queries", () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getCompany", () => {
    it("should fetch company details", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            id: "company_123",
            name: "Test Corp",
            legalName: "Test Corporation Inc",
          },
        }),
      });

      const company = await getCompany();

      expect(company).toBeDefined();
      expect(company.id).toBe("company_123");
    });

    it("should handle API errors", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      await expect(getCompany()).rejects.toThrow(ExternalAPIError);
    });
  });

  describe("getEmployees", () => {
    it("should fetch employees list", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "emp_1",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              status: "ACTIVE",
            },
          ],
        }),
      });

      const employees = await getEmployees({ limit: 10 });

      expect(employees).toBeDefined();
      expect(Array.isArray(employees)).toBe(true);
    });

    it("should include query parameters", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      global.fetch = mockFetch;

      await getEmployees({
        limit: 50,
        status: "ACTIVE",
        departmentId: "dept_123",
      });

      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("limit=50");
      expect(callUrl).toContain("status=ACTIVE");
      expect(callUrl).toContain("department_id=dept_123");
    });
  });

  describe("getEmployee", () => {
    it("should fetch single employee", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            id: "emp_123",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            status: "ACTIVE",
          },
        }),
      });

      const employee = await getEmployee("emp_123");

      expect(employee).toBeDefined();
      expect(employee.id).toBe("emp_123");
    });
  });

  describe("getDepartments", () => {
    it("should fetch departments", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "dept_1",
              name: "Engineering",
              description: "Engineering team",
            },
          ],
        }),
      });

      const departments = await getDepartments();

      expect(departments).toBeDefined();
      expect(Array.isArray(departments)).toBe(true);
    });
  });
});

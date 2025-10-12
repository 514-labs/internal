/**
 * Unit tests for Rippling schemas
 */

import {
  CompanySchema,
  EmployeeSchema,
  DepartmentSchema,
  EmploymentStatusSchema,
  RipplingQueryOptionsSchema,
} from "@/lib/analytics/rippling/schemas";

describe("Rippling Schemas", () => {
  describe("CompanySchema", () => {
    it("should validate company data", () => {
      const company = {
        id: "company_123",
        name: "Test Corp",
        legalName: "Test Corporation Inc",
        website: "https://testcorp.com",
      };

      const result = CompanySchema.safeParse(company);
      expect(result.success).toBe(true);
    });
  });

  describe("EmployeeSchema", () => {
    it("should validate employee data", () => {
      const employee = {
        id: "emp_123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "ACTIVE",
        title: "Software Engineer",
      };

      const result = EmployeeSchema.safeParse(employee);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const employee = {
        id: "emp_123",
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        status: "ACTIVE",
      };

      const result = EmployeeSchema.safeParse(employee);
      expect(result.success).toBe(false);
    });

    it("should validate with nested department", () => {
      const employee = {
        id: "emp_123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        status: "ACTIVE",
        department: {
          id: "dept_1",
          name: "Engineering",
        },
      };

      const result = EmployeeSchema.safeParse(employee);
      expect(result.success).toBe(true);
    });
  });

  describe("EmploymentStatusSchema", () => {
    it("should validate ACTIVE status", () => {
      const result = EmploymentStatusSchema.safeParse("ACTIVE");
      expect(result.success).toBe(true);
    });

    it("should validate all valid statuses", () => {
      const statuses = [
        "ACTIVE",
        "INACTIVE",
        "TERMINATED",
        "ON_LEAVE",
        "PENDING",
      ];

      statuses.forEach((status) => {
        const result = EmploymentStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status", () => {
      const result = EmploymentStatusSchema.safeParse("INVALID_STATUS");
      expect(result.success).toBe(false);
    });
  });

  describe("DepartmentSchema", () => {
    it("should validate department", () => {
      const department = {
        id: "dept_123",
        name: "Engineering",
        description: "Engineering team",
      };

      const result = DepartmentSchema.safeParse(department);
      expect(result.success).toBe(true);
    });
  });

  describe("RipplingQueryOptionsSchema", () => {
    it("should validate query options", () => {
      const options = {
        limit: 50,
        status: "ACTIVE",
        departmentId: "dept_123",
      };

      const result = RipplingQueryOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = RipplingQueryOptionsSchema.parse({});

      expect(result.limit).toBe(100);
      expect(result.offset).toBe(0);
    });
  });
});

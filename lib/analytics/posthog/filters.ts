/**
 * PostHog HogQL filter utilities
 * Reusable filters for consistent data querying
 */

export interface FilterOptions {
  excludeLocalhost?: boolean;
  excludeInternalIPs?: boolean;
  excludeStudioPaths?: boolean;
  excludeInternalDomains?: boolean;
  excludeDevelopers?: boolean;
  excludeDeveloperCohort?: boolean;
  excludeInternalEmails?: boolean;
}

/**
 * Internal IPs to exclude from analytics
 */
const INTERNAL_IPS = ["131.226.35.186", "64.226.133.85"];

/**
 * Developer cohort ID
 */
const DEVELOPER_COHORT_ID = 172499;
const DEVELOPER_COHORT_VERSION = 40;

/**
 * Build filter clauses for excluding internal traffic
 */
export function buildInternalTrafficFilters(
  options: FilterOptions = {}
): string[] {
  const {
    excludeLocalhost = true,
    excludeInternalIPs = true,
    excludeStudioPaths = true,
    excludeInternalDomains = true,
    excludeDevelopers = true,
    excludeDeveloperCohort = true,
    excludeInternalEmails = true,
  } = options;

  const filters: string[] = [];

  // Exclude localhost/127.0.0.1
  if (excludeLocalhost) {
    filters.push(
      "ifNull(not(match(toString(properties.$host), '^(localhost|127\\.0\\.0\\.1)($|:)')), 1)"
    );
  }

  // Exclude internal IPs
  if (excludeInternalIPs) {
    filters.push(
      `notIn(properties.$ip, tuple(${INTERNAL_IPS.map((ip) => `'${ip}'`).join(", ")}))`
    );
  }

  // Exclude studio paths
  if (excludeStudioPaths) {
    filters.push("notILike(toString(properties.$pathname), '%/studio%')");
  }

  // Exclude internal referring domains
  if (excludeInternalDomains) {
    filters.push(
      "notILike(toString(properties.$referring_domain), '%commercial-company%')"
    );
  }

  // Exclude developers by property
  if (excludeDevelopers) {
    filters.push("notEquals(properties.is_moose_developer, true)");
    filters.push("notEquals(properties.is_developer, true)");
  }

  // Exclude internal emails
  if (excludeInternalEmails) {
    filters.push(
      "notILike(toString(person.properties.email), '%fiveonefour.com%')"
    );
  }

  // Exclude developer cohort
  if (excludeDeveloperCohort) {
    filters.push(
      `notIn(person_id, (SELECT person_id FROM raw_cohort_people WHERE and(equals(cohort_id, ${DEVELOPER_COHORT_ID}), equals(version, ${DEVELOPER_COHORT_VERSION}))))`
    );
  }

  return filters;
}

/**
 * Build date range filter for timestamp
 */
export function buildDateRangeFilter(
  startDate: string,
  endDate: string,
  fieldName: string = "timestamp"
): string[] {
  return [
    `greaterOrEquals(${fieldName}, toStartOfInterval(assumeNotNull(toDateTime('${startDate}')), toIntervalDay(1)))`,
    `lessOrEquals(${fieldName}, assumeNotNull(toDateTime('${endDate}')))`,
  ];
}

/**
 * Build filter for excluding deleted GitHub actions
 */
export function buildExcludeDeletedActionsFilter(): string {
  return "notEquals(properties.action, 'deleted')";
}

/**
 * Build filter for specific event
 */
export function buildEventFilter(eventName: string): string {
  return `equals(event, '${eventName}')`;
}

/**
 * Build filter for product group (used for Moosestack filtering)
 */
export function buildProductGroupFilter(
  products: string[],
  groupKey: string = "properties_group_custom"
): string {
  const productTuple = products.map((p) => `'${p}'`).join(", ");
  return `in(e.${groupKey}[%(hogql_val_2)s], tuple(${productTuple}))`;
}

/**
 * Combine multiple filters with AND
 */
export function combineFilters(filters: string[]): string {
  if (filters.length === 0) return "1 = 1";
  if (filters.length === 1) return filters[0];
  return `and(${filters.join(", ")})`;
}

/**
 * Format ISO date string to HogQL-compatible format (YYYY-MM-DD HH:MM:SS)
 */
export function formatDateForHogQL(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Build complete WHERE clause with all filters
 */
export function buildWhereClause(
  startDate: string,
  endDate: string,
  eventName?: string,
  filterOptions: FilterOptions = {},
  additionalFilters: string[] = []
): string {
  const filters: string[] = [];

  // Add date range
  filters.push(...buildDateRangeFilter(startDate, endDate));

  // Add event filter if provided
  if (eventName) {
    filters.push(buildEventFilter(eventName));
  }

  // Add internal traffic filters
  filters.push(...buildInternalTrafficFilters(filterOptions));

  // Add any additional custom filters
  filters.push(...additionalFilters);

  return combineFilters(filters);
}


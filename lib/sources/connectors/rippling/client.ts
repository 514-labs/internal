/**
 * Rippling connector client
 * Re-exports from the existing integration for backwards compatibility
 */

export {
  RipplingClient,
  createRipplingClient,
  getRipplingToken,
  storeRipplingToken,
  deleteRipplingToken,
  validateRipplingToken,
  getRipplingConnectionStatus,
  getJobBoardSlug,
  isJobBoardConfigured,
  getPublicJobBoardJobs,
  getPublicJobBoardBranding,
  getPublicJobBoardLocations,
  getPublicJobBoardDepartments,
  type RipplingTokenRecord,
  type RipplingConnectionStatus,
} from "@/lib/integrations/rippling";



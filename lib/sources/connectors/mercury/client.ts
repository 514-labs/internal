/**
 * Mercury connector client
 * Re-exports from the existing integration for backwards compatibility
 */

export {
  MercuryClient,
  createMercuryClient,
  getMercuryToken,
  storeMercuryToken,
  deleteMercuryToken,
  validateMercuryToken,
  getMercuryConnectionStatus,
  type MercuryTokenRecord,
  type MercuryConnectionStatus,
} from "@/lib/integrations/mercury";


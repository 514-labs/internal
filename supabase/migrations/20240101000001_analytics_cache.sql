-- Analytics Cache and Logs Tables (OPTIONAL - for future use)
-- 
-- These tables are for caching query results and tracking API usage.
-- Uncomment when ready to implement caching.

/*

-- Analytics Query Cache Table
-- Stores cached results from expensive analytics queries
CREATE TABLE IF NOT EXISTS analytics_query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_key TEXT NOT NULL UNIQUE,
  query_params JSONB,
  result_data JSONB NOT NULL,
  source TEXT NOT NULL, -- 'posthog', 'linear'
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ
);

CREATE INDEX idx_query_cache_key ON analytics_query_cache(query_key);
CREATE INDEX idx_query_cache_expires ON analytics_query_cache(expires_at);
CREATE INDEX idx_query_cache_source ON analytics_query_cache(source);

-- Computed Metrics Table
-- Stores pre-aggregated analytics metrics
CREATE TABLE IF NOT EXISTS analytics_computed_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimensions JSONB,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL
);

CREATE INDEX idx_computed_metrics_name ON analytics_computed_metrics(metric_name);
CREATE INDEX idx_computed_metrics_period ON analytics_computed_metrics(period_start, period_end);

-- API Usage Logs Table
-- Track analytics API usage for monitoring and rate limiting
CREATE TABLE IF NOT EXISTS analytics_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  query_params JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_logs_user ON analytics_api_logs(user_id);
CREATE INDEX idx_api_logs_endpoint ON analytics_api_logs(endpoint);
CREATE INDEX idx_api_logs_created ON analytics_api_logs(created_at);

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analytics_query_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

*/

-- This is a placeholder migration for future caching functionality
-- Uncomment the SQL above when ready to implement caching
SELECT 1;


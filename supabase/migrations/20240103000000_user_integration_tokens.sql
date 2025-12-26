-- Create User Integration Tokens table for per-user API token storage
-- Unlike integration_tokens (workspace-level), this stores user-specific credentials
-- Critical: RLS policies ensure users can ONLY access their own tokens

CREATE TABLE IF NOT EXISTS user_integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  integration_name TEXT NOT NULL, -- e.g., 'rippling', 'hubspot', etc.
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Each user can only have one token per integration
  UNIQUE(user_id, integration_name)
);

-- Create indexes for performance
CREATE INDEX idx_user_integration_tokens_user_id ON user_integration_tokens(user_id);
CREATE INDEX idx_user_integration_tokens_integration ON user_integration_tokens(integration_name);
CREATE INDEX idx_user_integration_tokens_user_integration ON user_integration_tokens(user_id, integration_name);

-- Enable Row Level Security
ALTER TABLE user_integration_tokens ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY POLICIES
-- These policies ensure users can ONLY access their own tokens
-- Even if application code has bugs, the database will not return other users' tokens

-- RLS Policy: Users can ONLY view their own tokens
CREATE POLICY "Users can only view their own tokens"
  ON user_integration_tokens
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Users can ONLY insert their own tokens
CREATE POLICY "Users can only create their own tokens"
  ON user_integration_tokens
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Users can ONLY update their own tokens
CREATE POLICY "Users can only update their own tokens"
  ON user_integration_tokens
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Users can ONLY delete their own tokens
CREATE POLICY "Users can only delete their own tokens"
  ON user_integration_tokens
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Service role has full access (for backend operations)
-- This is used when the backend needs to operate without user JWT context
CREATE POLICY "Service role has full access"
  ON user_integration_tokens
  FOR ALL
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integration_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_integration_tokens_updated_at_trigger
  BEFORE UPDATE ON user_integration_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integration_tokens_updated_at();

-- Add comment explaining the table
COMMENT ON TABLE user_integration_tokens IS 'Stores per-user API tokens for third-party integrations. Each user has their own isolated tokens. CRITICAL: RLS policies enforce that users can only access their own tokens.';


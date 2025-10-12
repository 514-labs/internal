-- Create Integration Tokens table for OAuth token storage
-- Stores OAuth tokens for third-party integrations (Linear, etc.)

CREATE TABLE IF NOT EXISTS integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE, -- e.g., 'linear', 'github', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_integration_tokens_name ON integration_tokens(integration_name);
CREATE INDEX idx_integration_tokens_expires_at ON integration_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role has full access (for backend token retrieval)
CREATE POLICY "Service role has full access"
  ON integration_tokens
  FOR ALL
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integration_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_integration_tokens_updated_at_trigger
  BEFORE UPDATE ON integration_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_tokens_updated_at();

-- Add comment explaining the table
COMMENT ON TABLE integration_tokens IS 'Stores OAuth tokens for third-party integrations. Workspace-level tokens managed by admins.';


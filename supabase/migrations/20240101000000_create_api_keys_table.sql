-- Create API Keys table for secure storage
-- API keys are hashed and stored with metadata for authentication

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash) WHERE NOT revoked;
CREATE INDEX idx_api_keys_active ON api_keys(user_id, revoked) WHERE NOT revoked;

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own API keys
CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Users can insert their own API keys
CREATE POLICY "Users can create their own API keys"
  ON api_keys
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Service role has full access (for API key validation)
-- This allows the backend to validate API keys without user context
CREATE POLICY "Service role has full access"
  ON api_keys
  FOR ALL
  TO service_role
  USING (true);

-- Function to clean up expired API keys
CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE api_keys
  SET revoked = true,
      revoked_at = NOW()
  WHERE expires_at < NOW()
    AND NOT revoked;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate API key and update last_used_at
CREATE OR REPLACE FUNCTION validate_and_update_api_key(p_key_hash TEXT)
RETURNS TABLE (
  user_id TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  -- Update last_used_at and return user_id if key is valid
  RETURN QUERY
  UPDATE api_keys
  SET last_used_at = NOW()
  WHERE key_hash = p_key_hash
    AND NOT revoked
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING api_keys.user_id, true;
  
  -- If no rows were updated, key is invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::TEXT, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the table
COMMENT ON TABLE api_keys IS 'Stores hashed API keys for analytics API authentication. Keys are never stored in plain text.';


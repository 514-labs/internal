#!/bin/bash

# OAuth Implementation Test Script
# Usage: ./scripts/test-oauth.sh https://your-app.vercel.app

if [ -z "$1" ]; then
  echo "Usage: $0 <base-url>"
  echo "Example: $0 https://your-app.vercel.app"
  exit 1
fi

BASE_URL="${1%/}" # Remove trailing slash if present
echo "Testing OAuth implementation at: $BASE_URL"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test an endpoint
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local check_json="${4:-true}"
  
  echo "Testing: $name"
  echo "URL: $url"
  
  # Make request and capture response
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$url")
  http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS:/d')
  
  # Check status code
  if [ "$http_status" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} Status code: $http_status"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} Status code: $http_status (expected $expected_status)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  # Check if response is valid JSON
  if [ "$check_json" = "true" ]; then
    if echo "$body" | jq . >/dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} Valid JSON response"
    else
      echo -e "${RED}✗${NC} Invalid JSON response"
      echo "Response: $body"
    fi
  fi
  
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo ""
  echo "------------------------------------------------"
  echo ""
}

# Function to test POST endpoint with auth
test_mcp_without_auth() {
  local url="$BASE_URL/mcp"
  
  echo "Testing: MCP Endpoint (without auth)"
  echo "URL: $url"
  
  # Make request and capture full response including headers
  response=$(curl -i -s -X POST "$url" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}')
  
  # Check for 401 status
  if echo "$response" | grep -q "HTTP/[0-9.]* 401"; then
    echo -e "${GREEN}✓${NC} Returns 401 Unauthorized (correct)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} Did not return 401"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  # Check for WWW-Authenticate header
  if echo "$response" | grep -qi "WWW-Authenticate:"; then
    echo -e "${GREEN}✓${NC} WWW-Authenticate header present"
    echo "Header value:"
    echo "$response" | grep -i "WWW-Authenticate:" | sed 's/^/  /'
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} WWW-Authenticate header missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  # Check if header includes resource_metadata
  if echo "$response" | grep -qi "resource_metadata"; then
    echo -e "${GREEN}✓${NC} resource_metadata parameter present in WWW-Authenticate"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} resource_metadata parameter missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  echo ""
  echo "Full response:"
  echo "$response"
  echo ""
  echo "------------------------------------------------"
  echo ""
}

# Function to validate protected resource metadata
validate_protected_resource() {
  local url="$BASE_URL/.well-known/oauth-protected-resource"
  
  echo "Validating: Protected Resource Metadata"
  
  response=$(curl -s "$url")
  
  # Check for required fields
  if echo "$response" | jq -e '.resource' >/dev/null 2>&1; then
    resource=$(echo "$response" | jq -r '.resource')
    echo -e "${GREEN}✓${NC} 'resource' field present: $resource"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} 'resource' field missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  if echo "$response" | jq -e '.authorization_servers | length > 0' >/dev/null 2>&1; then
    auth_servers=$(echo "$response" | jq -r '.authorization_servers[]')
    echo -e "${GREEN}✓${NC} 'authorization_servers' present:"
    echo "$auth_servers" | sed 's/^/    /'
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} 'authorization_servers' missing or empty"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  if echo "$response" | jq -e '.scopes_supported | length > 0' >/dev/null 2>&1; then
    scopes=$(echo "$response" | jq -r '.scopes_supported[]')
    echo -e "${GREEN}✓${NC} 'scopes_supported' present: $(echo $scopes | tr '\n' ', ')"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠${NC} 'scopes_supported' missing or empty"
  fi
  
  echo ""
  echo "------------------------------------------------"
  echo ""
}

# Function to validate auth server metadata
validate_auth_server() {
  local url="$BASE_URL/.well-known/oauth-authorization-server"
  
  echo "Validating: Authorization Server Metadata"
  
  response=$(curl -s "$url")
  
  # Required fields
  required_fields=("issuer" "authorization_endpoint" "token_endpoint" "jwks_uri" "registration_endpoint")
  
  for field in "${required_fields[@]}"; do
    if echo "$response" | jq -e ".$field" >/dev/null 2>&1; then
      value=$(echo "$response" | jq -r ".$field")
      echo -e "${GREEN}✓${NC} '$field' present: $value"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}✗${NC} '$field' missing"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  done
  
  # Check for PKCE support
  if echo "$response" | jq -e '.code_challenge_methods_supported | contains(["S256"])' >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PKCE (S256) supported"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} PKCE (S256) not supported or missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  echo ""
  echo "------------------------------------------------"
  echo ""
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠ Warning: jq is not installed. JSON validation will be limited.${NC}"
  echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
  echo ""
fi

# Run tests
echo "1. Testing Protected Resource Metadata Endpoint"
echo "================================================"
test_endpoint \
  "Protected Resource Metadata" \
  "$BASE_URL/.well-known/oauth-protected-resource" \
  "200"

validate_protected_resource

echo "2. Testing Authorization Server Metadata Endpoint"
echo "================================================"
test_endpoint \
  "Authorization Server Metadata" \
  "$BASE_URL/.well-known/oauth-authorization-server" \
  "200"

validate_auth_server

echo "3. Testing OpenID Configuration Endpoint"
echo "================================================"
test_endpoint \
  "OpenID Configuration" \
  "$BASE_URL/.well-known/openid-configuration" \
  "200"

echo "4. Testing MCP Endpoint Without Authentication"
echo "================================================"
test_mcp_without_auth

# Summary
echo ""
echo "========================================"
echo "           TEST SUMMARY"
echo "========================================"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed! OAuth implementation looks good.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Try adding your MCP server to ChatGPT"
  echo "2. Go to ChatGPT Settings → Connectors → Create"
  echo "3. Enter: $BASE_URL/mcp"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
  echo ""
  echo "Common issues:"
  echo "- Ensure all .well-known endpoints are deployed"
  echo "- Check Clerk environment variables are set"
  echo "- Verify middleware allows public access to OAuth endpoints"
  exit 1
fi


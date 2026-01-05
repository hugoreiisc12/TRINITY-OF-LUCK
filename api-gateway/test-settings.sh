#!/bin/bash
# Test PUT /api/settings Endpoint
# Quick test script with cURL commands

echo "========================================="
echo "PUT /api/settings - Endpoint Test Suite"
echo "========================================="
echo ""

# Get token from environment or use placeholder
TOKEN=${TEST_TOKEN:-"your_valid_jwt_token_here"}
BASE_URL=${BASE_URL:-"http://localhost:3001"}

if [ "$TOKEN" = "your_valid_jwt_token_here" ]; then
  echo "⚠️  WARNING: No TEST_TOKEN environment variable found"
  echo "Usage: TEST_TOKEN='your_token' bash test-settings.sh"
  echo ""
fi

echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Token: ${TOKEN:0:20}..."
echo ""

# Test 1: Update theme
echo "Test 1: Update theme (tema)"
echo "---"
curl -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tema":"escuro"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Update multiple settings
echo "Test 2: Update multiple settings"
echo "---"
curl -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tema":"claro",
    "idioma":"en-US",
    "privacidade":"publico"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Update notifications
echo "Test 3: Update notification settings"
echo "---"
curl -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificacoes":false,
    "notificacoes_email":false,
    "notificacoes_push":true
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: No authentication (should fail with 401)
echo "Test 4: No authentication (expect 401)"
echo "---"
curl -X PUT "$BASE_URL/api/settings" \
  -H "Content-Type: application/json" \
  -d '{"tema":"escuro"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 5: No settings provided (should fail with 400)
echo "Test 5: No settings provided (expect 400)"
echo "---"
curl -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 6: Update profile
echo "Test 6: Update profile"
echo "---"
curl -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"perfil":"experiente"}' \
  -w "\nStatus: %{http_code}\n\n"

echo "========================================="
echo "Tests completed!"
echo "========================================="

#!/bin/bash

# ============================================================
# TRINITY OF LUCK - API Gateway Test Script
# ============================================================
# Quick testing of all protected endpoints and webhooks

# Configuration
API_URL="http://localhost:3001"
# Replace with actual JWT token from Supabase authentication
JWT_TOKEN="${1:-your-jwt-token-here}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# Helper Functions
# ============================================================

echo_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -e "${YELLOW}📌 Testing:${NC} $description"
  echo -e "   ${YELLOW}$method${NC} $endpoint"

  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    response=$(curl -s -X $method \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_URL$endpoint")
  else
    response=$(curl -s -X $method \
      -H "Authorization: Bearer $JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint")
  fi

  # Pretty print JSON
  echo "$response" | jq . 2>/dev/null || echo "$response"
  echo ""
}

test_webhook() {
  local endpoint=$1
  local data=$2
  local description=$3

  echo -e "${YELLOW}📌 Testing:${NC} $description"
  echo -e "   POST $endpoint"

  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$data" \
    "$API_URL$endpoint")

  echo "$response" | jq . 2>/dev/null || echo "$response"
  echo ""
}

# ============================================================
# Health Checks
# ============================================================

echo_header "🏥 HEALTH CHECKS"

curl -s -X GET "$API_URL/health" | jq .
echo ""

curl -s -X GET "$API_URL/api/health" | jq .
echo ""

curl -s -X GET "$API_URL/api/test-supabase" | jq .
echo ""

# ============================================================
# Database Checks
# ============================================================

echo_header "💾 DATABASE CHECKS"

curl -s -X GET "$API_URL/api/database/schema" | jq .
echo ""

curl -s -X GET "$API_URL/api/database/tables" | jq .
echo ""

# ============================================================
# Protected Endpoints (Require JWT)
# ============================================================

if [ "$JWT_TOKEN" = "your-jwt-token-here" ]; then
  echo -e "${RED}❌ Error: JWT_TOKEN not provided${NC}"
  echo -e "   Usage: ./test.sh <your-jwt-token>"
  echo -e "\n   Get token from Supabase:"
  echo -e "   ${YELLOW}curl -X POST https://your-supabase.supabase.co/auth/v1/token?grant_type=password \\${NC}"
  echo -e "     ${YELLOW}-H 'Content-Type: application/json' \\${NC}"
  echo -e "     ${YELLOW}-d '{${NC}"
  echo -e "       ${YELLOW}\"email\": \"user@example.com\",${NC}"
  echo -e "       ${YELLOW}\"password\": \"password123\"${NC}"
  echo -e "     ${YELLOW}}' | jq .access_token${NC}\n"
  exit 1
fi

echo_header "🔐 PROTECTED ENDPOINTS (JWT Required)"

# Get user profile
test_endpoint "GET" "/api/auth/me" "" "Get user profile"

# Update user profile
test_endpoint "PUT" "/api/auth/profile" \
  '{
    "perfil": {
      "nome": "Test User",
      "telefone": "+55 11 98765-4321"
    }
  }' \
  "Update user profile"

# Get subscriptions
test_endpoint "GET" "/api/auth/subscriptions" "" "Get user subscriptions"

# Get analyses
test_endpoint "GET" "/api/auth/analyses" "" "Get user analyses"

# Create checkout session
test_endpoint "POST" "/api/stripe/checkout" \
  '{
    "planId": "plan-test-uuid",
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }' \
  "Create Stripe checkout session"

# ============================================================
# Webhooks (No JWT Required)
# ============================================================

echo_header "🔔 WEBHOOKS (No Auth Required)"

# Stripe webhook - payment succeeded
test_webhook "/api/webhooks/stripe" \
  '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123456",
        "customer": "cus_test_123456",
        "amount": 9999
      }
    }
  }' \
  "Stripe webhook - payment succeeded"

# Stripe webhook - subscription created
test_webhook "/api/webhooks/stripe" \
  '{
    "type": "customer.subscription.created",
    "data": {
      "object": {
        "id": "sub_test_123456"
      }
    }
  }' \
  "Stripe webhook - subscription created"

# Supabase auth webhook - user signup
test_webhook "/api/webhooks/auth" \
  '{
    "type": "user_signup",
    "data": {
      "user": {
        "id": "uuid-test-123",
        "email": "newuser@example.com"
      }
    }
  }' \
  "Supabase auth webhook - user signup"

# ============================================================
# Summary
# ============================================================

echo_header "✅ TESTING COMPLETE"

echo -e "${GREEN}Next Steps:${NC}"
echo "1. Review responses above for any errors"
echo "2. Check API Gateway logs for detailed error messages"
echo "3. Verify JWT token is valid and not expired"
echo "4. Ensure database tables exist: GET /api/database/tables"
echo "5. Test Stripe webhook signature verification in production"
echo ""
echo -e "${GREEN}Documentation:${NC}"
echo "• AUTH_ENDPOINTS.md - Complete endpoint reference"
echo "• STRIPE_JWT_SETUP.md - Setup & configuration guide"
echo "• client-protected-endpoints.js - Frontend examples"
echo ""

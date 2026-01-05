#!/bin/bash
# ============================================================
# Build Script for Production Deployment
# ============================================================
# Usage: ./scripts/build.sh

set -e

echo "🔨 Building Trinity API Gateway for Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
else
    echo "✓ Dependencies already installed"
fi

# Run linting
echo -e "${YELLOW}Running ESLint...${NC}"
if npm run lint 2>/dev/null; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠ Linting warnings found (non-blocking)${NC}"
fi

# Run unit tests
echo -e "${YELLOW}Running unit tests...${NC}"
if npm run test:unit -- --coverage 2>/dev/null; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    exit 1
fi

# Clean previous build
echo -e "${YELLOW}Cleaning previous build...${NC}"
rm -rf dist/
rm -rf build/

# Build TypeScript
echo -e "${YELLOW}Compiling TypeScript...${NC}"
npx tsc --project tsconfig.json

echo -e "${YELLOW}Building application...${NC}"
npm run build

# Generate build info
echo -e "${YELLOW}Generating build information...${NC}"
cat > dist/build-info.json <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(node -p -e \"require('./package.json').version\")",
  "node": "$(node --version)",
  "npm": "$(npm --version)",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

echo -e "${GREEN}✓ Build completed successfully${NC}"
echo -e "${GREEN}✓ Output directory: dist/${NC}"
echo -e "\n${GREEN}Build Information:${NC}"
cat dist/build-info.json | jq '.'

exit 0

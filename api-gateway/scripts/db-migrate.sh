#!/bin/bash
# ============================================================
# Database Migration Script for Production
# ============================================================
# Usage: ./scripts/db-migrate.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Trinity API Gateway - Database Migration${NC}\n"

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}✗ DATABASE_URL environment variable not set${NC}"
    exit 1
fi

if [ -z "$NODE_ENV" ]; then
    echo -e "${YELLOW}⚠ NODE_ENV not set, defaulting to 'development'${NC}"
    export NODE_ENV=development
fi

echo -e "${YELLOW}Environment: $NODE_ENV${NC}"
echo -e "${YELLOW}Database: ${DATABASE_URL%@*}@...${NC}\n"

# Check if Prisma is installed (if using Prisma)
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${YELLOW}Detected Prisma setup...${NC}"
    echo -e "${YELLOW}Running Prisma migrations...${NC}"
    
    # Run pending migrations
    npx prisma migrate deploy
    
    # Generate Prisma client
    npx prisma generate
    
    echo -e "${GREEN}✓ Prisma migrations completed${NC}"
fi

# Check if Knex is configured (if using Knex)
if [ -f "knexfile.js" ] || [ -f "knexfile.ts" ]; then
    echo -e "${YELLOW}Detected Knex configuration...${NC}"
    echo -e "${YELLOW}Running Knex migrations...${NC}"
    
    # Run pending migrations
    npx knex migrate:latest
    
    # Run seeds if in development/staging
    if [ "$NODE_ENV" != "production" ]; then
        echo -e "${YELLOW}Running seeds...${NC}"
        npx knex seed:run
    fi
    
    echo -e "${GREEN}✓ Knex migrations completed${NC}"
fi

# Health check - test database connection
echo -e "${YELLOW}Testing database connection...${NC}"

# Create a simple Node.js script to test connection
cat > /tmp/test-db.js << 'DBTEST'
const { Pool } = require('pg');
const url = new URL(process.env.DATABASE_URL);

const pool = new Pool({
  host: url.hostname,
  port: url.port,
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password,
  ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✓ Database connection successful');
    console.log('✓ Current time on database:', result.rows[0].now);
    process.exit(0);
  }
});
DBTEST

if node /tmp/test-db.js; then
    echo -e "${GREEN}✓ Database health check passed${NC}"
else
    echo -e "${RED}✗ Database health check failed${NC}"
    exit 1
fi

# Cleanup
rm /tmp/test-db.js

echo -e "\n${GREEN}✓ Database migration completed successfully${NC}"
echo -e "${GREEN}✓ Database is ready for application startup${NC}"

exit 0

-- Initialize Database for TRINITY OF LUCK
-- This file is automatically run when PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: The rest of the schema initialization should be done by
-- the application's database.js script on startup.
-- This file ensures the database and basic structure exist.

-- Log initialization
\echo 'PostgreSQL initialization starting...'

-- Set application name for logging
SET application_name = 'trinity-init';

\echo 'Trinity of Luck database initialized successfully!'

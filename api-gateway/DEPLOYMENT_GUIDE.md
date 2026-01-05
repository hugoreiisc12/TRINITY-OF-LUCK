# 🚀 Trinity of Luck API Gateway - Production Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Railway.app Deployment](#railwayapp-deployment)
4. [Heroku Deployment](#heroku-deployment)
5. [GitHub Actions CI/CD Setup](#github-actions-cicd-setup)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides comprehensive instructions for deploying the Trinity API Gateway to production environments on Railway.app or Heroku. The deployment is automated via GitHub Actions for continuous integration and deployment (CI/CD).

**Supported Platforms:**
- Railway.app (recommended - native Node.js, PostgreSQL, Redis support)
- Heroku (traditional - requires Procfile configuration)

**Key Features:**
- Automated testing and build verification
- Zero-downtime deployments
- Health checks and verification
- Automatic rollback on failure
- Monitoring and alerting integration

---

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

### ✅ Required Accounts
- [ ] GitHub account with repository access
- [ ] Railway.app account OR Heroku account
- [ ] PostgreSQL database service (Supabase or external)
- [ ] Redis cache service (Railway Redis or external)
- [ ] Stripe account (production keys)
- [ ] SendGrid or SMTP email service account
- [ ] Sentry.io account for error tracking

### ✅ Code Preparation
- [ ] All tests passing locally (`npm test`)
- [ ] No console.log statements in production code
- [ ] Environment variables configured correctly
- [ ] Database migrations verified
- [ ] No hardcoded secrets or API keys

### ✅ Repository Setup
- [ ] GitHub repository created and public
- [ ] Main branch protected with branch rules
- [ ] All code committed and pushed to repository
- [ ] `.github/workflows/` directory contains CI/CD files

### ✅ Environment Variables
- [ ] `.env.example` file updated with all required variables
- [ ] All production secrets generated (JWT_SECRET, etc.)
- [ ] Database credentials prepared
- [ ] Redis connection URL ready
- [ ] Stripe live keys obtained (not test keys)

### ✅ Database
- [ ] PostgreSQL database created
- [ ] Database user with appropriate permissions created
- [ ] SSL/TLS configuration enabled
- [ ] Backups configured

### ✅ External Services
- [ ] Stripe webhook configured
- [ ] Email service API key obtained
- [ ] Sentry DSN created
- [ ] Slack webhook URL (optional, for notifications)

---

## Railway.app Deployment

Railway.app is recommended for its seamless Node.js deployment experience.

### Step 1: Create Railway.app Account

1. Visit [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for automatic permissions)
3. Create a new project

### Step 2: Connect GitHub Repository

```bash
# In Railway Dashboard:
1. Click "Create a new project"
2. Select "GitHub Repo" → Select your trinity-api-gateway repository
3. Railway will automatically:
   - Detect Node.js environment
   - Install dependencies
   - Build the application
   - Deploy on push to main branch
```

### Step 3: Create Services

Create the following services in Railway for your project:

#### Database Service (PostgreSQL)
```bash
1. In Railway Dashboard → "Add service" → "PostgreSQL"
2. Note the connection URL from the service variables
3. Add to environment variables:
   - DATABASE_URL = [PostgreSQL URL from Railway]
```

#### Cache Service (Redis)
```bash
1. In Railway Dashboard → "Add service" → "Redis"
2. Note the connection URL from the service variables
3. Add to environment variables:
   - REDIS_URL = [Redis URL from Railway]
```

### Step 4: Configure Environment Variables

In Railway Dashboard:

```bash
1. Select the Node.js service
2. Go to "Variables" tab
3. Add all variables from .env.example:
   - NODE_ENV=production
   - PORT=3001 (Railway will expose this)
   - SUPABASE_URL, SUPABASE_ANON_KEY, etc.
   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
   - JWT_SECRET (generate with: openssl rand -base64 32)
   - All other required variables
```

### Step 5: Configure Start Script

Railway auto-detects `npm start` from package.json. Ensure your package.json has:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc && npm run copy-assets"
  }
}
```

### Step 6: Deploy

```bash
# Push to main branch triggers automatic deployment
git push origin main

# Or manually trigger in Railway Dashboard:
# Service → Deployments → "Deploy" button
```

### Step 7: Verify Deployment

```bash
# Check logs in Railway Dashboard:
1. Services → [Your Service] → Logs
2. Look for successful startup message
3. Verify health endpoint responds

curl https://[your-railway-domain]/health
```

---

## Heroku Deployment

### Step 1: Create Heroku Account

1. Visit [heroku.com](https://heroku.com)
2. Sign up and verify email
3. Create a new application

### Step 2: Create Heroku App

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Or on Windows:
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create trinity-api-gateway-prod

# Verify remote added
git remote -v
```

### Step 3: Add Buildpacks

```bash
# Heroku needs buildpacks to understand Node.js
heroku buildpacks:add heroku/nodejs

# Verify
heroku buildpacks
```

### Step 4: Add Services (PostgreSQL & Redis)

```bash
# PostgreSQL
heroku addons:create heroku-postgresql:standard-0 --app trinity-api-gateway-prod

# Redis
heroku addons:create heroku-redis:premium-0 --app trinity-api-gateway-prod

# Get connection URLs
heroku config --app trinity-api-gateway-prod
```

### Step 5: Set Environment Variables

```bash
# Set all required environment variables
heroku config:set NODE_ENV=production \
  --app trinity-api-gateway-prod

heroku config:set SUPABASE_URL=https://your-project.supabase.co \
  --app trinity-api-gateway-prod

heroku config:set SUPABASE_ANON_KEY=your-anon-key \
  --app trinity-api-gateway-prod

# ... Set all other variables from .env.example

# View all variables
heroku config --app trinity-api-gateway-prod
```

### Step 6: Deploy

```bash
# Deploy main branch to Heroku
git push heroku main

# Or for a different branch:
git push heroku develop:main

# Watch deployment logs
heroku logs --tail --app trinity-api-gateway-prod
```

### Step 7: Run Database Migrations

```bash
# Execute migration script on Heroku
heroku run ./scripts/db-migrate.sh --app trinity-api-gateway-prod

# Or run Prisma migrations
heroku run npx prisma migrate deploy --app trinity-api-gateway-prod
```

### Step 8: Verify Deployment

```bash
# Test health endpoint
curl https://trinity-api-gateway-prod.herokuapp.com/health

# View application logs
heroku logs --app trinity-api-gateway-prod
```

---

## GitHub Actions CI/CD Setup

### Step 1: Create GitHub Secrets

Navigate to GitHub Repository → Settings → Secrets and variables → Actions

Create the following secrets:

#### For Railway Deployment
```
RAILWAY_TOKEN          # From Railway.app → Account Settings → API Token
RAILWAY_PROJECT_ID     # From Railway.app → Project ID
RAILWAY_SERVICE_NAME   # Name of your Node.js service
```

#### For Heroku Deployment (Alternative)
```
HEROKU_API_KEY        # From Heroku → Account → API Key
HEROKU_APP_NAME       # trinity-api-gateway-prod
HEROKU_EMAIL          # Your Heroku account email
```

#### For Notifications (Optional)
```
SLACK_WEBHOOK_URL     # From Slack → Incoming Webhooks
SENTRY_DSN           # From Sentry.io → Project Settings
```

### Step 2: Verify Workflow Files

Check that these files exist:

```
.github/workflows/
├── test.yml      # Runs tests on push/PR
└── deploy.yml    # Deploys to production on push to main
```

### Step 3: Trigger Workflows

#### Test Workflow (Automatic)
Runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

View results: GitHub → Actions → Test Suite

#### Deploy Workflow (Automatic)
Runs automatically on:
- Push to `main` branch

View results: GitHub → Actions → Deploy to Production

#### Manual Deployment
```bash
# Via GitHub CLI
gh workflow run deploy.yml -r main

# Via GitHub Web Interface:
# Actions → Deploy to Production → "Run workflow" → Select environment
```

### Step 4: Monitor Workflows

```bash
# Watch logs in real-time
gh run watch <run-id>

# List recent runs
gh run list --workflow=deploy.yml

# View specific run
gh run view <run-id> --log
```

---

## Environment Configuration

### Production Environment Variables

Create `.env` file on server with all values from `.env.example`:

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Secure passwords and keys:
# - Use strong, unique values
# - Never commit .env to git
# - Use platform-specific secret management

# Critical for production:
- NODE_ENV=production
- HTTPS_REQUIRED=true
- HELMET_ENABLED=true
- CORS_ORIGIN=https://your-domain.com
- LOG_LEVEL=info (not debug)
- SENTRY_ENABLED=true (for error tracking)
```

### Multi-Environment Setup

Create environment-specific variable files:

```bash
.env.production       # Production variables
.env.staging          # Staging variables
.env.development      # Development variables
```

Load appropriate file:

```javascript
// In server.ts
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
require('dotenv').config({ path: envFile });
```

---

## Post-Deployment Verification

### Health Checks

```bash
# Check API health
curl -X GET https://api.trinity-of-luck.com/health

# Check database connection
curl -X GET https://api.trinity-of-luck.com/api/v1/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "redis": "connected",
  "uptime": "3600s"
}
```

### Database Verification

```bash
# Connect to production database
psql $DATABASE_URL

# Verify migrations applied
\dt  # List tables

# Check user data
SELECT COUNT(*) FROM users;
```

### API Testing

```bash
# Test authentication endpoint
curl -X POST https://api.trinity-of-luck.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test analysis endpoint
curl -X GET https://api.trinity-of-luck.com/api/v1/analysis/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Monitoring Dashboards

1. **Railway Dashboard**: Services → Logs → View real-time logs
2. **Heroku Dashboard**: Resources → Logs → Stream application logs
3. **Sentry**: Project → Issues → View errors and crashes
4. **Database Monitoring**: Supabase/PostgreSQL dashboard

---

## Monitoring and Logging

### Application Logs

#### View Railway Logs
```bash
# In Railway Dashboard:
1. Select service
2. Click "Logs" tab
3. Filter by log level
```

#### View Heroku Logs
```bash
heroku logs --tail --app trinity-api-gateway-prod
heroku logs --num 100 --app trinity-api-gateway-prod
```

#### View GitHub Actions Logs
```bash
# GitHub → Actions → Workflow run → Job logs
```

### Error Tracking (Sentry)

Monitor errors in real-time:
1. Visit Sentry Dashboard
2. Go to Project → Issues
3. Review crash reports and stack traces
4. Set up alerts for critical errors

### Performance Monitoring

Monitor API performance:
- Response times
- Database query times
- Cache hit rates
- Request throughput
- Error rates

Configure in Sentry or Datadog dashboard.

### Alerts

Set up alerts for:
- Deployment failures
- High error rates (>5% in 5 minutes)
- Database connection failures
- Redis connection failures
- Disk space full
- Memory usage >80%

---

## Rollback Procedures

### Railway Rollback

```bash
# In Railway Dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "Rollback" button
4. Verify deployment completed

# Verify rollback
curl https://api.trinity-of-luck.com/health
```

### Heroku Rollback

```bash
# View release history
heroku releases --app trinity-api-gateway-prod

# Rollback to previous version
heroku rollback v123 --app trinity-api-gateway-prod

# Verify rollback
curl https://trinity-api-gateway-prod.herokuapp.com/health
```

### GitHub Revert

```bash
# Identify failed commit
git log --oneline -5

# Create revert commit
git revert <commit-hash>

# Push to main (triggers redeploy)
git push origin main
```

---

## Troubleshooting

### Application Fails to Start

**Problem**: Application crashes immediately after deployment

**Solution**:
```bash
# 1. Check logs for error messages
heroku logs --tail  # or Railway logs

# 2. Verify environment variables
heroku config  # or Railway dashboard

# 3. Check Node.js version compatibility
node --version

# 4. Verify build script
npm run build  # test locally

# 5. Check Procfile syntax
cat Procfile
```

### Database Connection Error

**Problem**: `Unable to connect to database`

**Solution**:
```bash
# 1. Verify DATABASE_URL is set
echo $DATABASE_URL

# 2. Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# 3. Check firewall/SSL settings
# PostgreSQL URL should include ?sslmode=require

# 4. Run migrations
./scripts/db-migrate.sh
```

### Redis Connection Error

**Problem**: `Unable to connect to Redis`

**Solution**:
```bash
# 1. Verify REDIS_URL is set
echo $REDIS_URL

# 2. Test connection
redis-cli -u $REDIS_URL ping

# 3. Check Redis service is running
# Railway/Heroku: Verify add-on is active
```

### Out of Memory

**Problem**: Application crashes with memory error

**Solution**:
```bash
# 1. Increase memory limit (Heroku)
heroku ps:resize web=standard-2x

# 2. Implement memory optimization
npm install clinic
clinic doctor -- npm start

# 3. Monitor memory usage
heroku ps
```

### Slow Performance

**Problem**: API responses are slow

**Solution**:
```bash
# 1. Check database indexes
SELECT * FROM pg_stat_user_indexes;

# 2. Monitor active connections
SELECT * FROM pg_stat_activity;

# 3. Check query performance
EXPLAIN ANALYZE SELECT ...

# 4. Review slow query logs
# Set: log_min_duration_statement = 1000
```

### Deployment Hangs

**Problem**: Deployment process hangs or times out

**Solution**:
```bash
# 1. Check for long-running scripts
timeout 60 npm run build

# 2. View detailed logs
heroku logs --tail --ps=web

# 3. Check dependencies installation
npm ci --production

# 4. Increase timeout
heroku config:set BUILD_TIMEOUT=600
```

---

## Production Best Practices

### Security

- [ ] Use HTTPS only (HTTPS_REQUIRED=true)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Implement JWT token rotation
- [ ] Never commit secrets to repository
- [ ] Use GitHub Secrets for all sensitive data
- [ ] Enable database SSL connections
- [ ] Regular security audits

### Performance

- [ ] Enable response compression
- [ ] Configure Redis caching
- [ ] Use database connection pooling
- [ ] Implement query optimization
- [ ] Monitor and optimize N+1 queries
- [ ] Use CDN for static assets
- [ ] Implement request batching

### Reliability

- [ ] Monitor error rates
- [ ] Set up alerting
- [ ] Test rollback procedures
- [ ] Maintain database backups
- [ ] Implement graceful shutdown
- [ ] Configure health checks
- [ ] Use load balancing
- [ ] Implement circuit breakers

### Monitoring

- [ ] Set up application monitoring (Sentry, Datadog)
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Monitor error rates
- [ ] Set up alerting rules
- [ ] Regular log reviews
- [ ] Performance profiling

---

## Support and Resources

- **Railway Documentation**: https://docs.railway.app
- **Heroku Documentation**: https://devcenter.heroku.com
- **GitHub Actions**: https://docs.github.com/en/actions
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/
- **PostgreSQL Performance**: https://www.postgresql.org/docs/current/performance-tips.html

---

**Last Updated**: 2024-01-15
**Maintained by**: Trinity Development Team
**Version**: 1.0.0

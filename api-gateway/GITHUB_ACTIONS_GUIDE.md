# 📋 GitHub Actions CI/CD Configuration Guide

## Overview

This guide explains how to set up and manage GitHub Actions workflows for automated testing, building, and deployment of the Trinity API Gateway.

---

## Workflow Files Location

All workflow files are located in:
```
.github/workflows/
├── test.yml      # Runs tests on push and pull requests
└── deploy.yml    # Deploys to production on push to main
```

---

## Test Workflow (`test.yml`)

### What It Does

Automatically runs on:
- Every push to `main` or `develop` branches
- Every pull request to `main` or `develop` branches

Steps:
1. Sets up PostgreSQL and Redis test services
2. Installs dependencies
3. Runs ESLint
4. Runs unit tests
5. Runs integration tests
6. Uploads coverage reports

### Configuration

The workflow is pre-configured but can be customized:

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

### View Test Results

1. **In GitHub**:
   - Push code or open pull request
   - Navigate to PR → "Checks" tab
   - View test results and logs

2. **In Terminal**:
   ```bash
   gh run list --workflow=test.yml
   gh run view <run-id>
   ```

3. **Coverage Reports**:
   - Automatically uploaded to Codecov
   - View at: https://codecov.io/gh/your-org/trinity-api-gateway

---

## Deploy Workflow (`deploy.yml`)

### What It Does

Automatically runs on:
- Every push to `main` branch
- Manual trigger via GitHub Actions UI

Steps:
1. Checks out code
2. Sets up Node.js environment
3. Runs tests (must pass before deployment)
4. Builds application
5. Deploys to Railway or Heroku
6. Performs health checks
7. Sends Slack notification

### Configuration

Update deployment target in `.github/workflows/deploy.yml`:

```yaml
# For Railway (recommended)
- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    npm i -g @railway/cli
    railway link --projectId ${{ secrets.RAILWAY_PROJECT_ID }}
    railway up --service ${{ secrets.RAILWAY_SERVICE_NAME }}

# For Heroku (alternative)
- name: Deploy to Heroku
  env:
    HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
  run: |
    npm i -g heroku
    echo $HEROKU_API_KEY | heroku auth:login
    git push https://git.heroku.com/trinity-api-gateway-prod.git main
```

### Manual Deployment

Trigger deployment manually without pushing code:

```bash
# Via GitHub CLI
gh workflow run deploy.yml -r main --field environment=production

# Via GitHub Web Interface
# 1. Go to Actions tab
# 2. Select "Deploy to Production"
# 3. Click "Run workflow"
# 4. Select branch and environment
# 5. Click "Run workflow"
```

---

## Required GitHub Secrets

### For Railway Deployment

Set these in GitHub → Settings → Secrets and variables → Actions:

#### RAILWAY_TOKEN
```bash
# Get from Railway.app → Account Settings → API Token
# Select full access token
heroku config:set RAILWAY_TOKEN=<your-token>
```

#### RAILWAY_PROJECT_ID
```bash
# Get from Railway.app → Project Settings
# Format: project_xxxxxxxxxxxxx
```

#### RAILWAY_SERVICE_NAME
```bash
# Name of your Node.js service
# Usually: "nodejs" or your custom service name
```

### For Heroku Deployment (Alternative)

#### HEROKU_API_KEY
```bash
# Get from Heroku → Account Settings → API Key
heroku auth:token
```

#### HEROKU_EMAIL
```bash
# Your Heroku account email
```

#### HEROKU_APP_NAME
```bash
# Your Heroku application name
# Example: trinity-api-gateway-prod
```

### For Optional Notifications

#### SLACK_WEBHOOK_URL
```bash
# Get from Slack → App settings → Incoming Webhooks
# Used for deployment notifications
# Create in Slack workspace: https://api.slack.com/apps
```

#### SENTRY_DSN
```bash
# Get from Sentry.io → Project settings
# Used for error tracking
```

### How to Add Secrets

1. **Via GitHub Web**:
   ```
   Repository → Settings → Secrets and variables → Actions → New repository secret
   Name: RAILWAY_TOKEN
   Value: <paste your token>
   Click "Add secret"
   ```

2. **Via GitHub CLI**:
   ```bash
   gh secret set RAILWAY_TOKEN --body "<your-token>"
   gh secret set RAILWAY_PROJECT_ID --body "<your-project-id>"
   gh secret set RAILWAY_SERVICE_NAME --body "<your-service-name>"
   ```

3. **Verify**:
   ```bash
   gh secret list
   # Shows all configured secrets (values are masked)
   ```

---

## Setting Up Secrets

### Step-by-Step: Railway Setup

1. **Get Railway Token**:
   ```bash
   # Visit railway.app → Account Settings
   # Or use Railway CLI:
   railway login
   railway token
   ```

2. **Get Project ID and Service Name**:
   ```bash
   # Via Railway CLI:
   railway list projects
   # Select your project, copy ID (format: project_xxx)
   
   railway list services
   # Copy your Node.js service name
   ```

3. **Add to GitHub**:
   ```bash
   gh secret set RAILWAY_TOKEN --body "<your-token>"
   gh secret set RAILWAY_PROJECT_ID --body "<project_xxx>"
   gh secret set RAILWAY_SERVICE_NAME --body "<nodejs>"
   ```

### Step-by-Step: Heroku Setup

1. **Get Heroku API Key**:
   ```bash
   heroku auth:token
   # Copy the token displayed
   ```

2. **Add to GitHub**:
   ```bash
   gh secret set HEROKU_API_KEY --body "<your-api-key>"
   gh secret set HEROKU_EMAIL --body "your-email@example.com"
   gh secret set HEROKU_APP_NAME --body "trinity-api-gateway-prod"
   ```

### Step-by-Step: Slack Setup (Optional)

1. **Create Slack App**:
   - Visit https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Name: "Trinity Deployments"
   - Workspace: Select your workspace

2. **Enable Incoming Webhooks**:
   - Left sidebar: "Incoming Webhooks"
   - Toggle: On
   - Click "Add New Webhook to Workspace"
   - Select channel: #deployments (or create)
   - Click "Allow"
   - Copy Webhook URL

3. **Add to GitHub**:
   ```bash
   gh secret set SLACK_WEBHOOK_URL --body "<your-webhook-url>"
   ```

---

## Workflow Status Badges

Add to your README.md to show workflow status:

```markdown
## CI/CD Status

[![Tests](https://github.com/your-org/trinity-api-gateway/actions/workflows/test.yml/badge.svg)](https://github.com/your-org/trinity-api-gateway/actions/workflows/test.yml)

[![Deploy](https://github.com/your-org/trinity-api-gateway/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/trinity-api-gateway/actions/workflows/deploy.yml)
```

---

## Monitoring Workflows

### View Workflow Runs

```bash
# List all runs for a workflow
gh run list --workflow=test.yml --limit 10

# View specific run details
gh run view <run-id>

# View run logs
gh run view <run-id> --log

# Watch run in real-time
gh run watch <run-id>
```

### View in GitHub Web

1. Go to Repository → Actions tab
2. Select workflow (Test Suite or Deploy to Production)
3. View recent runs with status (✓ passed, ✗ failed)
4. Click on run to see detailed logs
5. Click on specific job to see step-by-step logs

### Interpret Workflow Status

- ✅ **Success**: All steps completed without errors
- ❌ **Failure**: One or more steps failed
- ⏸️ **Skipped**: Workflow didn't run (e.g., no test changes)
- ⚠️ **Warning**: Steps ran but with warnings (non-blocking)
- 🔄 **In Progress**: Workflow currently executing

---

## Debugging Failed Workflows

### Common Issues and Solutions

#### Tests Fail Locally but Pass in GitHub Actions

```bash
# 1. Check Node.js version mismatch
node --version
# Update .node-version or .nvmrc if needed

# 2. Check environment variables
env | grep TEST_
# Ensure all test vars are set locally

# 3. Run exact test command from workflow
npm ci  # Same as GitHub Actions
npm run test:unit -- --coverage
```

#### Deployment Fails

Check logs in GitHub Actions:

1. **Build Fails**:
   ```bash
   # View build logs in Actions
   # Common issues:
   # - Type errors in TypeScript
   # - Missing dependencies
   # - Incorrect build script
   
   # Fix locally:
   npm run build
   ```

2. **Tests Fail Before Deploy**:
   ```bash
   # Run tests locally
   npm test
   # Fix failing tests before retry
   ```

3. **Railway/Heroku Deploy Fails**:
   ```bash
   # Check Railway logs
   railway logs
   
   # Or Heroku logs
   heroku logs --tail --app trinity-api-gateway-prod
   ```

#### Secret-Related Errors

```
Error: RAILWAY_TOKEN not found
```

Solution:
```bash
# 1. Verify secret exists
gh secret list

# 2. If missing, add it
gh secret set RAILWAY_TOKEN --body "<your-token>"

# 3. Verify token is correct (doesn't show value, only existence)
# Test locally with: railway login
```

---

## Customizing Workflows

### Modify Test Workflow

Edit `.github/workflows/test.yml`:

```yaml
# Change trigger branches
on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main, staging ]

# Add additional test types
- name: Run E2E tests
  run: npm run test:e2e

# Skip tests for certain commits
# In commit message: [skip ci]
```

### Modify Deploy Workflow

Edit `.github/workflows/deploy.yml`:

```yaml
# Change deployment branch
on:
  push:
    branches: [ main ]  # Only deploy main
    
  # Or enable manual trigger
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [ staging, production ]
```

### Add Custom Steps

```yaml
- name: Custom notification
  run: |
    echo "Deployment to ${{ secrets.RAILWAY_PROJECT_ID }} complete"
    
- name: Run database migrations
  run: |
    railway run ./scripts/db-migrate.sh
```

---

## Performance Optimization

### Speed Up Workflows

1. **Use caching**:
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.npm
       key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Parallel jobs**:
   ```yaml
   jobs:
     test:
       runs-on: ubuntu-latest
       strategy:
         matrix:
           node-version: [18.x, 20.x]
   ```

3. **Selective runs**:
   ```yaml
   # Only run on code changes, not docs
   paths:
     - 'src/**'
     - 'tests/**'
     - 'package.json'
   ```

---

## Security Best Practices

1. **Protect Main Branch**:
   - Settings → Branches → Add rule for `main`
   - Require status checks to pass (Tests)
   - Require code reviews
   - Dismiss approvals when new commits pushed

2. **Use Environment Secrets**:
   ```bash
   # Create deployment environment
   # Settings → Environments → New environment
   # Name: production
   # Add required reviewers
   # Add environment-specific secrets
   ```

3. **Audit Secrets**:
   ```bash
   # List all secrets
   gh secret list
   
   # Rotate secrets regularly
   # Don't use same secret for multiple services
   ```

4. **Restrict Deployments**:
   ```yaml
   environment:
     name: production
     url: https://api.trinity-of-luck.com
   ```

---

## Troubleshooting Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Missing dependency | `npm ci` instead of `npm install` |
| `Tests timeout` | Slow services | Increase timeout, check logs |
| `Secret not found` | Not added to GitHub | `gh secret set <name>` |
| `Permission denied` | Wrong token | Verify token has correct scope |
| `Build fails` | TypeScript errors | Run `npm run build` locally |
| `Deployment fails` | Database migration error | Check database connection |

---

## Advanced Topics

### Matrix Builds

Test against multiple Node versions:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]

- uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
```

### Conditional Steps

```yaml
- name: Notify on failure
  if: failure()
  run: |
    echo "Workflow failed!"
    # Send alert, create issue, etc.
```

### Artifacts

```yaml
- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: coverage/
    retention-days: 30
```

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Support**: https://docs.github.com/en/actions

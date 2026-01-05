# 🔧 Heroku Setup Guide for Trinity API Gateway

## Quick Start (10 minutes)

### Prerequisites
- GitHub account
- Heroku account (sign up at heroku.com)
- Heroku CLI installed (`brew install heroku` or download)
- Credit card for production apps (free tier being phased out)

### Step-by-Step Setup

#### 1. Install Heroku CLI

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows:**
- Download from: https://devcenter.heroku.com/articles/heroku-cli
- Or use Chocolatey: `choco install heroku-cli`

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 2. Create Heroku Application

```bash
# Login to Heroku
heroku login
# This opens browser for authentication

# Create application
heroku create trinity-api-gateway-prod

# Verify remote was added
git remote -v
# Should show: heroku  https://git.heroku.com/trinity-api-gateway-prod.git
```

#### 3. Set Buildpack

```bash
# Heroku needs to know this is a Node.js app
heroku buildpacks:add heroku/nodejs

# Verify
heroku buildpacks
# Output: heroku/nodejs
```

#### 4. Create Database (PostgreSQL)

```bash
# Add PostgreSQL service
heroku addons:create heroku-postgresql:standard-0

# This automatically sets DATABASE_URL environment variable
# Verify:
heroku config | grep DATABASE_URL
```

**Plan Options:**
- `heroku-postgresql:mini` - $25/month (2GB)
- `heroku-postgresql:standard-0` - $50/month (10GB)
- `heroku-postgresql:standard-2` - $200/month (64GB)

#### 5. Create Redis Cache

```bash
# Add Redis service
heroku addons:create heroku-redis:premium-0

# This automatically sets REDIS_URL environment variable
# Verify:
heroku config | grep REDIS_URL
```

**Plan Options:**
- `heroku-redis:premium-0` - $30/month
- `heroku-redis:premium-1` - $125/month (larger)

#### 6. Configure Environment Variables

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=3001

# Add Supabase credentials
heroku config:set SUPABASE_URL=https://your-project.supabase.co
heroku config:set SUPABASE_ANON_KEY=your-key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-key

# Add Stripe (use LIVE keys, not test)
heroku config:set STRIPE_SECRET_KEY=sk_live_your_key
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_your_key
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_key

# Add security & auth
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_EXPIRY=7d
heroku config:set INTERNAL_API_KEY=$(openssl rand -base64 32)

# Add monitoring
heroku config:set SENTRY_DSN=https://your-sentry-dsn
heroku config:set SENTRY_ENVIRONMENT=production

# Add email service
heroku config:set EMAIL_SERVICE=sendgrid
heroku config:set SENDGRID_API_KEY=SG.your-key
heroku config:set EMAIL_FROM=noreply@trinity-of-luck.com

# Add other variables
heroku config:set CORS_ORIGIN=https://your-domain.com
heroku config:set RATE_LIMIT_MAX_REQUESTS=100
heroku config:set LOG_LEVEL=info
heroku config:set HTTPS_REQUIRED=true
heroku config:set HELMET_ENABLED=true

# Verify all variables
heroku config
```

#### 7. Configure Procfile

Your `Procfile` should be:

```
web: npm run build && npm start
```

Ensure `package.json` has correct scripts:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc && npm run copy-assets",
    "dev": "ts-node src/index.ts"
  }
}
```

#### 8. Deploy

```bash
# Push to Heroku (from main branch)
git push heroku main

# Watch deployment logs
heroku logs --tail

# Expected output:
# -----> Building on the Heroku platform
# -----> Node.js app detected
# -----> Installing dependencies
# -----> Building
# -----> Launching... done
```

#### 9. Run Database Migrations

```bash
# Execute migration script on Heroku
heroku run ./scripts/db-migrate.sh

# Or run Prisma migrations
heroku run npx prisma migrate deploy

# Or use Knex
heroku run npx knex migrate:latest
```

#### 10. Verify Deployment

```bash
# Test application
curl https://trinity-api-gateway-prod.herokuapp.com/health

# View logs
heroku logs --tail

# Check dyno status
heroku ps
# Should show: web: up
```

---

## Advanced Configuration

### Custom Domain

1. **Add Domain**:
```bash
heroku domains:add api.trinity-of-luck.com
```

2. **Configure DNS**:
```
# In your DNS provider (GoDaddy, Route53, etc.)
api.trinity-of-luck.com CNAME trinity-api-gateway-prod.herokuapp.com
```

3. **Verify SSL Certificate**:
```bash
# Heroku automatically provides free SSL (Let's Encrypt)
heroku ssl:info
```

4. **Force HTTPS**:
```bash
heroku config:set HTTPS_REQUIRED=true
```

### Staging Environment

Create separate Heroku app for staging:

```bash
# Create staging app
heroku create trinity-api-gateway-staging

# Set different configuration
heroku config:set NODE_ENV=staging --remote heroku-staging

# Deploy from develop branch
git push heroku-staging develop:main
```

### Procfile Processes

Add worker process for background jobs:

```
web: npm run build && npm start
worker: npm run worker
```

Then scale worker:

```bash
heroku ps:scale web=1 worker=1
```

### Dyno Types

```bash
# View current dyno type
heroku ps

# Scale up (more CPU/RAM)
heroku ps:resize web=standard-1x  # $25/month
heroku ps:resize web=standard-2x  # $50/month
heroku ps:resize web=performance-m # $250/month

# Scale down
heroku ps:resize web=eco  # $5/month (shared resources)
```

### Environment-Specific Builds

Optimize build for production:

```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "build": "NODE_ENV=production tsc && npm run copy-assets",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### Data Management

#### Backup Database
```bash
# Create backup
heroku pg:backups:capture

# List backups
heroku pg:backups

# Download backup
heroku pg:backups:download

# Restore from backup
heroku pg:backups:restore b001 DATABASE
```

#### Database Console
```bash
# Connect to database
heroku pg:psql

# Inside psql console
SELECT * FROM users;
\dt  # List all tables
\q   # Exit
```

#### Reset Database
```bash
# CAUTION: Deletes all data!
heroku pg:reset --confirm trinity-api-gateway-prod
```

### Monitoring

#### Logs

```bash
# Real-time logs
heroku logs --tail

# View specific dyno logs
heroku logs --source app --tail

# View last N lines
heroku logs --num 100

# View for specific date
heroku logs --since 10h ago
```

#### Metrics

```bash
# View dyno metrics
heroku metrics

# Check memory usage
heroku ps:exec
# Then: free -h

# View response times
# Visit: https://dashboard.heroku.com/apps/trinity-api-gateway-prod/logs
```

#### New Relic Monitoring (Optional)

```bash
# Add New Relic addon
heroku addons:create newrelic:wayne

# This adds NEW_RELIC_LICENSE_KEY automatically

# View in New Relic dashboard
# Visit: https://rpm.newrelic.com
```

### Continuous Deployment

#### GitHub Integration

```bash
# In Heroku Dashboard:
1. Go to Deploy tab
2. Select GitHub as deployment method
3. Search for your repository
4. Click Connect
5. Select main branch for automatic deploys
6. Enable "Wait for CI to pass before deploy"
```

#### GitHub Secrets for Manual Deploy

Create secrets in GitHub for use in Actions:

```yaml
# In .github/workflows/deploy.yml

- name: Deploy to Heroku
  env:
    HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
    HEROKU_APP_NAME: trinity-api-gateway-prod
  run: |
    npm install -g heroku
    echo $HEROKU_API_KEY | heroku auth:login
    heroku ps:scale web=1 --app $HEROKU_APP_NAME
    git push https://git.heroku.com/$HEROKU_APP_NAME.git main
```

### Cost Optimization

```bash
# View current add-ons and costs
heroku addons

# Remove expensive add-ons
heroku addons:destroy heroku-postgresql:standard-0 --confirm

# Use lower tier database
heroku addons:create heroku-postgresql:mini

# Scale down web dyno
heroku ps:resize web=eco

# Use Procfile to combine processes
# Avoid running unnecessary workers
```

### Troubleshooting

#### Application Crashes

```bash
# 1. Check logs
heroku logs --tail

# 2. Verify all env vars are set
heroku config

# 3. Check Node.js version
cat .nvmrc
# Update if needed: heroku config:set NODE_VERSION=18.0.0

# 4. Test locally
npm install
npm run build
npm start

# 5. Restart app
heroku restart
```

#### Build Fails

```bash
# 1. Check build logs
heroku logs --source api

# 2. Clear build cache
heroku buildpacks:clear
heroku buildpacks:add heroku/nodejs

# 3. Remove node_modules locally and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# 4. Push again
git add .
git commit -m "Fix build"
git push heroku main
```

#### Dyno Memory Issues

```bash
# View memory usage
heroku ps:exec
free -h

# If using too much memory:
# 1. Check for memory leaks
# 2. Reduce caching
# 3. Increase dyno size
heroku ps:resize web=standard-1x

# Monitor with New Relic
heroku addons:create newrelic:wayne
```

#### Database Connection Pool Issues

```bash
# Check pool size
heroku config | grep DATABASE

# Adjust pool size in connection string
heroku config:set DATABASE_CONNECTION_POOL_SIZE=20

# Increase PostgreSQL plan if too many connections
# Max connections = $50/month: 120
# Max connections = $200/month: 500
```

#### Webhook Failures

```bash
# Heroku apps are public
# Stripe webhooks should work automatically

# If webhooks fail:
1. Check endpoint in Stripe dashboard
2. Verify custom domain is set up correctly
3. Test webhook signing:
   heroku config | grep STRIPE_WEBHOOK_SECRET
4. Check logs: heroku logs --tail
```

---

## Comparison with Other Platforms

| Feature | Heroku | Railway | Fly.io | AWS |
|---------|--------|---------|--------|-----|
| **Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Cost (Production)** | ~$70/mo | ~$10/mo | ~$20/mo | ~$50/mo |
| **Free Tier** | Limited | $5/mo | $3/mo | 12 months |
| **Database Included** | ✓ PostgreSQL | ✓ PostgreSQL | ✗ | ✗ |
| **Redis Included** | ✓ (Add-on) | ✓ (Add-on) | ✗ | ✗ |
| **Scaling** | Vertical only | Vertical + Horizontal | Full | Full |
| **Region Selection** | Limited | Good | Excellent | Excellent |
| **Customer Support** | Excellent | Good | Good | Basic |
| **Learning Curve** | Easy | Easy | Moderate | Steep |

---

## Heroku vs Railway Recommendation

### Choose Heroku if:
- You want the simplest setup
- You prefer established platform with extensive docs
- You need excellent customer support
- You're willing to pay premium for convenience
- You need specific add-ons (SendGrid, etc.)

### Choose Railway if:
- You want lower costs
- You prefer modern DevOps experience
- You want GitHub-native workflow
- You value transparent pricing
- You want to learn modern deployment

---

## Success Checklist

- [ ] Heroku CLI installed and logged in
- [ ] Heroku app created
- [ ] Git remote added (git remote -v shows heroku)
- [ ] Node.js buildpack configured
- [ ] PostgreSQL add-on created and DATABASE_URL set
- [ ] Redis add-on created and REDIS_URL set
- [ ] All environment variables configured
- [ ] Procfile validated
- [ ] Application deployed (git push heroku main)
- [ ] Migrations ran successfully
- [ ] Health endpoint responds
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Team members invited

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Support**: https://devcenter.heroku.com

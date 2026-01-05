# 🚄 Railway.app Setup Guide for Trinity API Gateway

## Quick Start (5 minutes)

### Prerequisites
- GitHub account with repository access
- Railway.app account (sign up at railway.app)
- PostgreSQL and Redis services available

### Step-by-Step Setup

#### 1. Connect Repository
```bash
1. Go to railway.app dashboard
2. Click "Create a new project"
3. Select "Deploy from GitHub"
4. Authorize GitHub and select your repository
5. Railway automatically detects Node.js and starts building
```

#### 2. Add PostgreSQL Service
```bash
1. Click "Add a Service"
2. Select "PostgreSQL"
3. Confirm to add to project
4. Copy DATABASE_URL from Variables tab
```

#### 3. Add Redis Service
```bash
1. Click "Add a Service"
2. Select "Redis"
3. Confirm to add to project
4. Copy REDIS_URL from Variables tab
```

#### 4. Configure Node.js Service

In Railway Dashboard → Select your Node.js service:

**Variables Tab** - Add all from `.env.example`:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<copy from PostgreSQL service>
REDIS_URL=<copy from Redis service>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-key-here
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key
JWT_SECRET=<generate: openssl rand -base64 32>
JWT_EXPIRY=7d
INTERNAL_API_KEY=<generate secure key>
SENTRY_DSN=https://your-sentry-dsn
CORS_ORIGIN=https://your-domain.com
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your-key
EMAIL_FROM=noreply@trinity-of-luck.com
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
HTTPS_REQUIRED=true
HELMET_ENABLED=true
```

#### 5. Configure Build & Start

Ensure your `package.json` has correct scripts:

```json
{
  "scripts": {
    "build": "tsc && npm run copy-assets",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  }
}
```

#### 6. Deploy

Push to main branch:
```bash
git push origin main
```

Railway automatically:
1. Installs dependencies (`npm ci`)
2. Runs build script
3. Deploys to production
4. Starts application

---

## Advanced Configuration

### Domain Setup

1. **Custom Domain**:
   ```bash
   # In Railway Dashboard → Settings → Domains
   # Add your custom domain
   # Railway provides SSL certificate automatically (Let's Encrypt)
   
   # Point your DNS to:
   # your-api.trinity-of-luck.com CNAME your-railway-domain.railway.app
   ```

2. **View Deployment URL**:
   ```bash
   # Railway assigns URL like:
   # https://trinity-api-railway-prod.up.railway.app
   # Accessible immediately after successful deployment
   ```

### Environment Management

#### Staging Environment

Create a separate Railway project for staging:

```bash
1. Create new Railway project
2. Connect same GitHub repository
3. Set up PostgreSQL and Redis (separate from production)
4. Set environment variables with staging values
5. Deploy from develop branch instead of main
```

Configure GitHub Actions to deploy different branches:

```yaml
# In .github/workflows/deploy.yml
on:
  push:
    branches:
      - main      # Deploy to production
      - develop   # Deploy to staging
```

#### Secrets Management

Use Railway's built-in secrets:

```bash
# In Railway Variables tab:
# Add sensitive variables as secrets (marked with lock icon)
# These are masked in logs and never displayed
```

### Database Migrations

Run migrations automatically on deployment:

Add to `Procfile`:
```bash
web: ./scripts/db-migrate.sh && npm start
```

Or in `server.ts` startup:
```typescript
import { execSync } from 'child_process';

async function runMigrationsOnStartup() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Running database migrations...');
    try {
      execSync('./scripts/db-migrate.sh', { stdio: 'inherit' });
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
}
```

### Health Checks

Configure Railway health checks:

1. **In Railway Dashboard → Settings → Health Check**:
   ```
   URL: /health
   Type: HTTP
   Interval: 30s
   Timeout: 5s
   ```

2. **Implement health endpoint** in server:
   ```typescript
   app.get('/health', async (req, res) => {
     const health = {
       status: 'healthy',
       timestamp: new Date().toISOString(),
       database: 'connected',
       redis: 'connected'
     };
     
     try {
       // Quick database check
       await db.query('SELECT NOW()');
       
       // Quick Redis check
       await redis.ping();
       
       res.json(health);
     } catch (error) {
       health.status = 'unhealthy';
       res.status(503).json(health);
     }
   });
   ```

### Restart and Redeploy

#### Restart Service
```bash
# In Railway Dashboard:
# Service → Top right menu → Restart
# This restarts the application without redeploying
```

#### Force Redeploy
```bash
# Option 1: Push new commit to main
git commit --allow-empty -m "Force redeploy"
git push origin main

# Option 2: Manual redeploy in dashboard
# Deployments → Latest deployment → Redeploy
```

### Monitoring & Logs

#### View Application Logs
```bash
# In Railway Dashboard → Service → Logs
# Real-time streaming of stdout/stderr
# Search and filter by log level
```

#### Export Logs
```bash
# Railway CLI
# Install: npm install -g @railway/cli
# Login: railway login
# View logs: railway logs --tail
```

#### Log Levels
```
ERROR   # Critical errors requiring attention
WARN    # Warning messages, potential issues
INFO    # General information, deployments
DEBUG   # Detailed debugging information
TRACE   # Very detailed trace information
```

Set in environment:
```bash
LOG_LEVEL=info  # Production
LOG_LEVEL=debug # Development
```

### Database Backup

#### Automated Backups
```bash
# Railway PostgreSQL includes automatic backups
# Accessible in Railway Dashboard → PostgreSQL service

# View backups:
# Service → Backups tab
```

#### Manual Backup
```bash
# Download backup from Railway dashboard
# Or use pg_dump locally:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

#### Restore Backup
```bash
# Contact Railway support for restore operations
# Or restore locally:
psql $DATABASE_URL < backup-20240115.sql
```

### Scaling & Performance

#### Vertical Scaling (Increase Resources)
```bash
# In Railway Dashboard → Service Settings
# Increase CPU and Memory allocation
# Default: 0.5 CPU, 512 MB RAM
# Maximum: 8 CPU, 32 GB RAM
```

#### Horizontal Scaling (Multiple Instances)
```bash
# Currently not available on Railway's free tier
# Available on Railway's pay-as-you-go plan
# Configure in Service → Deployment settings
```

#### Resource Monitoring
```bash
# In Railway Dashboard → Metrics
# Monitor CPU, Memory, Network usage
# Set up alerts for high usage
```

### Troubleshooting

#### Build Fails
```bash
# 1. Check build logs in Railway Dashboard
# 2. Verify package.json build script is valid
# 3. Test build locally:
npm run build

# 4. Check for large dependencies or build issues
npm ls --depth=0
```

#### Runtime Crashes
```bash
# 1. View application logs
# 2. Check error messages
# 3. Ensure all environment variables are set
# 4. Verify database connection
# 5. Restart service and redeploy
```

#### Database Connection Issues
```bash
# 1. Verify DATABASE_URL is set
# 2. Test connection from Railway CLI:
railway run psql $DATABASE_URL -c "SELECT NOW();"

# 3. Check SSL mode (should be require for production)
# 4. Verify database is running and accessible
```

#### High Memory Usage
```bash
# 1. Check application logs for memory leaks
# 2. Implement proper connection pooling
# 3. Review large objects or caches
# 4. Increase allocated memory in Service Settings
```

#### Deployment Timeout
```bash
# 1. Optimize build process
# 2. Reduce number of dependencies
# 3. Use npm ci instead of npm install
# 4. Check for large files or slow builds
```

---

## GitHub Actions Integration with Railway

### Automatic Deployment on Push

Configure in `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Railway
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      run: |
        npm install -g @railway/cli
        railway link --projectId ${{ secrets.RAILWAY_PROJECT_ID }}
        railway up --service ${{ secrets.RAILWAY_SERVICE_NAME }}
```

### GitHub Secrets Configuration

Set these in GitHub → Settings → Secrets:

```bash
RAILWAY_TOKEN          # From railway.app → Account settings → API Token
RAILWAY_PROJECT_ID     # From railway.app → Project settings
RAILWAY_SERVICE_NAME   # Your Node.js service name
```

Get these values:

```bash
# Via Railway CLI:
railway login
railway list projects
railway project select <your-project>
railway list services
```

---

## Comparison: Railway vs Heroku vs Custom VPS

| Feature | Railway | Heroku | Custom VPS |
|---------|---------|--------|-----------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Cost** | $5/month | $7/month | $5+/month |
| **Auto Scaling** | ✓ (Paid) | ✓ (Paid) | ✗ |
| **Database Included** | ✓ (PostgreSQL) | ✓ (PostgreSQL) | ✗ |
| **Redis Included** | ✓ (Redis) | ✗ | ✗ |
| **Custom Domain** | ✓ | ✓ | ✓ |
| **GitHub Integration** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✗ |
| **Monitoring** | Basic | Datadog | DIY |
| **Support** | Good | Good | None |
| **Recommended** | ✓ | Alternative | Advanced |

---

## Cost Optimization

### Railway Free Tier
- $5/month credit
- Good for small projects and staging

### Pay-as-You-Go
- Node.js: $0.05/CPU hour, $0.02/GB-hour
- PostgreSQL: $0.03/GB month + $0.25/GB backup
- Redis: $0.03/GB month
- Typical: $10-30/month for production

### Reducing Costs
1. Consolidate services (use smaller instances)
2. Remove unused services
3. Implement caching to reduce database queries
4. Use staging environment sparingly
5. Monitor resource usage regularly

---

## Success Checklist

- [ ] Repository connected to Railway
- [ ] PostgreSQL service created and connected
- [ ] Redis service created and connected
- [ ] All environment variables configured
- [ ] Database migrations running on startup
- [ ] Health endpoint responding (GET /health)
- [ ] Application logs visible in Railway dashboard
- [ ] GitHub Actions deploying automatically
- [ ] Custom domain configured (optional)
- [ ] Backups configured
- [ ] Monitoring and alerts set up
- [ ] Team members have access
- [ ] Documentation updated

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Support**: https://docs.railway.app

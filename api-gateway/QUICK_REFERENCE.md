# 📇 Trinity API Gateway - Quick Reference Card

## 🚀 Quick Deployment Commands

### First-Time Setup (Railway)

```bash
# 1. Add GitHub Secrets
gh secret set RAILWAY_TOKEN --body "$(railway token)"
gh secret set RAILWAY_PROJECT_ID --body "project_xxxxx"
gh secret set RAILWAY_SERVICE_NAME --body "nodejs"

# 2. Configure environment in Railway Dashboard
# Dashboard → Variables tab → Add all from .env.example

# 3. Deploy (automatic on push to main)
git push origin main

# 4. Monitor
gh run watch
```

### First-Time Setup (Heroku)

```bash
# 1. Create app
heroku create trinity-api-gateway-prod

# 2. Add services
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0

# 3. Set environment
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
# ... other variables

# 4. Deploy
git push heroku main

# 5. Migrate database
heroku run ./scripts/db-migrate.sh
```

---

## 📊 Environment Variables Checklist

### Required for Production
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=postgresql://...`
- [ ] `REDIS_URL=redis://...`
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY` (LIVE, not TEST)
- [ ] `JWT_SECRET` (generated with: `openssl rand -base64 32`)
- [ ] `SENDGRID_API_KEY` or SMTP credentials
- [ ] `SENTRY_DSN` (for error tracking)

### Optional
- [ ] `SLACK_WEBHOOK_URL` (for deploy notifications)
- [ ] `DATADOG_ENABLED` (for APM monitoring)
- [ ] `CORS_ORIGIN` (comma-separated allowed domains)

---

## 🔍 Monitoring Endpoints

### Health Check
```bash
curl https://api.trinity-of-luck.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### View Logs
```bash
# Railway
railway logs --tail

# Heroku
heroku logs --tail --app trinity-api-gateway-prod

# GitHub Actions
gh run list --workflow=deploy.yml
gh run view <run-id> --log
```

---

## 🛠️ Common Tasks

### Deploy Current Branch
```bash
# Automatic on push to main
git push origin main

# Or manual trigger
gh workflow run deploy.yml -r main
```

### Rollback to Previous Version
```bash
# Railway
# Dashboard → Deployments → Select previous → Rollback

# Heroku
heroku releases
heroku rollback v123

# Git
git revert <commit-hash>
git push origin main
```

### Run Database Migrations
```bash
# Railway
railway run ./scripts/db-migrate.sh

# Heroku
heroku run ./scripts/db-migrate.sh

# Local
./scripts/db-migrate.sh
```

### View Secrets
```bash
# List all GitHub Secrets
gh secret list

# Add new secret
gh secret set VARIABLE_NAME --body "value"

# Heroku config
heroku config

# Railway variables
# Dashboard → Variables tab
```

### Update Database
```bash
# Connect to production database
psql $DATABASE_URL

# Common commands
\dt                    # List tables
\d users              # Show table schema
SELECT COUNT(*) FROM users;
\q                    # Exit
```

---

## 🐛 Debugging

### Check Test Results
```bash
# View test run
gh run list --workflow=test.yml
gh run view <run-id> --log

# Run tests locally
npm test
npm run test:unit
npm run test:integration
```

### Check Build Logs
```bash
# GitHub Actions
gh run view <run-id> --log

# Railway
railway logs

# Heroku
heroku logs --source app --tail
```

### Check Application Errors
```bash
# Sentry Dashboard
https://sentry.io/

# Railway logs
railway logs --tail

# Heroku logs
heroku logs --tail --app trinity-api-gateway-prod
```

### Database Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check connection pool
SELECT * FROM pg_stat_activity;

# View slow queries
SELECT * FROM pg_stat_statements;
```

---

## 📋 Pre-Deployment Checklist

- [ ] Tests passing locally: `npm test`
- [ ] No hardcoded secrets in code
- [ ] No console.log in production code
- [ ] All environment variables set
- [ ] Database backup created
- [ ] Health endpoint working
- [ ] Slack webhook configured (optional)
- [ ] Team informed of deployment

---

## 🚨 Emergency Procedures

### Application Down
```bash
# 1. Check logs
railway logs  # or heroku logs --tail

# 2. Check health endpoint
curl https://api.trinity-of-luck.com/health

# 3. Restart application
# Railway: Dashboard → Service → Restart
# Heroku: heroku restart

# 4. If still down, rollback
# See "Rollback to Previous Version" above
```

### Database Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# If timeout, likely overloaded:
# 1. Check active connections
SELECT COUNT(*) FROM pg_stat_activity;

# 2. Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '5 minutes';

# 3. Scale database up if needed
```

### High Memory Usage
```bash
# Railway: Dashboard → Service Settings → Increase memory
# Heroku: heroku ps:resize web=standard-2x

# Or check for memory leaks
# Review logs for error messages
# Restart service: railway restart (or heroku restart)
```

---

## 📞 Support Resources

### Documentation
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Railway Setup**: [RAILWAY_SETUP.md](RAILWAY_SETUP.md)
- **Heroku Setup**: [HEROKU_SETUP.md](HEROKU_SETUP.md)
- **GitHub Actions**: [GITHUB_ACTIONS_GUIDE.md](GITHUB_ACTIONS_GUIDE.md)

### External Resources
- **Railway Docs**: https://docs.railway.app
- **Heroku Dev Center**: https://devcenter.heroku.com
- **GitHub Actions**: https://docs.github.com/en/actions
- **Node.js Best Practices**: https://nodejs.org/en/docs/

### Contact
- **Slack**: #deployment channel
- **GitHub Issues**: Create issue in repository
- **Team Lead**: Contact Trinity Development Team

---

## 🎯 Key File Locations

```
Deployment Configs:
  .env.example              # All variables template
  .env.production           # Production setup guide
  Procfile                  # Deployment process

CI/CD Workflows:
  .github/workflows/test.yml       # Test automation
  .github/workflows/deploy.yml     # Deploy automation

Build Scripts:
  scripts/build.sh          # Production build
  scripts/db-migrate.sh     # Database migrations

Documentation:
  DEPLOYMENT_GUIDE.md       # Full deployment guide
  RAILWAY_SETUP.md          # Railway.app guide
  HEROKU_SETUP.md           # Heroku guide
  GITHUB_ACTIONS_GUIDE.md   # CI/CD guide
```

---

## 📈 Performance Tips

### Optimize API Response Time
```bash
# Enable compression
COMPRESSION_ENABLED=true

# Implement Redis caching
# Configure cache TTL appropriately

# Monitor response times
# Sentry → Performance tab
```

### Reduce Database Load
```bash
# Add database indexes
CREATE INDEX idx_users_email ON users(email);

# Use connection pooling
DATABASE_POOL_SIZE=20

# Implement query optimization
SELECT * FROM users;  -- Bad
SELECT id, name FROM users WHERE active=true;  -- Good
```

### Manage Memory
```bash
# Monitor memory usage
heroku ps  # or Railway logs

# Reduce cache size if needed
# Review large data structures

# Increase memory allocation if needed
heroku ps:resize web=standard-2x  # or scale in Railway
```

---

## 🔐 Security Reminders

1. **Never commit .env files**
   ```bash
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Rotate secrets regularly**
   ```bash
   # Generate new JWT secret
   openssl rand -base64 32
   
   # Update in secrets manager
   gh secret set JWT_SECRET --body "new-value"
   ```

3. **Use HTTPS only**
   ```bash
   HTTPS_REQUIRED=true
   ```

4. **Validate all inputs**
   - Never trust user input
   - Use validation schemas
   - Sanitize before database operations

5. **Review logs regularly**
   - Check for suspicious activity
   - Monitor failed authentication attempts
   - Review error patterns

---

## 📊 Useful Commands Summary

| Task | Command |
|------|---------|
| Deploy | `git push origin main` |
| View logs | `railway logs --tail` |
| SSH to app | `railway run bash` |
| Restart | `railway restart` |
| Scale | Railway Dashboard or `heroku ps:resize` |
| Config | `heroku config` or Railway Dashboard |
| Rollback | `heroku rollback` or Railway Dashboard |
| Tests | `npm test` |
| Build | `npm run build` |
| Migrate DB | `./scripts/db-migrate.sh` |

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Status**: Production Ready

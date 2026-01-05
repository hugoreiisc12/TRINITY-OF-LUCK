# 🐳 Docker Quick Commands Reference

**Date:** January 4, 2026 | **Status:** Production Ready

---

## 🚀 Quick Start

### Build and Start All Services

```bash
# Build images
docker-compose build

# Start services (detached)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 📊 Service Management

### Start/Stop Individual Services

```bash
# Start API Gateway only
docker-compose up -d api-gateway

# Stop API Gateway
docker-compose stop api-gateway

# Restart API Gateway
docker-compose restart api-gateway

# Remove and recreate
docker-compose up -d --force-recreate api-gateway
```

### View Logs

```bash
# API Gateway logs
docker-compose logs -f api-gateway

# Redis logs
docker-compose logs -f redis

# PostgreSQL logs
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 api-gateway

# Last 5 minutes
docker-compose logs --since 5m api-gateway
```

---

## 🔍 Debugging

### Execute Commands in Container

```bash
# Execute command in running container
docker-compose exec api-gateway npm run dev

# Get shell access
docker-compose exec api-gateway sh

# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d trinity

# Redis CLI
docker-compose exec redis redis-cli -a redis123
```

### Inspect Container

```bash
# Container stats
docker-compose stats

# Detailed info
docker inspect trinity-api-gateway

# Container processes
docker top trinity-api-gateway
```

---

## 🧹 Cleanup

### Remove Resources

```bash
# Remove containers but keep volumes
docker-compose down

# Remove everything including volumes
docker-compose down -v

# Remove dangling images
docker image prune

# Remove all unused resources
docker system prune -a

# Force remove image
docker rmi trinity-api-gateway:latest
```

---

## 🔧 Build Options

### Build with No Cache

```bash
docker-compose build --no-cache
```

### Build Specific Service

```bash
docker-compose build api-gateway
```

### Build with Build Args

```bash
docker-compose build --build-arg NODE_ENV=production api-gateway
```

---

## 📝 Environment & Configuration

### View Environment Variables

```bash
docker-compose config
```

### Override Environment

```bash
docker-compose run -e NODE_ENV=development api-gateway npm run dev
```

### Use Different Compose File

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🌐 Network Management

### List Networks

```bash
docker network ls
```

### Inspect Network

```bash
docker network inspect trinity-network
```

### Test Container Connectivity

```bash
docker-compose exec api-gateway ping redis
docker-compose exec api-gateway ping postgres
```

---

## 💾 Volume Management

### List Volumes

```bash
docker volume ls
```

### Inspect Volume

```bash
docker volume inspect trinity-postgres_data
```

### Backup Database Volume

```bash
docker run --rm -v trinity-postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

### Restore Database Volume

```bash
docker run --rm -v trinity-postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

---

## 📈 Performance & Monitoring

### Monitor Resource Usage

```bash
# Continuous monitoring
docker-compose stats

# Specific container
docker stats trinity-api-gateway

# Memory usage
docker-compose stats --no-stream
```

### Check Container Health

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### View Container Processes

```bash
docker top trinity-api-gateway
```

---

## 🔐 Security & Access

### View Running Services

```bash
docker-compose ps
```

### Check Port Mappings

```bash
docker port trinity-api-gateway
```

### Test API Health

```bash
curl http://localhost:3001/health

curl http://localhost:3001/api/health

curl http://localhost:3001/api/queue/stats
```

---

## 🚨 Troubleshooting Commands

### Container Won't Start

```bash
# Check logs
docker-compose logs api-gateway

# Check for port conflicts
netstat -ano | findstr 3001

# Try rebuild
docker-compose build --no-cache api-gateway
```

### Out of Memory

```bash
# Check Docker memory
docker system df

# Remove unused resources
docker system prune -a --volumes
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres

# View database logs
docker-compose logs postgres
```

### Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli -a redis123 ping

# View Redis logs
docker-compose logs redis
```

---

## 🔄 Updates & Upgrades

### Pull Latest Images

```bash
# Update base images
docker-compose pull

# Rebuild with latest
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### Update Service

```bash
# Rebuild and restart
docker-compose up -d --build api-gateway
```

---

## 📦 Docker Hub Operations

### Build for Registry

```bash
# Build with registry tag
docker build -t myregistry/trinity-api-gateway:1.0.0 .

# Push to registry
docker push myregistry/trinity-api-gateway:1.0.0

# Pull from registry
docker pull myregistry/trinity-api-gateway:1.0.0
```

---

## 📊 Advanced Operations

### Copy Files Between Host and Container

```bash
# Copy from host to container
docker cp ./myfile.txt trinity-api-gateway:/app/

# Copy from container to host
docker cp trinity-api-gateway:/app/logs ./logs
```

### Run One-off Commands

```bash
# Run command without keeping container
docker-compose run --rm api-gateway npm test

# Run with custom environment
docker-compose run --rm -e DEBUG=true api-gateway npm run dev
```

### Database Operations

```bash
# Create database backup
docker-compose exec postgres pg_dump -U postgres trinity > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres trinity < backup.sql

# Connect to database
docker-compose exec postgres psql -U postgres -d trinity
```

---

## 🎯 Common Workflows

### Complete Fresh Start

```bash
# 1. Stop and remove everything
docker-compose down -v

# 2. Build fresh
docker-compose build --no-cache

# 3. Start services
docker-compose up -d

# 4. Check health
docker-compose exec api-gateway curl http://localhost:3001/health

# 5. View logs
docker-compose logs -f api-gateway
```

### Deploy Updates

```bash
# 1. Pull latest code (from git)
git pull origin main

# 2. Rebuild images
docker-compose build --no-cache

# 3. Stop old containers
docker-compose down

# 4. Start new services
docker-compose up -d

# 5. Verify deployment
docker-compose ps
docker-compose logs api-gateway
```

### Scale API Gateway

```bash
# Scale to 3 instances
docker-compose up -d --scale api-gateway=3

# View all instances
docker-compose ps
```

---

## 📚 Useful Aliases

Create these aliases in your `.bashrc` or `.zshrc`:

```bash
# Docker Compose aliases
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcexec='docker-compose exec'
alias dcbuild='docker-compose build'

# Usage examples
dc ps
dcup
dclogs api-gateway
dcexec api-gateway sh
```

---

## 🔗 Useful Links

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices)
- [Docker Security](https://docs.docker.com/engine/security)

---

**Last Updated:** January 4, 2026  
**Status:** Production Ready  
**Version:** 1.0.0

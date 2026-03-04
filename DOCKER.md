# LogLens Docker Guide

This guide provides detailed information about running LogLens with Docker.

## Quick Start

```bash
# Start all services
./docker.sh start

# Or using docker-compose directly
docker-compose up -d
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web (3000)    │────▶│   API (4000)    │────▶│  PostgreSQL     │
│   Next.js       │     │   NestJS        │     │  (5432)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

All services run in isolated containers on a private Docker network.

## Services

| Service | Port | Description |
|---------|------|-------------|
| web | 3000 | Next.js frontend application |
| api | 4000 | NestJS backend API |
| db | 5432 | PostgreSQL database |

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Key variables:

```env
# Database
POSTGRES_USER=loglens
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=loglens
DB_PORT=5432

# API
API_PORT=4000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_SERVER=http://localhost:4000
```

### Changing Ports

Edit `.env` to change exposed ports:

```env
DB_PORT=5433      # Database port
API_PORT=4001     # API port
WEB_PORT=3001     # Web port
```

## Common Operations

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start and view logs
docker-compose up

# Start specific service
docker-compose up -d api
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f db
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 api
```

### Rebuilding

```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Database Operations

```bash
# Run migrations
docker-compose exec api pnpm prisma:migrate:deploy

# Seed database
docker-compose exec api pnpm prisma:seed

# Reset database
docker-compose exec api pnpm prisma:migrate:reset

# Open Prisma Studio
docker-compose exec api pnpm prisma:studio

# Connect to PostgreSQL
docker-compose exec db psql -U loglens -d loglens

# Backup database
docker-compose exec db pg_dump -U loglens loglens > backup.sql

# Restore database
docker-compose exec -T db psql -U loglens loglens < backup.sql
```

### Accessing Containers

```bash
# API shell
docker-compose exec api sh

# Web shell
docker-compose exec web sh

# Database shell
docker-compose exec db sh

# Execute command
docker-compose exec api node -v
```

## Troubleshooting

### Service Won't Start

1. Check logs:
```bash
docker-compose logs api
```

2. Verify database is healthy:
```bash
docker-compose ps
```

3. Check container configuration:
```bash
docker-compose config
```

### Database Connection Errors

The API connects to the database using the internal Docker network hostname `db`, not `localhost`.

**Correct (Docker):**
```
DATABASE_URL=postgresql://user:password@db:5432/dbname
```

**Correct (Local):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Port Already in Use

If you get "port already allocated" errors:

1. Find the process using the port:
```bash
lsof -i :3000
```

2. Or change the port in `.env`:
```env
WEB_PORT=3001
API_PORT=4001
DB_PORT=5433
```

3. Restart:
```bash
docker-compose down
docker-compose up -d
```

### Build Fails

1. Clear Docker cache:
```bash
docker-compose build --no-cache
```

2. Remove old containers:
```bash
docker-compose down -v
docker system prune -f
```

3. Rebuild:
```bash
docker-compose up -d --build
```

### Running Out of Disk Space

Docker can consume significant disk space. Clean up with:

```bash
# Remove unused data
docker system prune -a --volumes

# Remove specific LogLens volumes
docker volume rm loglens_postgres_data
```

## Health Checks

Services have built-in health checks:

- **Database**: Checks PostgreSQL is accepting connections
- **API**: Checks HTTP endpoint responds
- **Web**: Checks Next.js server responds

Check health status:
```bash
docker-compose ps
```

## Production Deployment

### Security Recommendations

1. **Change default passwords** in `.env`
2. **Use secrets management** (Docker Swarm secrets, Kubernetes secrets)
3. **Enable SSL/TLS** for database connections
4. **Restrict network access** using firewall rules
5. **Update regularly** to get security patches

### Example Production `.env`

```env
POSTGRES_USER=loglens_prod
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=loglens_prod

NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# Enable HTTPS
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml loglens

# View services
docker stack services loglens
```

### Kubernetes

For Kubernetes deployments, consider using:
- Helm charts
- Kustomize configurations
- Operators for PostgreSQL management

## Performance Tuning

### Database

For better database performance:

1. Add to `docker-compose.yml`:
```yaml
db:
  command: >
    postgres
    -c shared_buffers=256MB
    -c effective_cache_size=768MB
    -c work_mem=16MB
```

2. Use SSD storage for volumes

3. Adjust connection pool size in API

### Build Optimization

The Dockerfiles use multi-stage builds to minimize image size:

- **Builder stage**: Installs all dependencies and builds
- **Production stage**: Copies only necessary artifacts

This reduces final image size by ~60%.

## Monitoring

### Resource Usage

```bash
# View container stats
docker stats loglens-api loglens-web loglens-db
```

### Logs Analysis

```bash
# Count errors
docker-compose logs api | grep -i error | wc -l

# Search logs
docker-compose logs api | grep "specific text"
```

## Backup Strategy

### Automated Backups

Create a cron job:

```bash
# /etc/cron.d/loglens-backup
0 2 * * * root cd /path/to/LogLens && docker-compose exec -T db pg_dump -U loglens loglens > /backups/loglens-$(date +\%Y\%m\%d).sql
```

### Restore from Backup

```bash
docker-compose up -d db
sleep 10  # Wait for database
docker-compose exec -T db psql -U loglens loglens < /path/to/backup.sql
docker-compose up -d api web
```

## Development Tips

### Hot Reload

For development with hot reload, use the local setup instead of Docker, or modify Dockerfile to:

1. Mount source code as volume
2. Run in development mode
3. Enable watch mode

### Testing

```bash
# Run tests in container
docker-compose exec api pnpm test

# Run E2E tests
docker-compose exec api pnpm test:e2e
```

### Debugging

1. Enable debug mode:
```env
NODE_ENV=development
```

2. Access debug endpoints:
```
http://localhost:4000/api  # Swagger docs
```

## Support

For issues:
1. Check logs first
2. Review this guide
3. Check Docker documentation
4. Open GitHub issue with logs attached

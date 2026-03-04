# LogLens

A comprehensive log monitoring and analytics dashboard built with Next.js 16, NestJS 11, and modern UI components.

## Overview

LogLens is a monorepo-based application for real-time log monitoring, analytics, and performance analysis. It provides a powerful dashboard for visualizing system logs, tracking performance metrics, and managing system tasks.

## Tech Stack

**Frontend**
- Next.js 16 with Turbopack
- React 19
- Redux Toolkit with RTK Query
- Tailwind CSS 4
- shadcn/ui components
- Recharts for data visualization

**Backend**
- NestJS 11
- Prisma ORM
- PostgreSQL
- Swagger/OpenAPI documentation

**Development**
- Turborepo for monorepo management
- TypeScript 5.7
- ESLint + Prettier
- Docker & Docker Compose

## Project Structure

```
LogLens/
├── apps/
│   ├── api/          # NestJS backend server
│   └── web/          # Next.js frontend application
├── packages/
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── typescript-config/# Shared TypeScript configuration
│   └── ui/               # Shared UI components
├── docker-compose.yml    # Docker orchestration
└── turbo.json            # Turborepo configuration
```

## Features

### Dashboard Tabs

- **Logs** - Real-time log viewing with filtering, search, and cursor-based pagination
- **Analytics** - Visual analytics with charts showing log distribution by level, service, and time
- **Performance** - Performance metrics and monitoring
- **Offline** - Offline mode support with local storage
- **System Tasks** - System task management and monitoring

### Core Features

- Real-time log streaming and filtering
- Advanced log search with multiple criteria
- Cursor-based pagination for efficient data loading
- Performance comparison tools (EXPLAIN queries)
- Interactive data visualization
- Offline-first architecture
- Responsive design with dark/light theme support

## Getting Started

### Quick Start with Docker (Recommended)

The easiest way to run LogLens is using Docker Compose. This will start PostgreSQL, the API server, and the web frontend in isolated containers.

1. Clone the repository

```bash
git clone https://github.com/maksym-rakomin/LogLens.git
cd LogLens
```

2. Copy the environment file

```bash
cp .env.example .env
```

3. Start all services with Docker Compose

```bash
docker-compose up -d
```

4. Wait for services to be ready (database migrations will run automatically)

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

5. Open your browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api

**Stopping the application:**

```bash
docker-compose down
```

**Reset everything (including database):**

```bash
docker-compose down -v
```

### Local Development Setup

#### Prerequisites

- Node.js >= 20
- pnpm >= 9.12.3
- PostgreSQL database (or use Docker setup above)
- Docker & Docker Compose (optional, for containerized deployment)

### Installation

1. Clone the repository

```bash
git clone https://github.com/maksym-rakomin/LogLens.git
cd LogLens
```

2. Install dependencies

```bash
pnpm install
```

3. Setup environment variables

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Update `.env` or `apps/api/.env` with your database credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=4000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** If using Docker for the database only, use `DATABASE_URL=postgresql://user:password@localhost:5432/dbname` (localhost, not 'db')

4. Setup the database

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate:dev

# (Optional) Seed the database
pnpm prisma:seed
```

5. Start the development servers

```bash
pnpm dev
```

6. Open your browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/logs` | GET | Get logs with filtering and pagination |
| `/api/logs/explain` | GET | Compare pagination performance |
| `/api/stats` | GET | Get comprehensive log statistics |

## Available Commands

### Local Development

```bash
# Development
pnpm dev                    # Start all apps in development mode

# Build
pnpm build                  # Build all apps

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate:dev     # Run development migrations
pnpm prisma:migrate:deploy  # Run production migrations
pnpm prisma:migrate:reset   # Reset database and run migrations
pnpm prisma:seed            # Seed the database
pnpm prisma:studio          # Open Prisma Studio

# Code Quality
pnpm lint                   # Run ESLint
pnpm format                 # Format code with Prettier
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start in foreground (see logs)
docker-compose up

# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f db
docker-compose logs -f web

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build

# Run database seed (after container is running)
docker-compose exec api pnpm prisma:seed

# Access database
docker-compose exec db psql -U loglens -d loglens

# Check service status
docker-compose ps

# Using helper script
./docker.sh start      # Start all services
./docker.sh stop       # Stop all services
./docker.sh logs       # View logs
./docker.sh status     # Check status
./docker.sh seed       # Run database seed
./docker.sh help       # Show all commands
```

## Adding New Packages

To add a package to a specific app:

```bash
cd apps/web && pnpm add <package-name>
# or
cd apps/api && pnpm add <package-name>
```

## Docker Troubleshooting

See [DOCKER.md](./DOCKER.md) for comprehensive Docker documentation.

### Common Issues

**Database connection errors:**
- Ensure the database container is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Wait for the health check to pass before API starts

**API fails to start:**
- Check if database migrations ran: `docker-compose logs api`
- Manually run migrations: `docker-compose exec api pnpm prisma:migrate:deploy`

**Port already in use:**
- Change ports in `.env` file (API_PORT, WEB_PORT, DB_PORT)
- Restart: `docker-compose up -d`

**Build fails:**
- Clear cache and rebuild: `docker-compose build --no-cache`
- Check Node version compatibility (requires Node 20+)

### Container Access

```bash
# Access API container shell
docker-compose exec api sh

# Access web container shell
docker-compose exec web sh

# Access database shell
docker-compose exec db sh

# View environment variables in container
docker-compose exec api env
```

## Adding shadcn Components

To add new shadcn/ui components:

```bash
cd apps/web
pnpm dlx shadcn@latest add <component-name>
```

## State Management

The application uses Redux Toolkit with RTK Query for:
- API state management and caching
- Automatic re-fetching and invalidation
- Optimistic updates

RTK Query hooks are available in `apps/web/lib/store/api.ts`.

## Database Schema

The application uses Prisma ORM with PostgreSQL. View and modify the schema in `apps/api/prisma/schema.prisma`.

## License

LogLens is released under the [MIT License](https://opensource.org/licenses/MIT).

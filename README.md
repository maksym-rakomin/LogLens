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

### Prerequisites

- Node.js >= 20
- pnpm >= 9.12.3
- PostgreSQL database

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
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Update `apps/api/.env` with your database credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=4000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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

## Adding New Packages

To add a package to a specific app:

```bash
cd apps/web && pnpm add <package-name>
# or
cd apps/api && pnpm add <package-name>
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

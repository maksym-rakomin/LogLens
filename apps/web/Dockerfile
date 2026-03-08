# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy workspace packages configs
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# Copy apps package files
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma client (needed for shared types if any)
WORKDIR /app/apps/api
RUN pnpm prisma:generate

# Build web application
WORKDIR /app
ENV NEXT_PUBLIC_API_SERVER=${NEXT_PUBLIC_API_SERVER:-http://localhost:4000}
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# Install production dependencies
RUN pnpm install --prod

# Copy built Next.js application
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/

# Set working directory for web
WORKDIR /app/apps/web

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Set environment variable for production
ENV NODE_ENV=production

# Start the application
CMD ["pnpm", "start"]

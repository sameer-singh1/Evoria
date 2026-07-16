# ─── Stage 1: Builder ────────────────────────────────────────────────────────
# Installs all dependencies (including dev), generates Prisma client,
# and compiles TypeScript to dist/
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source files needed for build
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client (outputs TypeScript to src/generated/prisma/)
RUN npx prisma generate

# Compile TypeScript → dist/ (includes compiled Prisma client at dist/generated/prisma/)
RUN npm run build

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
# Slim production image — no TypeScript, no dev tools, no source .ts files
FROM node:20-alpine AS runner

WORKDIR /app

# Install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder (includes dist/generated/prisma/)
COPY --from=builder /app/dist ./dist

# Copy Prisma schema + migrations (needed for `prisma migrate deploy`)
COPY prisma ./prisma

# Copy Prisma config (needed for Prisma CLI to find schema + datasource URL)
COPY prisma.config.ts ./

EXPOSE 3000

# Start the compiled backend
CMD ["node", "dist/index.js"]

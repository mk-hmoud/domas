# STAGE 1: Build the NestJS App
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy root config
COPY package.json package-lock.json turbo.json ./

# 2. Copy Shared Packages
COPY packages ./packages

# 3. Copy App Source
COPY apps/server ./apps/server

# 4. Install Deps
RUN npm ci

# 5. Build
RUN npm run build -w apps/server

# STAGE 2: Production Image
FROM node:20-alpine

WORKDIR /app

# Copy package.json files for production install
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY packages ./packages

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Expose API Port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start:prod", "-w", "apps/server"]

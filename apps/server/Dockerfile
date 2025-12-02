FROM node:20-alpine

WORKDIR /app

# 1. Copy the root files to setup workspaces
COPY package.json package-lock.json turbo.json ./

# 2. Copy the shared packages (Critical for Monorepo!)
COPY packages ./packages

# 3. Copy the specific app source
COPY apps/server ./apps/server

# 4. Copy other apps' package.json files (Optional but strictly safer for npm ci)
# If npm ci fails because of missing workspace folders, uncomment these:
# COPY apps/client-admin/package.json ./apps/client-admin/package.json
# COPY apps/client-student/package.json ./apps/client-student/package.json

# 5. Install Dependencies (from root, so it links everything)
RUN npm ci

# 6. Build the server (NestJS)
# We run this from the root using -w (workspace) flag
RUN npm run build -w apps/server

# 7. Expose API Port
EXPOSE 3000

# 8. Start the server
CMD ["npm", "run", "start:dev", "-w", "apps/server"]
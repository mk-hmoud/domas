FROM node:20-alpine

WORKDIR /app

# 1. Copy root config
COPY package.json package-lock.json turbo.json ./

# 2. Copy Shared Packages
COPY packages ./packages

# 3. Copy App Source
COPY apps/client ./apps/client

# 4. Install Deps
RUN npm ci

# 5. Expose Vite Port
EXPOSE 5174

# 6. Run Vite
CMD ["npm", "run", "dev", "-w", "client", "--", "--host", "0.0.0.0"]

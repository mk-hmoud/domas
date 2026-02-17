# STAGE 1: Build the React App
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy root config
COPY package.json package-lock.json turbo.json ./

# 2. Copy Shared Packages
COPY packages ./packages

# 3. Copy App Source
COPY apps/client-student ./apps/client-student

# 4. Install Deps
RUN npm ci

# 5. Build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w apps/client-student

# STAGE 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY apps/client-student/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts
COPY --from=builder /app/apps/client-student/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

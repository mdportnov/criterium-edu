FROM node:24-alpine AS build

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY nx.json ./
COPY tsconfig*.json ./
COPY eslint.config.mjs ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/web ./apps/web
COPY libs ./libs

# Build arguments
ARG VITE_API_URL=/api

# Build the application using NX
RUN npx nx build web

###################
# PRODUCTION
###################
FROM nginx:alpine AS production

# Copy built application
COPY --from=build /usr/src/app/dist/apps/web /usr/share/nginx/html

# Copy nginx configuration
COPY apps/nginx/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

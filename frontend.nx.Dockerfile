FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/web ./apps/web
COPY libs ./libs

# Build arguments
ARG VITE_API_URL=/api

# Build the application using NX
RUN npx nx build web --configuration=production

###################
# PRODUCTION
###################
FROM nginx:alpine AS production

# Copy built application
COPY --from=build /usr/src/app/dist/apps/web /usr/share/nginx/html

# Copy nginx configuration
COPY apps/nginx/nginx.conf /etc/nginx/nginx.conf
COPY apps/nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

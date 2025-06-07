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
COPY apps/api ./apps/api
COPY libs ./libs

# Build the application using NX
RUN npx nx build api --configuration=production

# Build migrations separately
RUN npx nx run api:build:migrations

# Prune dev dependencies
RUN npm prune --production

###################
# PRODUCTION
###################
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Create app directory
WORKDIR /usr/src/app

# Copy node_modules and built application
COPY --from=build --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /usr/src/app/dist ./dist

# Copy package.json for runtime
COPY --from=build --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Create startup script
COPY --chown=nestjs:nodejs start-nx.sh ./
RUN chmod +x start-nx.sh

# Switch to non-root user
USER nestjs

# Use dumb-init and the startup script
CMD ["dumb-init", "./start-nx.sh"]

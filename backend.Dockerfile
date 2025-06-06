FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm install -g @nestjs/cli

# Copy source code
COPY apps/api ./apps/api
COPY libs ./libs

# Build the application and migrations
RUN npm run build:all

# Set NODE_ENV environment variable
ENV NODE_ENV=production

# Install only production dependencies and clean npm cache
RUN npm ci --only=production --omit=dev && npm cache clean --force

###################
# PRODUCTION
###################
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /usr/src/app

# Create node user and group if they don't exist
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy the bundled code from the build stage
COPY --from=build --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Create startup script
COPY --chown=nestjs:nodejs start.sh ./
RUN chmod +x start.sh

# Use dumb-init and the startup script
CMD ["dumb-init", "./start.sh"]

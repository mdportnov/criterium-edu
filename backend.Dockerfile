FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies and NestJS CLI
RUN npm ci && npm install -g @nestjs/cli

# Copy apps and libs
COPY apps/api ./apps/api
COPY libs ./libs

# Build the project
RUN nest build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Set environment variables
ARG NODE_ENV
ARG DATABASE_URL
ARG JWT_SECRET

ENV NODE_ENV=$NODE_ENV
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET

# Copy package files and lock file
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/apps/api/src/main"]

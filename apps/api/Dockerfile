FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy apps and libs
COPY apps/api ./apps/api
COPY libs ./libs

# Install dependencies
RUN npm ci

# Build the project
RUN npm run build:api

# Production stage
FROM node:18-alpine

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

CMD ["node", "dist/apps/api/main"]
FROM --platform=linux/amd64 node:24-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY eslint.config.mjs ./

# Copy app-specific package.json
COPY apps/web/package.json ./apps/web/

# Install dependencies with platform-specific binaries
RUN rm -rf node_modules package-lock.json || true
RUN npm i

# Copy source files
COPY apps/web ./apps/web
COPY libs ./libs

# Expose port
EXPOSE 5173

# Development command (using vite directly)
WORKDIR /usr/src/app/apps/web
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
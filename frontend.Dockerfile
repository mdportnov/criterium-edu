FROM node:24-alpine AS build

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
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

ARG VCS_REF=unknown
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.title="criterium-frontend" \
      org.opencontainers.image.source="https://github.com/mdportnov/criterium-edu" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="MIT"

# Copy built application
COPY --from=build /usr/src/app/dist/apps/web /usr/share/nginx/html

# Copy nginx configuration
COPY apps/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy apps and libs
COPY apps/web ./apps/web
COPY libs ./libs

# Install dependencies
RUN npm ci

# Build the frontend
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build frontend
RUN npm run build:web

# Production stage with Nginx
FROM nginx:alpine

# Copy the built files to nginx
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
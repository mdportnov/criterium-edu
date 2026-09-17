# syntax=docker/dockerfile:1

###################
# BUILD
###################
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# node-gyp needs a toolchain for bcrypt's native build.
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY nx.json ./
COPY tsconfig*.json ./

# npm ci, not npm install: the lockfile is the contract.
RUN npm ci

COPY apps/api ./apps/api
COPY libs ./libs

RUN npx nx build api --configuration=production
RUN npx nx run api:build:migrations

RUN npm prune --omit=dev

###################
# PRODUCTION
###################
# Same major as the build stage, so the native bcrypt binding that was
# compiled above still loads here.
FROM node:22-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /usr/src/app

COPY --from=build --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/package*.json ./
COPY --chown=nestjs:nodejs start.sh ./
RUN chmod +x start.sh

ENV NODE_ENV=production
ENV BACKEND_PORT=3000

# Nothing secret is baked in. JWT_SECRET and the database credentials are
# supplied at run time; an image pushed to a registry must not carry them.

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.BACKEND_PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER nestjs

ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]

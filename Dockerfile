# syntax=docker/dockerfile:1

# Matches .nvmrc.
FROM node:26-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# Manifests only, so the dependency layers survive source-only changes.
FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM manifests AS build-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM manifests AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

FROM build-deps AS builder
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production

# Runtime dependencies only: no TypeScript, no test tooling, no sources.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# The node image ships an unprivileged `node` user; root is not needed here.
USER node

EXPOSE 8000

# busybox wget, rather than booting a whole Node runtime every 30s.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-8000}/health" || exit 1

CMD ["node", "dist/index.js"]

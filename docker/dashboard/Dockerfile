# =============================================================================
# Stage: dev — Nuxt 4 dev server with HMR
# =============================================================================
FROM node:22-alpine AS dev

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV PNPM_STORE_DIR=/pnpm/store

COPY docker/node/ensure-workspace-deps.sh /usr/local/bin/ensure-workspace-deps
RUN chmod +x /usr/local/bin/ensure-workspace-deps

EXPOSE 3000

CMD ["sh", "-c", "ensure-workspace-deps /app/apps/dashboard/node_modules/.bin/nuxt && rm -rf /app/apps/dashboard/node_modules/.cache/vite /app/apps/dashboard/.nuxt && pnpm dev:dashboard --host 0.0.0.0"]

# =============================================================================
# Stage: build — production build
# =============================================================================
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV PNPM_STORE_DIR=/pnpm/store

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile

COPY apps/dashboard apps/dashboard

RUN pnpm build:dashboard

# =============================================================================
# Stage: prod — serve with Node
# =============================================================================
FROM node:22-alpine AS prod

WORKDIR /app

COPY --from=build /app/apps/dashboard/.output .output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

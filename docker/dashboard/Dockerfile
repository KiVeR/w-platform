# =============================================================================
# Stage: dev — Nuxt 4 dev server with HMR
# =============================================================================
FROM node:22-alpine AS dev

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

EXPOSE 3000

# pnpm install si node_modules manquant, puis dev server
CMD ["sh", "-c", "if [ ! -d 'node_modules' ]; then pnpm install --frozen-lockfile; fi && pnpm dev:dashboard --host 0.0.0.0"]

# =============================================================================
# Stage: build — production build
# =============================================================================
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

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

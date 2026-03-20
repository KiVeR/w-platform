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

CMD ["sh", "-c", "ensure-workspace-deps /app/apps/kreo/node_modules/.bin/nuxt /app/apps/kreo/node_modules/.bin/prisma && cd apps/kreo && pnpm exec prisma generate && pnpm exec nuxt dev --host 0.0.0.0 --port ${KREO_PORT:-3000}"]

# =============================================================================
# Stage: build — production build
# =============================================================================
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV PNPM_STORE_DIR=/pnpm/store

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/kreo/package.json apps/kreo/
COPY packages/content-editor/package.json packages/content-editor/
COPY packages/targeting/package.json packages/targeting/

RUN pnpm install --frozen-lockfile

COPY apps/kreo apps/kreo
COPY packages packages

RUN cd apps/kreo && pnpm exec prisma generate
RUN pnpm build:kreo

# =============================================================================
# Stage: prod — serve with Node
# =============================================================================
FROM node:22-alpine AS prod

WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/kreo/package.json ./apps/kreo/package.json
COPY --from=build /app/apps/kreo/.output ./apps/kreo/.output

WORKDIR /app/apps/kreo

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

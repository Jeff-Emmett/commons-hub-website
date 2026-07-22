FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_DIRECTUS_URL
ENV NEXT_PUBLIC_DIRECTUS_URL=$NEXT_PUBLIC_DIRECTUS_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
# Infisical secret-injection entrypoint: fetches prod secrets (MAIL_*, LISTMONK_*,
# DIRECTUS_URL) from Infisical at container start and overlays them onto the env
# before `node server.js`. Overlay = compose env acts as fallback for anything not
# in Infisical; fetch failure is non-fatal (starts with existing env). This is what
# actually delivers the SMTP config to the running app — plain `docker compose up`
# injects nothing.
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]

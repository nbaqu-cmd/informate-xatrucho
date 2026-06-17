FROM node:20-slim AS base
WORKDIR /app

FROM base AS builder
COPY package.json turbo.json ./
COPY apps/web/package.json apps/web/
RUN npm install
COPY apps/web ./apps/web
RUN npx turbo run build --filter=@informate/web

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]

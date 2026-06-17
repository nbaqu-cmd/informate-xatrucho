FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS builder
COPY package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/ai/package.json packages/ai/
COPY packages/media/package.json packages/media/
COPY packages/scraper/package.json packages/scraper/
RUN npm install
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npx turbo run build --filter=@informate/api

FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json .

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]

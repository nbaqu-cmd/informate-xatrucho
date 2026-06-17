FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl chromium && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
WORKDIR /app

FROM base AS runner
COPY package.json turbo.json ./
COPY workers/congress-watcher/package.json workers/congress-watcher/
COPY packages/database/package.json packages/database/
COPY packages/scraper/package.json packages/scraper/
RUN npm install
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

CMD ["node", "--loader", "tsx/esm", "workers/congress-watcher/src/index.ts"]

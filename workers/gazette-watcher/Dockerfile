FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl chromium python3 ffmpeg && \
    apt-get install -y yt-dlp || pip3 install yt-dlp && \
    rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium
WORKDIR /app

FROM base AS runner
COPY package.json turbo.json ./
COPY workers/gazette-watcher/package.json workers/gazette-watcher/
COPY packages/database/package.json packages/database/
COPY packages/scraper/package.json packages/scraper/
RUN npm install
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

CMD ["node", "--loader", "tsx/esm", "workers/gazette-watcher/src/index.ts"]

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl chromium ffmpeg && \
    rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
WORKDIR /app

FROM base AS runner
COPY package.json turbo.json ./
COPY workers/video-generator/package.json workers/video-generator/
COPY packages/database/package.json packages/database/
COPY packages/media/package.json packages/media/
RUN npm install
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

CMD ["node", "--loader", "tsx/esm", "workers/video-generator/src/index.ts"]

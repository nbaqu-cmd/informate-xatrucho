FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl python3 pip ffmpeg && \
    pip3 install yt-dlp && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS runner
COPY package.json turbo.json ./
COPY workers/transcription/package.json workers/transcription/
COPY packages/database/package.json packages/database/
COPY packages/media/package.json packages/media/
RUN npm install
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

CMD ["node", "--loader", "tsx/esm", "workers/transcription/src/index.ts"]

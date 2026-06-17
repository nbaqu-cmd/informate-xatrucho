FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS runner
COPY package.json turbo.json ./
COPY workers/publisher/package.json workers/publisher/
COPY packages/database/package.json packages/database/
RUN npm install
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

CMD ["node", "--loader", "tsx/esm", "workers/publisher/src/index.ts"]

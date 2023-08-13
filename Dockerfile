FROM docker.io/library/node:lts-alpine AS base

WORKDIR /app

FROM base AS builder

RUN corepack enable

RUN apk update 

RUN apk add git --no-cache 

COPY package.json ./

COPY package-lock.json ./

RUN npm i 

COPY . ./

#Build

RUN npm run build

FROM base AS runner 

ENV NODE_ENV=production

COPY --from=builder /app ./output

EXPOSE 8000/tcp

VOLUME ["/data"]

CMD ["node", "output/dist/index.js"]
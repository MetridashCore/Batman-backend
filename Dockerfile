FROM docker.io/library/node:lts-alpine

WORKDIR /app

RUN corepack enable

RUN apk update 

RUN apk add git --no-cache 

COPY package.json ./

COPY package-lock.json ./

RUN npm i 

COPY . ./

EXPOSE 8000 

CMD ["npm","run","dev"]
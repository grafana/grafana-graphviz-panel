FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY server.js ./

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "server.js"]


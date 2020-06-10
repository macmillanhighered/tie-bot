FROM node:12-alpine

WORKDIR /app
COPY yarn.lock .
COPY package*.json .

RUN yarn

COPY . .
RUN yarn build
RUN yarn client-build

EXPOSE 5000

CMD ["yarn", "prod"]

FROM node:12-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY yarn.lock .
COPY package*.json .

RUN yarn

COPY . .
RUN yarn build
RUN yarn client-build

EXPOSE 5000

CMD ["yarn", "prod"]

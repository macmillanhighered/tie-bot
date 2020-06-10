FROM node:12-alpine

# Create app directory
RUN mkdir -p /usr/src/app
CMD echo 127.0.0.1  iam-local.mldev.cloud >> /etc/hosts;
WORKDIR /usr/src/app

COPY yarn.lock .
COPY package*.json .

RUN yarn

COPY . .
RUN yarn build
RUN yarn client-build

EXPOSE 5000

CMD ["yarn", "prod"]

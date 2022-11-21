FROM node:16.14.0-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/

RUN yarn install

COPY . .

EXPOSE 8082

CMD ["yarn", "dev"]

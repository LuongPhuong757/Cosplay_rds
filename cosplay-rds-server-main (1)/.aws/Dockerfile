FROM node:16.14.0-alpine
ARG build_env=dev
WORKDIR /usr/src/app
COPY package.json yarn.lock /usr/src/app/
RUN yarn install
COPY . .
RUN yarn run generate && yarn run bundle:${build_env}
COPY ./.aws/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh
# NODE_ENVは、.env、docker-compose.yml、AWSのタスク定義＆パラメーターストアで設定します。
EXPOSE 8082
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "build/app.js"]

# cosplay-rds-server

cosplayのrdsサーバです。

dbに対してアクションを行います。

## Setup

環境変数の設定およびPrismaのセットアップ

```sh
$ cp .env.example .env
$ cp aws_config_sample.json aws_config.json
$ docker-compose up -d db # run your database
$ yarn migrate # migrate your database
```

## Start

```sh
$ yarn
$ yarn dev  # or yarn start
```

## Build

```sh
$ yarn build
$ yarn start  # execute build files
```

## Test

```sh
$ yarn migrate:test # schemaを変更した場合は、migration:testを実行してください。
$ yarn test
```

## ディレクトリ構成

[こちら](https://softwareontheroad.com/ideal-nodejs-project-structure/)を参考にしています。

```sh
src
│   app.ts          # アプリのエントリーポイント
│   server.ts       # サーバー初期化処理
└───configs         # 環境変数やその他アプリの設定
└───common          # 便利関数の定義
└───controllers     # アプリのエンドポイント処理
└───core            # core機能の定義
└───decorators      # デコレータ機能の定義
└───guards          # resolverの個別認証を行う機能の定義
└───interceptors    # インプットを処理する機能の定義
└───interfaces      # 型定義
└───jobs            # ジョブの定義
└───middlewares     # ミドルウェアの定義
└───modules         # モジュールの定義
└───providers       # 外部サービス連携用のクラス定義
└───services        # 全てのビジネスロジックはここに
└───types           # 型定義(d.ts)
└───docker          # テスト環境の保存先
    └───db          # テスト環境データベースの情報
└───prisma          # Prismaのスキーマ定義
└───test            # テストコード
│   .env            # env
```

## RDB 起動

```shell
yarn run generate     # or make yarn-generate
yarn run setup:test   # or make yarn-setup-test
yarn run migrate      # or make yarn-migrate
```

### PostgreSQL 素起動/確認

```shell
$ docker exec -i -t rds_db_1 bash
# psql cosplay
```

## 便利ツール

```shell
npx prisma studio # or make yarn-prisma
```

### http://localhost:8080/graphql

要: BFF側からアクセス

![image](https://user-images.githubusercontent.com/6259384/109421074-221c8e80-7a19-11eb-961f-2ed55e8c24cc.png)

## 環境変数

```sh
# Application
PORT=                                 # ポート番号
X_API_KEY=                            # X-API-KEYシークレット

# Database URL
DATABASE_URL=                         # データベースのURL

# AWS
AWS_S3_IMAGE_BUCKET=                  # 画像・動画用のバケット名
AWS_SQS_WEBHOOK_STRIPE_QUEUE_URL=     # StripeのWebhook用のSQS
AWS_SQS_IMAGE_COMPRESSION_QUEUE_URL=  # 画像・動画処理用のSQS

# aws_config.jsonにて定義
#AWS_CONFIG_REGION=ap-northeast-1
#AWS_CONFIG_ACCESS_KEY_ID=
#AWS_CONFIG_SECRET_ACCESS_KEY

# Auth0
AUTH0_HOOK_SECRET=                    # Auth0のHook用のシークレット
AUTH0_API_END_POINT=                  # Auth0のエンドポイント
AUTH0_CLIENT_ID=                      # Auth0のクライアントID
AUTH0_CLIENT_SECRET=                  # Auth0のクライアントシークレット
AUTH0_AUDIENCE=                       # Auth0のAudience

# Image Domain
PHOTO_DOMAIN=                         # cloud frontのURL

# Stripe
STRIPE_SECRET_KEY=                    # Stripeのシークレットキー
```

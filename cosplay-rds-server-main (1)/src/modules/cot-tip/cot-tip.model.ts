import { registerEnumType } from 'type-graphql';

export {
  COTTipNFTDistributionState,
  COTTipTriggerdTxHashes,
  COTTipDistributionTriggerdTxHashes,
} from '@prisma/client';

export enum OnTipResult {
  OK,
  TX_HASH_ALREADY_TRIGGERED,
  INSUFFICIENT_COT,
  TARGET_COSPLAYER_NOT_REGISTERED,
  SELF_TIPPING_FORBIDDEN,
  TARGET_COSPLAYER_HAS_NO_POST,
}

export enum OnDistributeResult {
  OK,
  TX_HASH_ALREADY_TRIGGERED,
}

registerEnumType(OnTipResult, {
  name: 'OnTipResult',
  valuesConfig: {
    OK: {
      description: '処理を正常に完了し、NFT配布キューに登録しました。',
    },
    TX_HASH_ALREADY_TRIGGERED: {
      description: 'トランザクションハッシュは既にトリガー済みです。',
    },
    INSUFFICIENT_COT: {
      description: 'COTの量がNFT配布の要件を満たしていません。',
    },
    TARGET_COSPLAYER_NOT_REGISTERED: {
      description: '指定した対象コスレイヤーはCOT投げ銭NFT配布ステートリストに登録されていません。',
    },
    SELF_TIPPING_FORBIDDEN: {
      description: 'COTの送り主と指定した対象コスレイヤーのアドレスが同一です',
    },
    TARGET_COSPLAYER_HAS_NO_POST: {
      description: '指定した対象コスレイヤーは1つも投稿されていません。',
    },
  },
});

registerEnumType(OnDistributeResult, {
  name: 'OnDistributeResult',
  valuesConfig: {
    OK: {
      description: '処理を正常に完了し、NFTメタデータアップロードキューに登録しました。',
    },
    TX_HASH_ALREADY_TRIGGERED: {
      description: 'トランザクションハッシュは既にトリガー済みです。',
    },
  },
});

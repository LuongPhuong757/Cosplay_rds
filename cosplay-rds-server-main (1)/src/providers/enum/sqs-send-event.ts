import { WebhookEventType } from '@interfaces';

export const SqsSendEvent = {
  postImage: 'postImage',
  postVideo: 'postVideo',
  userIcon: 'userIcon',
  shipment: 'shipment',
} as const;

export type SqsSendEventType = typeof SqsSendEvent[keyof typeof SqsSendEvent] | WebhookEventType;

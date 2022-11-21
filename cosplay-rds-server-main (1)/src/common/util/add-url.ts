import config from '@config';
import { HTTP_URL_REG_EXP } from '@configs/constant';
import { Tag } from '@modules/tag/tag.model';

const { photoDomain } = config.file;

export const addUrl = <T, K extends keyof T>(obj: T, key: K): string => {
  const target = String(obj[key]);
  if (!target) return target;
  if (HTTP_URL_REG_EXP.exec(target)) return target;

  return `${photoDomain}${target}`;
};

export const addUrlToObject = <T, K extends keyof T>(obj: T, key: K): T => {
  const target = obj[key];
  if (!target) return obj;

  return {
    ...obj,
    [key]: addUrl(obj, key),
  };
};

export const addUrlToTag = (tag: Tag): Tag => {
  const { event: tagEvent } = tag;
  if (tagEvent) {
    const event = addUrlToObject(tagEvent, 'image');

    return {
      ...tag,
      event,
    };
  }

  return tag;
};

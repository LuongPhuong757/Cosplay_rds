import * as crypto from 'crypto';

export const generateHashedFilename = (originalFilename: string): string => {
  const splitted = originalFilename.split('.');
  const hashedName = generateHash(splitted[0]);
  if (!splitted[1]) {
    return hashedName;
  }

  return `${hashedName}.${splitted[1]}`;
};

const generateHash = (str: string): string => crypto.createHash('sha1').update(str).digest('hex');

export const getFileNameExtension = (filename: string): string => {
  const splitted = filename.split('.');
  if (!splitted[1]) {
    throw new Error('invalid file extension');
  }

  return splitted[1];
};

import { Photo } from '@modules/photo/photo.model';
import { DisclosureRange } from '@modules/post/enum/disclosure-range';
import { S3Provider } from '@providers/s3.provider';
import { addUrlToObject } from './add-url';
import { generateHashedFilename, getFileNameExtension } from './image-filename';

export const addPhotoUrlBylDisclosureRange = (
  photo: Photo,
  disclosureRange: DisclosureRange,
  isFollowing: boolean,
  isMembership?: boolean,
): Photo => {
  const canSee = canSeeThePost(disclosureRange, isFollowing, isMembership);
  const addedPhoto = getDisclosureRangePhoto(photo, canSee);

  return addUrlToObject(addedPhoto, 'image');
};

const canSeeThePost = (
  disclosureRange: DisclosureRange,
  isFollowing: boolean,
  isMembership?: boolean,
): boolean => {
  if (isMembership) return true; // メンバーシップなら全部見れる

  if (disclosureRange === DisclosureRange.MEMBERSHIP) {
    return false;
  }

  if (disclosureRange === DisclosureRange.FOLLOWER) {
    return isFollowing;
  }

  return true;
};

const getDisclosureRangePhoto = (photo: Photo, canSee: boolean): Photo => {
  if (canSee) return photo;

  const { image } = photo;
  const hashedName = generateHashedFilename(image);

  const ext = getFileNameExtension(photo.image);
  const index = S3Provider._videoExntesions.indexOf(ext);

  // membership専用の動画の場合は、membership onlyの画像を表示する
  if (index !== -1) {
    return {
      ...photo,
      image: S3Provider._membershipOnlyImageUrl,
    };
  }

  // 画像
  return {
    ...photo,
    image: hashedName,
  };
};

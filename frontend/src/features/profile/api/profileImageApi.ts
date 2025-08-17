// 공통 이미지 업로드 기능을 사용하도록 리팩토링
import { uploadImage, ImageUploadResult } from "@/features/image-upload";

// 프로필 사진 업로드 결과 (하위 호환성을 위해 타입 별칭)
export type ProfileUploadResult = ImageUploadResult;

/**
 * 프로필 사진 업로드 전체 프로세스
 * - 공통 이미지 업로드 기능 사용
 * @deprecated 직접 @/features/image-upload의 uploadImage를 사용하세요
 */
export async function uploadProfileImage(file: File): Promise<ProfileUploadResult> {
  return uploadImage(file);
}

// 하위 호환성을 위한 re-exports
export { uploadToS3, getImagePresignedUrl as getProfileImageUrl } from "@/features/image-upload";
export type { ImageUrlResponseData as ProfileImageUrlResponseData } from "@/features/image-upload";
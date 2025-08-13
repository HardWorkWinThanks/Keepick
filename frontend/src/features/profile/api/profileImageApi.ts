import axios from "axios";
import { apiClient, ApiResponse } from "@/shared/api/http";
import { extractImageMetadata, ImageMetadata } from "@/shared/lib/imageMetadata";

// 프로필 사진 업로드 결과
export interface ProfileUploadResult {
  publicUrl: string;
  presignedUrl: string;
  meta: {
    fileName: string;
    contentType: string;
    fileSize: number;
    width: number;
    height: number;
    takenAt: string;
  };
}

// 프로필 사진 업로드 응답
export interface ProfileImageUrlResponseData {
  presignedUrl: string;
  publicUrl: string;
}

// S3에 파일 업로드 (공통 함수)
export const uploadToS3 = async (
  presignedUrl: string,
  file: File
): Promise<string> => {
  await axios.put(presignedUrl, file, {
    headers: { "Content-Type": file.type },
    timeout: 30000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return presignedUrl.split("?")[0];
};

// 프로필 사진 PreSignedUrl + PublicUrl 요청
export const getProfileImageUrl = async (
  file: ImageMetadata
): Promise<ProfileImageUrlResponseData> => {
  const response = await apiClient.post<ApiResponse<ProfileImageUrlResponseData>>(
    "/api/photos/presigned-url",
    file
  );

  return response.data.data;
};

/**
 * 프로필 사진 업로드 전체 프로세스
 * - 메타데이터 추출
 * - Presigned URL 발급
 * - S3 업로드
 * - publicUrl 반환
 */
export async function uploadProfileImage(file: File): Promise<ProfileUploadResult> {
  // 이미지에서 모든 메타데이터 추출
  const meta = await extractImageMetadata(file);

  // PreSignedUrl 요청
  const { presignedUrl, publicUrl } = await getProfileImageUrl(meta);

  // S3 업로드
  await uploadToS3(presignedUrl, file);

  return { publicUrl, presignedUrl, meta };
}
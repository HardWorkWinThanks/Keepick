import axios from "axios";
import { apiClient, ApiResponse } from "@/shared/api/http";
import { extractImageMetadata, ImageMetadata } from "@/shared/lib/imageMetadata";

// 이미지 업로드 결과
export interface ImageUploadResult {
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

// 이미지 URL 응답 데이터
export interface ImageUrlResponseData {
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

// 이미지 PreSignedUrl + PublicUrl 요청
export const getImagePresignedUrl = async (
  file: ImageMetadata
): Promise<ImageUrlResponseData> => {
  const response = await apiClient.post<ApiResponse<ImageUrlResponseData>>(
    "/api/photos/presigned-url",
    file
  );

  return response.data.data;
};

/**
 * 이미지 업로드 전체 프로세스
 * - 메타데이터 추출
 * - Presigned URL 발급
 * - S3 업로드
 * - publicUrl 반환
 */
export async function uploadImage(file: File): Promise<ImageUploadResult> {
  // 이미지에서 모든 메타데이터 추출
  const meta = await extractImageMetadata(file);

  // PreSignedUrl 요청
  const { presignedUrl, publicUrl } = await getImagePresignedUrl(meta);

  // S3 업로드
  await uploadToS3(presignedUrl, file);

  return { publicUrl, presignedUrl, meta };
}
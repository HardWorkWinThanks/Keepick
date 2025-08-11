import axios from "axios";
import { apiClient, ApiResponse } from "@/shared/api/http";
import {
  extractImageMetadata,
  extractMultipleImageMetadata,
} from "../lib/imageMetadata";
import { ImageMetadata } from "@/features/image-upload/lib/imageMetadata";

export interface UploadResult {
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

export interface ImageUrlResponseData {
  presignedUrl: string;
  publicUrl: string;
}

// S3에 파일 업로드
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

// 단일 이미지 PreSignedUrl + PublicUrl 요청
export const getImageUrl = async (
  meta: ImageMetadata
): Promise<ImageUrlResponseData> => {
  const response = await apiClient.post<ApiResponse<ImageUrlResponseData>>(
    "/api/photos/presigned-url",
    meta
  );

  return response.data.data;
};

// 복수 이미지 PreSignedUrl + PublicUrl 요청
export const getImageUrls = async (
  groupId: number,
  metas: ImageMetadata[]
): Promise<ImageUrlResponseData[]> => {
  const response = await apiClient.post<ApiResponse<ImageUrlResponseData[]>>(
    `/api/groups/${groupId}/photos/presigned-urls`,
    metas
  );

  return response.data.data;
};

/**
 * 단일 이미지 파일 업로드만 수행하는 서비스 함수(프로필 사진)
 * - 메타데이터 추출
 * - Presigned URL 발급
 * - S3 업로드
 * - publicUrl 반환
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  // 이미지에서 모든 메타데이터 추출
  const meta = await extractImageMetadata(file);

  // PreSignedUrl 요청
  const { presignedUrl, publicUrl } = await getImageUrl(meta);

  // S3 업로드
  await uploadToS3(presignedUrl, file);

  return { publicUrl, presignedUrl, meta };
}

/**
 * 복수 이미지 파일 업로드만 수행하는 서비스 함수(그룹 갤러리)
 * - 메타데이터 추출
 * - Presigned URL 발급
 * - S3 업로드
 * - publicUrl 반환
 */
export async function uploadImages(
  groupId: number,
  files: File[]
): Promise<UploadResult[]> {
  // 이미지에서 모든 메타데이터 추출
  const metas = await extractMultipleImageMetadata(files);

  // PreSignedUrl 요청
  const urlPairs = await getImageUrls(groupId, metas);

  if (urlPairs.length !== files.length) {
    throw new Error("발급된 URL 개수와 파일 개수가 일치하지 않습니다.");
  }

  // 3) 각 파일을 해당 presignedUrl로 업로드 (병렬)
  const results = await Promise.all(
    urlPairs.map(async ({ presignedUrl, publicUrl }, idx) => {
      await uploadToS3(presignedUrl, files[idx]);
      return {
        publicUrl,
        presignedUrl,
        meta: metas[idx],
      } as UploadResult;
    })
  );

  return results
  // publicUrl만 구조분해할당으로 뽑아쓰던가 하기
}

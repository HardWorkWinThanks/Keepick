import axios from "axios";
import { apiClient, ApiResponse } from "@/shared/api/http";
import { extractMultipleImageMetadata, ImageMetadata } from "@/shared/lib/imageMetadata";

// 갤러리 사진 업로드 결과
export interface GalleryUploadResult {
  imageId: number;
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

// 갤러리 업로드 응답
export interface GalleryImageUrlResponseData {
  presignedUrl: string;
  imageId: number;
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

// 갤러리 이미지 PreSignedUrl + ImageId 요청
export const getGalleryImageUrls = async (
  groupId: number,
  files: ImageMetadata[]
): Promise<GalleryImageUrlResponseData[]> => {
  const response = await apiClient.post<ApiResponse<GalleryImageUrlResponseData[]>>(
    `/api/groups/${groupId}/photos/presigned-urls`,
    { files }
  );

  return response.data.data;
};

/**
 * 갤러리 사진 업로드 전체 프로세스
 * - 메타데이터 추출
 * - Presigned URL 발급
 * - S3 업로드
 * - imageId 반환
 */
export async function uploadGalleryImages(
  groupId: number,
  files: File[]
): Promise<GalleryUploadResult[]> {
  // 이미지에서 모든 메타데이터 추출
  const metas = await extractMultipleImageMetadata(files);

  // PreSignedUrl 요청
  const urlPairs = await getGalleryImageUrls(groupId, metas);

  if (urlPairs.length !== files.length) {
    throw new Error("발급된 URL 개수와 파일 개수가 일치하지 않습니다.");
  }

  // 각 파일을 해당 presignedUrl로 업로드 (병렬)
  const results = await Promise.all(
    urlPairs.map(async ({ presignedUrl, imageId }, idx) => {
      await uploadToS3(presignedUrl, files[idx]);
      return {
        imageId,
        presignedUrl,
        meta: metas[idx],
      } as GalleryUploadResult;
    })
  );

  return results;
}
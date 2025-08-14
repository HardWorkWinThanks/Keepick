// import axios from "axios";
// import { apiClient, ApiResponse } from "@/shared/api/http";
// import {
//   extractImageMetadata,
//   extractMultipleImageMetadata,
// } from "../lib/imageMetadata";
// import { ImageMetadata } from "@/features/image-upload/lib/imageMetadata";

// // 단일 업로드 결과 (프로필 사진용)
// export interface SingleUploadResult {
//   publicUrl: string;
//   presignedUrl: string;
//   meta: {
//     fileName: string;
//     contentType: string;
//     fileSize: number;
//     width: number;
//     height: number;
//     takenAt: string;
//   };
// }

// // 그룹 갤러리 업로드 결과
// export interface GroupUploadResult {
//   imageId: number;
//   presignedUrl: string;
//   meta: {
//     fileName: string;
//     contentType: string;
//     fileSize: number;
//     width: number;
//     height: number;
//     takenAt: string;
//   };
// }

// // 단일 이미지 업로드 응답 (프로필 사진용)
// export interface SingleImageUrlResponseData {
//   presignedUrl: string;
//   publicUrl: string;
// }

// // 그룹 갤러리 업로드 응답
// export interface GroupImageUrlResponseData {
//   presignedUrl: string;
//   imageId: number;
// }

// // S3에 파일 업로드
// export const uploadToS3 = async (
//   presignedUrl: string,
//   file: File
// ): Promise<string> => {
//   await axios.put(presignedUrl, file, {
//     headers: { "Content-Type": file.type },
//     timeout: 30000,
//     maxBodyLength: Infinity,
//     maxContentLength: Infinity,
//   });

//   return presignedUrl.split("?")[0];
// };

// // 단일 이미지 PreSignedUrl + PublicUrl 요청 (프로필 사진용)
// export const getSingleImageUrl = async (
//   file: ImageMetadata
// ): Promise<SingleImageUrlResponseData> => {
//   const response = await apiClient.post<ApiResponse<SingleImageUrlResponseData>>(
//     "/api/photos/presigned-url",
//     file
//   );

//   return response.data.data;
// };

// // 그룹 갤러리 이미지 PreSignedUrl + ImageId 요청
// export const getGroupImageUrls = async (
//   groupId: number,
//   files: ImageMetadata[]
// ): Promise<GroupImageUrlResponseData[]> => {
//   const response = await apiClient.post<ApiResponse<GroupImageUrlResponseData[]>>(
//     `/api/groups/${groupId}/photos/presigned-urls`,
//     { files }
//   );

//   return response.data.data;
// };

// /**
//  * 단일 이미지 파일 업로드만 수행하는 서비스 함수(프로필 사진)
//  * - 메타데이터 추출
//  * - Presigned URL 발급
//  * - S3 업로드
//  * - publicUrl 반환
//  */
// export async function uploadImage(file: File): Promise<SingleUploadResult> {
//   // 이미지에서 모든 메타데이터 추출
//   const meta = await extractImageMetadata(file);

//   // PreSignedUrl 요청
//   const { presignedUrl, publicUrl } = await getSingleImageUrl(meta);

//   // S3 업로드
//   await uploadToS3(presignedUrl, file);

//   return { publicUrl, presignedUrl, meta };
// }

// /**
//  * 복수 이미지 파일 업로드만 수행하는 서비스 함수(그룹 갤러리)
//  * - 메타데이터 추출
//  * - Presigned URL 발급
//  * - S3 업로드
//  * - publicUrl 반환
//  */
// export async function uploadImages(
//   groupId: number,
//   files: File[]
// ): Promise<GroupUploadResult[]> {
//   // 이미지에서 모든 메타데이터 추출
//   const metas = await extractMultipleImageMetadata(files);

//   // PreSignedUrl 요청
//   const urlPairs = await getGroupImageUrls(groupId, metas);

//   if (urlPairs.length !== files.length) {
//     throw new Error("발급된 URL 개수와 파일 개수가 일치하지 않습니다.");
//   }

//   // 3) 각 파일을 해당 presignedUrl로 업로드 (병렬)
//   const results = await Promise.all(
//     urlPairs.map(async ({ presignedUrl, imageId }, idx) => {
//       await uploadToS3(presignedUrl, files[idx]);
//       return {
//         imageId,
//         presignedUrl,
//         meta: metas[idx],
//       } as GroupUploadResult;
//     })
//   );

//   return results;
// }

// 일단 갤러리 업로드 관련은 photo-gallery, 프로필 업로드 관련은 profile에 옮김.
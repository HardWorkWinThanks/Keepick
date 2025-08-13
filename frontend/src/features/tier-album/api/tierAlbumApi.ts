import { apiClient, ApiResponse } from "@/shared/api/http";

// 티어 앨범 생성 요청 타입
export interface CreateTierAlbumRequest {
  photoIds: number[];
}

// 티어 앨범 생성 성공 응답 타입
export interface CreateTierAlbumSuccessResponse {
  status: 200;
  message: string;
  data: number; // tierAlbumId
}

// 티어 앨범 생성 에러 응답 타입
export interface CreateTierAlbumErrorResponse {
  status: 400 | 404;
  message: string;
  errorCode: "B004" | "B003";
  timeStamp: string;
}

/**
 * 티어 앨범 생성
 */
export const createTierAlbum = async (
  groupId: number,
  photoIds: number[]
): Promise<number> => {
  const response = await apiClient.post<ApiResponse<number>>(
    `/api/groups/${groupId}/tier-albums`,
    { photoIds }
  );

  return response.data.data;
};
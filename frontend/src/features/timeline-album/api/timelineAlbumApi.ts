import { apiClient, ApiResponse } from "@/shared/api/http";

// 타임라인 앨범 생성 요청 타입
export interface CreateTimelineAlbumRequest {
  photoIds: number[];
}

// 타임라인 앨범 생성 응답 타입
export interface CreateTimelineAlbumResponse {
  albumId: number;
  thumbnailUrl: string;
  createdAt: string;
  photoCount: number;
}

/**
 * 타임라인 앨범 생성
 */
export const createTimelineAlbum = async (
  groupId: number,
  photoIds: number[]
): Promise<CreateTimelineAlbumResponse> => {
  const response = await apiClient.post<ApiResponse<CreateTimelineAlbumResponse>>(
    `/api/groups/${groupId}/timeline-albums`,
    { photoIds }
  );

  return response.data.data;
};
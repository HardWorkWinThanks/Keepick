import { apiClient, ApiResponse } from "@/shared/api/http";

/**
 * 타임라인 앨범에 사진 추가 요청 타입
 */
export interface AddPhotosToTimelineAlbumRequest {
  photoIds: number[];
}

/**
 * 타임라인 앨범에서 사진 삭제 요청 타입
 */
export interface RemovePhotosFromTimelineAlbumRequest {
  photoIds: number[];
}

/**
 * 타임라인 앨범 사진 추가 응답 타입
 */
export interface TimelineAlbumPhotoResponse {
  photoId: number;
  originalUrl: string;
  thumbnailUrl: string;
}

/**
 * 타임라인 앨범에 사진 추가
 * POST /api/groups/{groupId}/timeline-albums/{albumId}/photos
 * 
 * @param groupId - 그룹 ID
 * @param albumId - 타임라인 앨범 ID
 * @param photoIds - 추가할 사진 ID 배열
 * @returns 추가된 사진들의 정보
 */
export const addPhotosToTimelineAlbum = async (
  groupId: number,
  albumId: number,
  photoIds: number[]
): Promise<TimelineAlbumPhotoResponse[]> => {
  const response = await apiClient.post<ApiResponse<TimelineAlbumPhotoResponse[]>>(
    `/api/groups/${groupId}/timeline-albums/${albumId}/photos`,
    { photoIds }
  );

  return response.data.data;
};

/**
 * 타임라인 앨범에서 사진 삭제
 * DELETE /api/groups/{groupId}/timeline-albums/{albumId}/photos
 * 
 * @param groupId - 그룹 ID
 * @param albumId - 타임라인 앨범 ID
 * @param photoIds - 삭제할 사진 ID 배열
 */
export const removePhotosFromTimelineAlbum = async (
  groupId: number,
  albumId: number,
  photoIds: number[]
): Promise<void> => {
  await apiClient.delete<ApiResponse<{}>>(
    `/api/groups/${groupId}/timeline-albums/${albumId}/photos`,
    {
      data: { photoIds }
    }
  );
};
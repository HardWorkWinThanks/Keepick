import { apiClient, ApiResponse } from "@/shared/api/http";

/**
 * 티어 앨범에 사진 추가 요청 타입
 */
export interface AddPhotosToTierAlbumRequest {
  photoIds: number[];
}

/**
 * 티어 앨범에서 사진 삭제 요청 타입
 */
export interface RemovePhotosFromTierAlbumRequest {
  photoIds: number[];
}

/**
 * 티어 앨범 사진 추가 응답 타입
 */
export interface TierAlbumPhotoResponse {
  photoId: number;
  originalUrl: string;
  thumbnailUrl: string;
}

/**
 * 티어 앨범 사진 추가 응답 데이터
 */
export interface AddPhotosToTierAlbumResponse {
  photos: TierAlbumPhotoResponse[];
}

/**
 * 티어 앨범에 사진 추가
 * POST /api/groups/{groupId}/tier-albums/{tierAlbumId}/photos
 * 
 * @param groupId - 그룹 ID
 * @param tierAlbumId - 티어 앨범 ID
 * @param photoIds - 추가할 사진 ID 배열
 * @returns 추가된 사진들의 정보
 */
export const addPhotosToTierAlbum = async (
  groupId: number,
  tierAlbumId: number,
  photoIds: number[]
): Promise<TierAlbumPhotoResponse[]> => {
  const response = await apiClient.post<ApiResponse<AddPhotosToTierAlbumResponse>>(
    `/api/groups/${groupId}/tier-albums/${tierAlbumId}/photos`,
    { photoIds }
  );

  return response.data.data.photos;
};

/**
 * 티어 앨범에서 사진 삭제
 * DELETE /api/groups/{groupId}/tier-albums/{tierAlbumId}/photos
 * 
 * @param groupId - 그룹 ID
 * @param tierAlbumId - 티어 앨범 ID
 * @param photoIds - 삭제할 사진 ID 배열
 */
export const removePhotosFromTierAlbum = async (
  groupId: number,
  tierAlbumId: number,
  photoIds: number[]
): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(
    `/api/groups/${groupId}/tier-albums/${tierAlbumId}/photos`,
    {
      data: { photoIds }
    }
  );
};
import { apiClient, ApiResponse } from "@/shared/api/http";

// 티어 앨범 생성 요청 타입
export interface CreateTierAlbumRequest {
  photoIds: number[];
}

// 티어 앨범 사진 정보 타입 (API 응답)
export interface TierAlbumPhoto {
  photoId: number;
  thumbnailUrl: string;
  originalUrl: string;
  sequence: number;
}

// 티어 앨범 조회 응답 타입 (실제 API 명세)
export interface TierAlbum {
  title: string;
  description: string;
  thumbnailUrl: string;
  originalUrl: string;
  photoCount: number;
  photos: {
    S: TierAlbumPhoto[];
    A: TierAlbumPhoto[];
    B: TierAlbumPhoto[];
    C: TierAlbumPhoto[];
    D: TierAlbumPhoto[];
  };
}

// 티어 앨범 수정 요청 타입 (실제 API 명세)
export interface UpdateTierAlbumRequest {
  name: string;
  description: string;
  thumbnailId: number;
  photos: {
    S: number[];
    A: number[];
    B: number[];
    C: number[];
    D: number[];
  };
}

// 티어 앨범 목록 아이템 타입
export interface TierAlbumListItem {
  id: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  originalUrl: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

// 티어 앨범 목록 응답 타입
export interface TierAlbumListResponse {
  list: TierAlbumListItem[];
  pageInfo: {
    page: number;
    size: number;
    totalElement: number;
    totalPage: number;
    hasNext: boolean;
  };
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

/**
 * 티어 앨범 조회 (실제 API 명세 기반)
 */
export const getTierAlbum = async (
  groupId: number,
  tierAlbumId: number
): Promise<TierAlbum> => {
  const response = await apiClient.get<ApiResponse<TierAlbum>>(
    `/api/groups/${groupId}/tier-albums/${tierAlbumId}`
  );

  return response.data.data;
};

/**
 * 티어 앨범 수정 (실제 API 명세 기반)
 */
export const updateTierAlbum = async (
  groupId: number,
  tierAlbumId: number,
  data: UpdateTierAlbumRequest
): Promise<void> => {
  await apiClient.put<ApiResponse<null>>(
    `/api/groups/${groupId}/tier-albums/${tierAlbumId}`,
    data
  );
};

/**
 * 티어 앨범 삭제
 */
export const deleteTierAlbum = async (
  groupId: number,
  tierAlbumId: number
): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(
    `/api/groups/${groupId}/tier-albums/${tierAlbumId}`
  );
};

/**
 * 티어 앨범 목록 조회
 */
export const getTierAlbumList = async (
  groupId: number,
  page: number = 0,
  size: number = 12
): Promise<TierAlbumListResponse> => {
  const response = await apiClient.get<ApiResponse<TierAlbumListResponse>>(
    `/api/groups/${groupId}/tier-albums`,
    {
      params: { page, size }
    }
  );

  return response.data.data;
};
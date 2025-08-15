import { apiClient, ApiResponse } from "@/shared/api/http";
import { TimelineAlbum, TimelineSection } from "@/entities/album";

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

// 타임라인 앨범 수정 요청 타입
export interface UpdateTimelineAlbumRequest {
  name: string;
  description: string;
  thumbnailId: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  sections: {
    id?: number; // 기존 섹션은 ID 포함, 새 섹션은 없음
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    photoIds: number[];
  }[];
}

// 타임라인 앨범 수정 응답 타입
export interface UpdateTimelineAlbumResponse {
  albumId: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  originalUrl: string;
  startDate: string;
  endDate: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

// 타임라인 앨범 목록 아이템 타입
export interface TimelineAlbumListItem {
  albumId: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  originalUrl: string;
  startDate: string;
  endDate: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

// 타임라인 앨범 목록 응답 타입
export interface TimelineAlbumListResponse {
  list: TimelineAlbumListItem[];
  pageInfo: {
    hasNext: boolean;
    page: number;
    size: number;
    totalPage: number;
    totalElement: number;
  };
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

/**
 * 타임라인 앨범 수정
 */
export const updateTimelineAlbum = async (
  groupId: number,
  albumId: number,
  data: UpdateTimelineAlbumRequest
): Promise<UpdateTimelineAlbumResponse> => {
  const response = await apiClient.put<ApiResponse<UpdateTimelineAlbumResponse>>(
    `/api/groups/${groupId}/timeline-albums/${albumId}`,
    data
  );

  return response.data.data;
};

/**
 * 타임라인 앨범 조회
 */
export const getTimelineAlbum = async (
  groupId: number,
  albumId: number
): Promise<TimelineAlbum> => {
  const response = await apiClient.get<ApiResponse<TimelineAlbum>>(
    `/api/groups/${groupId}/timeline-albums/${albumId}`
  );

  return response.data.data;
};

/**
 * 타임라인 앨범 목록 조회
 */
export const getTimelineAlbumList = async (
  groupId: number,
  page: number = 0,
  size: number = 12
): Promise<TimelineAlbumListResponse> => {
  const response = await apiClient.get<ApiResponse<TimelineAlbumListResponse>>(
    `/api/groups/${groupId}/timeline-albums`,
    {
      params: { page, size }
    }
  );

  return response.data.data;
};

/**
 * 타임라인 앨범 삭제
 */
export const deleteTimelineAlbum = async (
  groupId: number,
  albumId: number
): Promise<void> => {
  await apiClient.delete<ApiResponse<{}>>(
    `/api/groups/${groupId}/timeline-albums/${albumId}`
  );
};
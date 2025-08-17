import { apiClient, ApiResponse } from "@/shared/api/http";
import {
  HighlightAlbumsResponse,
  HighlightAlbumDetail,
  CreateHighlightAlbumRequest,
  UpdateHighlightAlbumRequest,
  DeletePhotosFromAlbumRequest,
  UploadScreenshotRequest,
  UploadScreenshotResponse
} from "@/entities/highlight";


// 하이라이트 앨범 목록 조회
export const getHighlightAlbums = async (
  groupId: number
): Promise<HighlightAlbumsResponse> => {
  const response = await apiClient.get<ApiResponse<HighlightAlbumsResponse>>(
    `/api/groups/${groupId}/highlight-albums`
  );
  return response.data.data;
};

// 하이라이트 앨범 생성
export const createHighlightAlbum = async (
  groupId: number,
  request: CreateHighlightAlbumRequest
): Promise<HighlightAlbumDetail> => {
  const response = await apiClient.post<ApiResponse<HighlightAlbumDetail>>(
    `/api/groups/${groupId}/highlight-albums`, 
    request
  );
  return response.data.data;
};

// 하이라이트 앨범 상세 조회
export const getHighlightAlbumDetail = async (
  groupId: number, 
  albumId: number
): Promise<HighlightAlbumDetail> => {
  const response = await apiClient.get<ApiResponse<HighlightAlbumDetail>>(
    `/api/groups/${groupId}/highlight-albums/${albumId}`
  );
  return response.data.data;
};

// 하이라이트 앨범 수정 (이름, 설명, 썸네일)
export const updateHighlightAlbum = async (
  groupId: number,
  albumId: number,
  request: UpdateHighlightAlbumRequest
): Promise<HighlightAlbumDetail> => {
  const response = await apiClient.put<ApiResponse<HighlightAlbumDetail>>(
    `/api/groups/${groupId}/highlight-albums/${albumId}`,
    request
  );
  return response.data.data;
};

// 하이라이트 앨범 삭제
export const deleteHighlightAlbum = async (
  groupId: number,
  albumId: number
): Promise<HighlightAlbumDetail> => {
  const response = await apiClient.delete<ApiResponse<HighlightAlbumDetail>>(
    `/api/groups/${groupId}/highlight-albums/${albumId}`
  );
  return response.data.data;
};

// 하이라이트 앨범에서 사진 삭제
export const deletePhotosFromAlbum = async (
  groupId: number,
  albumId: number,
  request: DeletePhotosFromAlbumRequest
): Promise<HighlightAlbumDetail> => {
  const response = await apiClient.delete<ApiResponse<HighlightAlbumDetail>>(
    `/api/groups/${groupId}/highlight-albums/${albumId}/photos`,
    { data: request }
  );
  return response.data.data;
};

// 스크린샷 업로드
export const uploadScreenshot = async (
  groupId: number,
  request: UploadScreenshotRequest
): Promise<UploadScreenshotResponse> => {
  const response = await apiClient.post<ApiResponse<UploadScreenshotResponse>>(
    `/api/groups/${groupId}/highlight-albums/photos`,
    request
  );
  return response.data.data;
};
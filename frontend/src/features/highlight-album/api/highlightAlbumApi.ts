import { apiClient, ApiResponse } from "@/shared/api/http";

interface GetHighlightAlbumsData {
  highlightAlbums: GetHighlightAlbumsItem[];
}

interface GetHighlightAlbumsItem {
  id: number;
  name: string;
  description: string;
  thumbnailUrl: string;
}

interface PostHighlightAlbumsData {
  albumId: number
  groupId: number
  name: string
  description: string
  photoCount: number
  photos: HighlightAlbumPhoto[]
}

interface HighlightAlbumPhoto {
  photoId: number
  memberId: number
  chatSessionId: string
  // public Url
  photoUrl: string
  type: string
  takenAt: string
}


// 하이라이트 앨범 목록 조회
export const getHighlightAlbums = async (
  groupId: number
): Promise<GetHighlightAlbumsData> => {
  // response는 highlightAlbums[] 이다.
  const response = await apiClient.get<ApiResponse<GetHighlightAlbumsData>>(
    `/api/groups/${groupId}/highlight-albums`,
  );

  return response.data.data;
};

// 하이라이트 앨범 '생성'
export const postHighlightAlbums = async (
  groupId: number,
  chatSessionId: string
) : Promise<PostHighlightAlbumsData> => {
  const response = await apiClient.post<ApiResponse<PostHighlightAlbumsData>>(
    `/api/groups/${groupId}/highlight-albums`, 
    { chatSessionId }
  )
  return response.data.data
}

// 하이라이트 앨범 상세 조회
export const getHighlightAlbumDetail = async (
  groupId: number, 
  albumId: number
): Promise<GetHighlightAlbumsData> => {
  const response = await apiClient.get<ApiResponse<GetHighlightAlbumsData>>(
    `/api/groups/${groupId}/highlight-albums/${albumId}`
  );
  return response.data.data;
};
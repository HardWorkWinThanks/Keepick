// 하이라이트 앨범 목록 항목
export interface HighlightAlbumItem {
  id: number
  name: string
  description: string
  thumbnailUrl: string
}

// 하이라이트 앨범 상세
export interface HighlightAlbumDetail {
  albumId: number
  groupId: number
  name: string
  description: string
  photoCount: number
  photos: Record<string, HighlightPhoto[]> // 감정별 카테고리 (LAUGH, SURPRISE, TIRED, SERIOUS)
}

// 하이라이트 사진
export interface HighlightPhoto {
  photoId: number
  memberId: number
  chatSessionId: string
  photoUrl: string
  type: "LAUGH" | "SURPRISE" | "TIRED" | "SERIOUS"
  takenAt: string
}

// API 요청 타입들
export interface CreateHighlightAlbumRequest {
  chatSessionId: string
}

export interface UpdateHighlightAlbumRequest {
  name: string
  description: string
  thumbnailId: number
}

export interface DeletePhotosFromAlbumRequest {
  deletePhotoIds: number[]
}

export interface UploadScreenshotRequest {
  chatSessionId: string
  type: "LAUGH" | "SURPRISE" | "TIRED" | "SERIOUS"
  imageUrl: string
  takenAt: string
}

// API 응답 타입들
export interface HighlightAlbumsResponse {
  highlightAlbums: HighlightAlbumItem[]
}

export interface UploadScreenshotResponse {
  photoId: number
  memberId: number
  chatSessionId: string
  photoUrl: string
  type: "LAUGH" | "SURPRISE" | "TIRED" | "SERIOUS"
  takenAt: string
}

// UI에서 사용할 감정 카테고리 정보
export interface EmotionCategory {
  emotion: string
  icon: string
  label: string
  color: string
  photos: HighlightPhoto[]
}
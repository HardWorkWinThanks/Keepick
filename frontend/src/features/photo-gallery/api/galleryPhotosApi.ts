import { apiClient, ApiResponse } from "@/shared/api/http"

// 사진 필터링 요청 타입
export interface PhotoFilterRequest {
  memberIds?: number[]
  tags?: string[]
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  page?: number
  size?: number
}

// 사진 정보 타입
export interface PhotoInfo {
  photoId: number
  originalUrl: string
  thumbnailUrl: string
  takenAt: string // ISO datetime
  width: number
  height: number
}

// 페이지 정보 타입
export interface PageInfo {
  hasNext: boolean
  page: number
  size: number
  totalPage: number
  totalElement: number
}

// 사진 목록 응답 타입
export interface PhotoListResponse {
  list: PhotoInfo[]
  pageInfo: PageInfo
}

// 사진 태그 응답 타입
export interface PhotoTagsResponse {
  tags: string  // "[동물, 음식]" 형태의 문자열
  memberNicknames: string  // "[가가, 나나]" 형태의 문자열
}

/**
 * 그룹 사진 필터링 조회
 */
export const getGroupPhotos = async (
  groupId: number,
  filters: PhotoFilterRequest = {}
): Promise<PhotoListResponse> => {
  const response = await apiClient.post<ApiResponse<PhotoListResponse>>(
    `/api/groups/${groupId}/photos`,
    filters
  )
  
  return response.data.data
}

/**
 * 특정 사진의 태그 조회
 */
export const getPhotoTags = async (
  groupId: number,
  photoId: number
): Promise<PhotoTagsResponse> => {
  const response = await apiClient.get<ApiResponse<PhotoTagsResponse>>(
    `/api/groups/${groupId}/photos/${photoId}/tags`
  )
  
  return response.data.data
}

/**
 * 문자열 형태의 태그를 배열로 파싱하는 유틸리티 함수
 * "[동물, 음식]" → ["동물", "음식"]
 */
export const parseTagsString = (tagsString: string): string[] => {
  try {
    // 문자열에서 대괄호 제거하고 쉼표로 분리
    const cleaned = tagsString.replace(/^\[|\]$/g, '').trim()
    if (!cleaned) return []
    
    return cleaned.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
  } catch (error) {
    console.error('태그 파싱 오류:', error)
    return []
  }
}

/**
 * 문자열 형태의 멤버 닉네임을 배열로 파싱하는 유틸리티 함수
 * "[가가, 나나]" → ["가가", "나나"]
 */
export const parseMemberNicknamesString = (nicknamesString: string): string[] => {
  try {
    // 문자열에서 대괄호 제거하고 쉼표로 분리
    const cleaned = nicknamesString.replace(/^\[|\]$/g, '').trim()
    if (!cleaned) return []
    
    return cleaned.split(',').map(name => name.trim()).filter(name => name.length > 0)
  } catch (error) {
    console.error('멤버 닉네임 파싱 오류:', error)
    return []
  }
}
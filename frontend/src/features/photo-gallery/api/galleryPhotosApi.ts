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

// 유사사진 클러스터 타입
export interface SimilarPhotoCluster {
  clusterId: number
  thumbnailPhotoId: number
  thumbnailUrl: string
  photoCount: number
  photos: PhotoInfo[]
}

// 유사사진 목록 응답 타입
export interface SimilarPhotoListResponse {
  list: SimilarPhotoCluster[]
  pageInfo: PageInfo
}

// 그룹 초기화면 개요 응답 타입
export interface GroupOverviewResponse {
  allPhotos: PhotoListResponse
  blurredPhotos: PhotoListResponse
  similarPhotos: SimilarPhotoListResponse
}

// 사진 삭제 요청 타입
export interface DeletePhotosRequest {
  photoIds: number[]
}

// 사진 삭제 응답 타입
export interface DeletePhotosResponse {
  deletedPhotoIds: number[]
  unDeletedPhotoIds: number[]
}

/**
 * 그룹 초기화면 로딩 (전체사진, 흐린사진, 유사사진 묶음) - 전체 사진에서 더보기 시에도 사용
 */
export const getGroupOverview = async (
  groupId: number,
  size?: number
): Promise<GroupOverviewResponse> => {
  const url = size 
    ? `/api/groups/${groupId}/photos/overview?size=${size}`
    : `/api/groups/${groupId}/photos/overview`
    
  const response = await apiClient.get<ApiResponse<GroupOverviewResponse>>(url)
  
  return response.data.data
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

/**
 * 그룹 흐린사진 조회
 */
export const getGroupBlurredPhotos = async (
  groupId: number,
  filters: PhotoFilterRequest = {}
): Promise<PhotoListResponse> => {
  const response = await apiClient.get<ApiResponse<PhotoListResponse>>(
    `/api/groups/${groupId}/blurred`
  )
  
  return response.data.data
}

/**
 * 그룹 유사사진 클러스터 조회
 */
export const getGroupSimilarPhotos = async (
  groupId: number,
  filters: PhotoFilterRequest = {}
): Promise<SimilarPhotoListResponse> => {
  const response = await apiClient.get<ApiResponse<SimilarPhotoListResponse>>(
    `/api/groups/${groupId}/similar`
  )
  
  return response.data.data
}

/**
 * 그룹 사진 삭제
 */
export const deleteGroupPhotos = async (
  groupId: number,
  photoIds: number[]
): Promise<DeletePhotosResponse> => {
  const response = await apiClient.delete<ApiResponse<DeletePhotosResponse>>(
    `/api/groups/${groupId}/photos`,
    {
      data: { photoIds }
    }
  )
  
  return response.data.data
}

/**
 * API PhotoInfo를 갤러리용 GalleryPhoto로 변환하는 유틸리티 함수
 */
export const convertToGalleryPhoto = (photoInfo: PhotoInfo): any => {
  const aspectRatio = photoInfo.width / photoInfo.height
  
  // 날짜 파싱 안전 처리 (S3 업로드 시 추출된 메타데이터 사용)
  const formatPhotoDate = (takenAt: string): string => {
    try {
      if (!takenAt) {
        console.warn(`사진 ${photoInfo.photoId}: takenAt 정보가 없습니다`)
        return "날짜 정보 없음"
      }
      
      const date = new Date(takenAt)
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        console.warn(`사진 ${photoInfo.photoId}: 유효하지 않은 날짜 형식 - ${takenAt}`)
        return "날짜 형식 오류"
      }
      
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (error) {
      console.error(`사진 ${photoInfo.photoId} 날짜 파싱 오류:`, error)
      return "날짜 파싱 오류"
    }
  }
  
  return {
    id: photoInfo.photoId,
    src: photoInfo.thumbnailUrl, // 썸네일 URL 사용
    originalSrc: photoInfo.originalUrl, // 원본 URL 저장
    title: `사진 #${photoInfo.photoId}`,
    category: "일반", // 기본 카테고리
    aspectRatio,
    width: photoInfo.width,
    height: photoInfo.height,
    date: formatPhotoDate(photoInfo.takenAt), // S3 메타데이터에서 추출된 촬영 일시 사용
    originalTakenAt: photoInfo.takenAt, // 원본 ISO 날짜 정보도 보존
    tags: [], // 초기에는 빈 배열, 별도 API로 로드
  }
}
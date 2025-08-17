/**
 * 전역 Placeholder 이미지 상수
 * 
 * 모든 컴포넌트에서 일관된 placeholder 이미지를 사용하기 위한 중앙화된 상수
 */

// 기본 placeholder 이미지 경로
export const PLACEHOLDERS = {
  // 사용자 프로필 관련
  USER_PROFILE: "/placeholder/basic_profile.webp",
  
  // 사진/이미지 관련  
  PHOTO: "/placeholder/photo-placeholder.svg",
  
  // 그룹 관련
  GROUP_THUMBNAIL: "/placeholder/photo-placeholder.svg", // 그룹도 사진 placeholder 사용
  
  // 일반 이미지
  GENERAL: "/placeholder/photo-placeholder.svg"
} as const

// 더미 이미지 경로 (개발/테스트용)
export const DUMMY_IMAGES = {
  // 그룹 기본 썸네일
  GROUP_DEFAULT: "/dummy/jeju-dummy1.webp",
  
  // 프로필 식별 이미지
  PROFILE_ID: "/dummy/dummy2.jpg",
  
  // 메인 더미 이미지들 (필요시 사용)
  MAIN: (index: number) => `/dummy/main-dummy${index}.jpg`,
  JEJU: (index: number) => `/dummy/jeju-dummy${index}.webp`, 
  SSAFY: (index: number) => `/dummy/ssafy-dummy${index}.jpg`
} as const

// Placeholder 헬퍼 함수들
export const getProfilePlaceholder = (profileUrl?: string | null): string => {
  return profileUrl?.trim() || PLACEHOLDERS.USER_PROFILE
}

export const getPhotoPlaceholder = (photoUrl?: string | null): string => {
  return photoUrl?.trim() || PLACEHOLDERS.PHOTO
}

export const getGroupThumbnailPlaceholder = (thumbnailUrl?: string | null): string => {
  return thumbnailUrl?.trim() || PLACEHOLDERS.GROUP_THUMBNAIL
}

// 타입 정의
export type PlaceholderType = keyof typeof PLACEHOLDERS
export type DummyImageType = keyof typeof DUMMY_IMAGES
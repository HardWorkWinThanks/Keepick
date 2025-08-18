import type { DragPhotoData } from "@/entities/photo"

// 드래그 소스 타입 정의
export type DragSource = "available" | "S" | "A" | "B" | "C" | "D" | "cover-image"

// 드래그 데이터 검증 결과 타입
export interface ValidationResult {
  isValid: boolean
  error?: string
  data?: DragPhotoData
}

/**
 * 드래그 이벤트에서 데이터를 안전하게 파싱하고 검증하는 함수
 */
export function validateDragData(event: React.DragEvent): ValidationResult {
  try {
    const dragDataString = event.dataTransfer.getData("text/plain")
    
    // 빈 데이터 검사
    if (!dragDataString || dragDataString.trim() === '') {
      return {
        isValid: false,
        error: '드래그 데이터가 비어있습니다'
      }
    }
    
    // JSON 파싱
    const dragData = JSON.parse(dragDataString) as DragPhotoData
    
    // 필수 필드 검증
    if (!dragData.photoId || typeof dragData.photoId !== 'number') {
      return {
        isValid: false,
        error: 'photoId가 유효하지 않습니다'
      }
    }
    
    if (!dragData.source || typeof dragData.source !== 'string') {
      return {
        isValid: false,
        error: 'source가 유효하지 않습니다'
      }
    }
    
    if (!dragData.originalUrl || typeof dragData.originalUrl !== 'string') {
      return {
        isValid: false,
        error: 'originalUrl이 유효하지 않습니다'
      }
    }
    
    if (!dragData.thumbnailUrl || typeof dragData.thumbnailUrl !== 'string') {
      return {
        isValid: false,
        error: 'thumbnailUrl이 유효하지 않습니다'
      }
    }
    
    return {
      isValid: true,
      data: dragData
    }
    
  } catch (error) {
    return {
      isValid: false,
      error: `드래그 데이터 파싱 실패: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * 드래그 소스가 유효한 티어인지 확인
 */
export function isValidTierSource(source: string): source is "S" | "A" | "B" | "C" | "D" {
  return ["S", "A", "B", "C", "D"].includes(source)
}

/**
 * 드래그 소스가 사이드바(available)인지 확인
 */
export function isSidebarSource(source: string): boolean {
  return source === "available"
}

/**
 * 드래그 소스가 대표이미지인지 확인
 */
export function isCoverImageSource(source: string): boolean {
  return source === "cover-image"
}

/**
 * 드래그 데이터를 생성하는 헬퍼 함수
 */
export function createDragData(
  photoId: number,
  source: DragSource,
  originalUrl: string,
  thumbnailUrl: string,
  name?: string
): string {
  const dragData: DragPhotoData = {
    photoId,
    source,
    originalUrl,
    thumbnailUrl,
    name
  }
  return JSON.stringify(dragData)
}

/**
 * 에러 로깅을 위한 헬퍼 함수
 */
export function logDragError(context: string, error: string, originalData?: string) {
  console.error(`[${context}] ${error}`)
  if (originalData) {
    console.error(`원본 데이터:`, originalData)
  }
}
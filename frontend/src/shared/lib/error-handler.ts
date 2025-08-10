import { toast } from "@/shared/ui/shadcn/use-toast"

// 에러 타입 정의
export interface AppError {
  code: string
  message: string
  details?: any
}

// API 에러 응답 타입
export interface ApiErrorResponse {
  status: number
  message: string
  code?: string
  details?: any
}

/**
 * API 에러를 AppError로 변환
 */
export function parseApiError(error: any): AppError {
  // Axios 에러 처리
  if (error.response?.data) {
    const data = error.response.data as ApiErrorResponse
    return {
      code: data.code || `HTTP_${error.response.status}`,
      message: data.message || '서버에서 오류가 발생했습니다.',
      details: data.details || error.response.data
    }
  }

  // 네트워크 에러
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return {
      code: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인해주세요.',
      details: error
    }
  }

  // 타임아웃 에러
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT_ERROR',
      message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
      details: error
    }
  }

  // 기본 에러
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || '알 수 없는 오류가 발생했습니다.',
    details: error
  }
}

/**
 * 그룹 관련 에러 메시지 매핑
 */
const GROUP_ERROR_MESSAGES: Record<string, string> = {
  'GROUP_NOT_FOUND': '그룹을 찾을 수 없습니다.',
  'GROUP_ALREADY_EXISTS': '이미 존재하는 그룹명입니다.',
  'GROUP_ACCESS_DENIED': '그룹에 접근할 권한이 없습니다.',
  'GROUP_MEMBER_LIMIT': '그룹 멤버 수 제한에 도달했습니다.',
  'GROUP_CREATE_FAILED': '그룹 생성에 실패했습니다.',
  'GROUP_UPDATE_FAILED': '그룹 정보 수정에 실패했습니다.',
  'GROUP_DELETE_FAILED': '그룹 탈퇴에 실패했습니다.',
}

/**
 * 그룹 관련 에러 핸들러
 */
export function handleGroupError(error: unknown, operation: string) {
  const appError = parseApiError(error)
  
  // 그룹 특화 에러 메시지 적용
  const errorMessage = GROUP_ERROR_MESSAGES[appError.code] || appError.message

  console.error(`그룹 ${operation} 실패:`, {
    code: appError.code,
    message: errorMessage,
    details: appError.details
  })

  // 토스트 메시지 표시
  toast({
    title: "오류 발생",
    description: errorMessage,
    variant: "destructive"
  })

  return appError
}

/**
 * 일반적인 에러 핸들러
 */
export function handleError(error: unknown, title: string = "오류 발생") {
  const appError = parseApiError(error)
  
  console.error(`${title}:`, {
    code: appError.code,
    message: appError.message,
    details: appError.details
  })

  toast({
    title,
    description: appError.message,
    variant: "destructive"
  })

  return appError
}

/**
 * 성공 메시지 표시
 */
export function showSuccessMessage(title: string, description?: string) {
  toast({
    title,
    description,
    variant: "default",
    className: "bg-green-600 text-white border-green-600"
  })
}

/**
 * 정보 메시지 표시
 */
export function showInfoMessage(title: string, description?: string) {
  toast({
    title,
    description,
    variant: "default"
  })
}
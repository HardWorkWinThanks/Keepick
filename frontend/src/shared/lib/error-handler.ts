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
  // 상세한 에러 로깅을 위한 원본 에러 정보 보존
  const originalError = {
    message: error?.message,
    code: error?.code,
    response: error?.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers
    } : null,
    request: error?.request ? 'Request object exists' : null,
    stack: error?.stack
  }

  // Axios 에러 처리
  if (error.response?.data) {
    const data = error.response.data as ApiErrorResponse
    return {
      code: data.code || `HTTP_${error.response.status}`,
      message: data.message || '서버에서 오류가 발생했습니다.',
      details: {
        apiError: data,
        status: error.response.status,
        statusText: error.response.statusText,
        originalError
      }
    }
  }

  // Axios 에러이지만 response.data가 없는 경우
  if (error.response) {
    return {
      code: `HTTP_${error.response.status}`,
      message: `서버 오류 (${error.response.status}): ${error.response.statusText}`,
      details: {
        status: error.response.status,
        statusText: error.response.statusText,
        originalError
      }
    }
  }

  // 요청 자체가 실패한 경우 (네트워크 에러 등)
  if (error.request) {
    return {
      code: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인해주세요.',
      details: {
        request: 'Request was made but no response received',
        originalError
      }
    }
  }

  // 네트워크 에러
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return {
      code: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인해주세요.',
      details: originalError
    }
  }

  // 타임아웃 에러
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT_ERROR',
      message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
      details: originalError
    }
  }

  // 기본 에러
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || '알 수 없는 오류가 발생했습니다.',
    details: originalError
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
  'INVITATION_NOT_FOUND': '초대를 찾을 수 없습니다.',
  'INVITATION_EXPIRED': '초대가 만료되었습니다.',
  'INVITATION_ALREADY_PROCESSED': '이미 처리된 초대입니다.',
  'INVITATION_INVALID': '유효하지 않은 초대입니다.',
  'MEMBER_ALREADY_EXISTS': '이미 그룹의 멤버입니다.',
  'HTTP_400': '잘못된 요청입니다. 요청 정보를 확인해주세요.',
  'HTTP_401': '인증이 필요합니다. 다시 로그인해주세요.',
  'HTTP_403': '권한이 없습니다.',
  'HTTP_404': '요청한 정보를 찾을 수 없습니다.',
  'HTTP_409': '이미 처리된 요청이거나 충돌이 발생했습니다.',
  'HTTP_500': '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
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
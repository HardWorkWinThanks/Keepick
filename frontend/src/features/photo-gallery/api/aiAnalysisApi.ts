import { apiClient, ApiResponse } from "@/shared/api/http"

// AI 분석 요청 타입
export interface AiAnalysisRequest {
  photoIds: number[]
}

// AI 분석 응답 타입
export interface AiAnalysisResponse {
  jobId: string
  jobStatus: "STARTED" | "PROCESSING" | "COMPLETED" | "FAILED"
}

// SSE 메시지 타입
export interface AnalysisStatusMessage {
  jobId: string
  message: string
  jobStatus: "STARTED" | "PROCESSING" | "COMPLETED" | "FAILED"
  completedJob: number
  totalJob: number
  failedJob: number
  pendingJob: number
}

/**
 * AI 3종 처리 요청 (태깅, 얼굴매칭, 흐린사진 판별)
 */
export const requestAiAnalysis = async (
  groupId: number,
  photoIds: number[]
): Promise<AiAnalysisResponse> => {
  const response = await apiClient.post<ApiResponse<AiAnalysisResponse>>(
    `/api/groups/${groupId}/photos/analysis/integration`,
    { photoIds }
  )
  
  return response.data.data
}

/**
 * AI 분석 상태 SSE 연결
 */
export const createAnalysisStatusSSE = (
  groupId: number,
  jobId: string,
  onMessage: (data: AnalysisStatusMessage) => void,
  onError: (error: Event) => void,
  onClose: () => void
): EventSource => {
  const url = `/api/groups/${groupId}/photos/analysis/status/${jobId}`
  const eventSource = new EventSource(url)
  
  eventSource.onmessage = (event) => {
    try {
      const data: AnalysisStatusMessage = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error('SSE 메시지 파싱 오류:', error)
      onError(event)
    }
  }
  
  eventSource.onerror = (event) => {
    console.error('SSE 연결 오류:', event)
    onError(event)
  }
  
  eventSource.onopen = () => {
    console.log('SSE 연결 성공')
  }
  
  // 연결이 끊어졌을 때의 처리
  const originalClose = eventSource.close.bind(eventSource)
  eventSource.close = () => {
    originalClose()
    onClose()
  }
  
  return eventSource
}

// TODO: 추후 재연결 로직 추가 고려중
// export const createAnalysisStatusSSEWithReconnect = (...) => { ... }
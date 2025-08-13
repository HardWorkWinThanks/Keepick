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
 * 유사사진 분류 요청 (단독 실행)
 */
export const requestSimilarPhotosAnalysis = async (
  groupId: number
): Promise<AiAnalysisResponse> => {
  const response = await apiClient.post<ApiResponse<AiAnalysisResponse>>(
    `/api/groups/${groupId}/photos/analysis/similarity`
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
  // 토큰을 URL 쿼리 파라미터로 전달 (SSE는 헤더 설정 불가)
  // const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/groups/${groupId}/photos/analysis/status/${jobId}`
  // const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
  
  const eventSource = new EventSource(url)
  
  // 기본 메시지 리스너
  // eventSource.onmessage = (event) => {
  //   try {
  //     console.log('SSE 기본 메시지:', event.data)
  //     const data: AnalysisStatusMessage = JSON.parse(event.data)
  //     console.log('SSE 파싱된 데이터:', data)
  //     onMessage(data)
  //   } catch (error) {
  //     console.error('SSE 메시지 파싱 오류:', error, 'Raw data:', event.data)
  //   }
  // }
  
  // job-status 이벤트 전용 리스너 추가
  eventSource.addEventListener('job-status', (event) => {
    try {
      console.log('SSE job-status 이벤트:', event.data)
      const data: AnalysisStatusMessage = JSON.parse(event.data)
      console.log('SSE job-status 파싱된 데이터:', data)
      onMessage(data)
    } catch (error) {
      console.error('SSE job-status 파싱 오류:', error, 'Raw data:', event.data)
    }
  })
  
  eventSource.onerror = (event) => {
    // console.error('SSE 연결 오류:', {
    //   event,
    //   readyState: eventSource.readyState,
    //   url: eventSource.url
    // })
    
    // readyState 상태 정보 추가
    const stateMessages = {
      0: 'CONNECTING',
      1: 'OPEN', 
      2: 'CLOSED'
    }
    // console.error(`SSE 상태: ${stateMessages[eventSource.readyState as keyof typeof stateMessages] || 'UNKNOWN'}`)
    
    // 연결 상태에 따른 처리
    if (eventSource.readyState === 0) { // CONNECTING
      console.log('SSE 연결 중 일시적 오류 (무시)')
      // CONNECTING 상태의 오류는 무시 (재연결 시도)
    } else if (eventSource.readyState === 2) { // CLOSED
      console.log('SSE 연결이 정상적으로 종료됨')
    } else {
      // OPEN 상태에서의 오류만 실제 오류로 처리
      onError(event)
    }
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
// UserFeedbackManager.ts - 사용자 피드백 및 UI 업데이트 전담 매니저

export type FeedbackEventType = 
  | 'operation:start'
  | 'operation:success' 
  | 'operation:failed'
  | 'operation:timeout'
  | 'recovery:progress'
  | 'recovery:success'
  | 'recovery:failed';

export interface FeedbackEventDetail {
  producerId: string;
  trackType?: string;
  error?: any;
  userMessage?: string;
  currentAttempt?: number;
  maxAttempts?: number;
}

export class UserFeedbackManager {
  private eventPrefix = 'webrtc:';

  // 작업 시작 알림
  public notifyOperationStart(producerId: string, trackType: string): void {
    console.log(`🚀 [Operation Start] Starting ${trackType} track for producer ${producerId}`);
    this.dispatchEvent('operation:start', {
      producerId,
      trackType
    });
  }

  // 작업 성공 알림
  public notifyOperationSuccess(producerId: string, trackType: string): void {
    console.log(`✅ [Operation Success] ${trackType} track ready for producer ${producerId}`);
    this.dispatchEvent('operation:success', {
      producerId,
      trackType
    });
  }

  // 작업 실패 알림
  public notifyOperationFailed(producerId: string, error: unknown): void {
    console.error(`❌ [Operation Failed] Producer ${producerId} failed:`, error);
    this.dispatchEvent('operation:failed', {
      producerId,
      error,
      userMessage: '미디어 연결에 실패했습니다.'
    });
  }

  // 작업 타임아웃 알림
  public notifyOperationTimeout(producerId: string): void {
    console.error(`⏰ [Operation Timeout] Producer ${producerId} timed out`);
    this.dispatchEvent('operation:timeout', {
      producerId,
      userMessage: '연결 시간이 초과되었습니다. 다시 시도해주세요.'
    });
  }

  // 복구 진행 상황 알림
  public notifyRecoveryProgress(producerId: string, currentAttempt: number, maxAttempts: number): void {
    console.log(`📧 [Recovery Progress] Producer ${producerId}: Attempt ${currentAttempt}/${maxAttempts}`);
    this.dispatchEvent('recovery:progress', {
      producerId,
      currentAttempt,
      maxAttempts
    });
  }

  // 복구 성공 알림
  public notifyRecoverySuccess(producerId: string): void {
    console.log(`✅ [Recovery Success] Producer ${producerId} recovered successfully`);
    this.dispatchEvent('recovery:success', {
      producerId
    });
  }

  // 복구 실패 알림
  public notifyRecoveryFailed(producerId: string, originalError: any): void {
    console.error(`❌ [Recovery Failed] Producer ${producerId} recovery failed permanently:`, originalError);
    this.dispatchEvent('recovery:failed', {
      producerId,
      error: originalError,
      userMessage: '연결 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }

  // Transport 복구 알림
  public notifyTransportRecovery(status: 'start' | 'success' | 'failed', details?: any): void {
    const messages = {
      start: '🔄 [Transport Recovery] Starting transport recovery...',
      success: '✅ [Transport Recovery] Transport recovered successfully',
      failed: '❌ [Transport Recovery] Transport recovery failed'
    };
    
    console.log(messages[status], details);
    this.dispatchEvent('transport:recovery', {
      producerId: 'transport',
      userMessage: status === 'start' ? '연결을 복구하고 있습니다...' :
                   status === 'success' ? '연결이 복구되었습니다.' :
                   '연결 복구에 실패했습니다.',
      status,
      details
    });
  }

  // 사용자 안내 메시지 (Toast 등에서 사용)
  public getUserMessage(eventType: FeedbackEventType, context?: any): string {
    const messages: Record<FeedbackEventType, string> = {
      'operation:start': '연결을 설정하고 있습니다...',
      'operation:success': '연결이 완료되었습니다.',
      'operation:failed': '연결에 실패했습니다.',
      'operation:timeout': '연결 시간이 초과되었습니다.',
      'recovery:progress': `연결을 복구하고 있습니다... (${context?.currentAttempt}/${context?.maxAttempts})`,
      'recovery:success': '연결이 복구되었습니다.',
      'recovery:failed': '연결 복구에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };

    return messages[eventType] || '알 수 없는 상태입니다.';
  }

  // CustomEvent 디스패치 (브라우저 환경에서만)
  private dispatchEvent(eventType: FeedbackEventType, detail: FeedbackEventDetail): void {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const eventName = `${this.eventPrefix}${eventType}`;
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    }
  }

  // 이벤트 리스너 등록 헬퍼 (컴포넌트에서 사용)
  public addEventListener(
    eventType: FeedbackEventType, 
    handler: (detail: FeedbackEventDetail) => void
  ): () => void {
    if (typeof window === 'undefined') {
      return () => {}; // SSR 환경에서는 아무것도 하지 않음
    }

    const eventName = `${this.eventPrefix}${eventType}`;
    const eventHandler = (event: CustomEvent) => {
      handler(event.detail);
    };

    window.addEventListener(eventName, eventHandler as EventListener);

    // Cleanup 함수 반환
    return () => {
      window.removeEventListener(eventName, eventHandler as EventListener);
    };
  }

  // 디버깅용 - 모든 이벤트 로깅
  public enableDebugLogging(): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const allEventTypes: FeedbackEventType[] = [
      'operation:start', 'operation:success', 'operation:failed', 'operation:timeout',
      'recovery:progress', 'recovery:success', 'recovery:failed'
    ];

    const cleanupFunctions = allEventTypes.map(eventType => {
      return this.addEventListener(eventType, (detail) => {
        console.log(`🎯 [Feedback Event] ${eventType}:`, detail);
      });
    });

    // 모든 리스너 정리 함수
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }
}

export const userFeedbackManager = new UserFeedbackManager();
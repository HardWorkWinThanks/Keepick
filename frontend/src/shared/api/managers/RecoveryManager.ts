// RecoveryManager.ts - 복구 로직 전담 매니저
import { RtpCapabilities, Consumer, Transport } from "mediasoup-client/types";
import { TrackInfo } from "../mediaTrackManager";
import { webrtcHandler } from "../socket";
import { ConsumerCreatedData } from "@/shared/types/webrtc.types";

export interface RecoveryContext {
  producerId: string;
  socketId: string;
  kind: "audio" | "video";
  rtpCapabilities: RtpCapabilities;
  trackType: "camera" | "screen";
  recvTransport: Transport;
  createConsumer: (producerId: string, rtpCapabilities: RtpCapabilities) => Promise<ConsumerCreatedData>;
  onTrackCreated: (trackInfo: TrackInfo) => void;
  onStateCleanup: (producerId: string) => Promise<void>;
}

export class RecoveryManager {
  private retryAttempts = new Map<string, number>();
  private readonly maxRetryAttempts = 3;
  private readonly baseRetryDelay = 1000; // 1초

  // 재시도 가능한 오류인지 판단
  public shouldRetryError(error: any, producerId: string): boolean {
    const currentAttempts = this.retryAttempts.get(producerId) || 0;
    
    // 최대 재시도 횟수 초과 체크
    if (currentAttempts >= this.maxRetryAttempts) {
      console.error(`❌ Max retry attempts (${this.maxRetryAttempts}) exceeded for producer ${producerId}`);
      this.retryAttempts.delete(producerId);
      return false;
    }

    // 재시도 가능한 오류 타입 체크
    if (error instanceof Error) {
      const retryableErrors = [
        'network', 'timeout', 'connection', 'transport',
        'failed to fetch', 'websocket', 'ice', 'dtls',
        'temporary', 'busy', 'unavailable', 'server error'
      ];
      
      const errorMessage = error.message.toLowerCase();
      const isRetryable = retryableErrors.some(keyword => errorMessage.includes(keyword));
      
      if (isRetryable) {
        console.log(`🔄 Retryable error detected for producer ${producerId}: ${error.message}`);
        return true;
      }
    }

    // HTTP 상태 코드 기반 재시도 체크
    if (error.status >= 500 || error.status === 429 || error.status === 408) {
      console.log(`🔄 Server error detected for producer ${producerId}: ${error.status}`);
      return true;
    }

    return false;
  }

  // 복구 시도 실행
  public async attemptRecovery(context: RecoveryContext, originalError: any): Promise<string | null> {
    const { producerId } = context;
    const currentAttempts = this.retryAttempts.get(producerId) || 0;
    this.retryAttempts.set(producerId, currentAttempts + 1);
    
    const delay = this.calculateBackoffDelay(currentAttempts);
    console.log(`🔄 Recovery attempt ${currentAttempts + 1}/${this.maxRetryAttempts} for producer ${producerId} (delay: ${delay}ms)`);
    
    // Exponential backoff 대기
    await this.delay(delay);
    
    try {
      // 1단계: 상태 정리 및 검증
      await context.onStateCleanup(producerId);
      
      // 2단계: Transport 연결 상태 검증
      this.verifyTransportHealth(context.recvTransport);
      
      // 3단계: 안정화 대기
      await this.delay(200);
      
      // 4단계: 재시도 실행
      console.log(`🔄 Retrying consume operation for producer ${producerId}`);
      
      const trackId = `${context.trackType}_remote_${context.socketId}_${context.kind}_${Date.now()}`;
      const consumerData = await context.createConsumer(producerId, context.rtpCapabilities);
      const consumer = await context.recvTransport.consume({
        id: consumerData.id,
        producerId: consumerData.producerId,
        kind: consumerData.kind,
        rtpParameters: consumerData.rtpParameters,
      });

      const trackInfo: TrackInfo = {
        trackId,
        track: consumer.track,
        consumer,
        peerId: context.socketId,
        kind: context.kind,
        trackType: context.trackType,
      };

      // 트랙 생성 콜백 호출
      context.onTrackCreated(trackInfo);
      
      // 성공 후 재시도 횟수 초기화
      this.retryAttempts.delete(producerId);
      console.log(`✅ Recovery successful for producer ${producerId} after ${currentAttempts + 1} attempts`);
      
      return trackId;
      
    } catch (retryError) {
      console.error(`❌ Recovery attempt failed for producer ${producerId}:`, retryError);
      
      // 마지막 시도인 경우
      if (currentAttempts + 1 >= this.maxRetryAttempts) {
        this.retryAttempts.delete(producerId);
        throw new Error(`Failed to recover producer ${producerId} after ${this.maxRetryAttempts} attempts. Original error: ${originalError.message}`);
      }
      
      // 다음 시도를 위해 재귀 호출
      return await this.attemptRecovery(context, originalError);
    }
  }

  // Exponential backoff 계산
  private calculateBackoffDelay(attemptNumber: number): number {
    const exponentialDelay = this.baseRetryDelay * Math.pow(2, attemptNumber);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return Math.min(exponentialDelay + jitter, 10000); // 최대 10초
  }

  // 지연 함수
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Transport 연결 상태 검증
  private verifyTransportHealth(recvTransport: Transport): void {
    if (!recvTransport || recvTransport.closed) {
      throw new Error('Receive transport is not available or closed');
    }
    
    const connectionState = recvTransport.connectionState;
    if (connectionState === 'failed' || connectionState === 'disconnected') {
      console.warn(`⚠️ Transport connection state is ${connectionState}, attempting recovery`);
      throw new Error(`Transport connection state is ${connectionState}`);
    }
  }

  // 정리
  public cleanup(): void {
    this.retryAttempts.clear();
  }

  // 재시도 상태 조회
  public getRetryCount(producerId: string): number {
    return this.retryAttempts.get(producerId) || 0;
  }
}

export const recoveryManager = new RecoveryManager();
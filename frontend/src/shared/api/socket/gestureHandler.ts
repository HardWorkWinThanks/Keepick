// src/shared/api/socket/gestureHandler.ts

import { Socket } from "socket.io-client";
import { AppDispatch } from "@/shared/config/store";
import { GestureData, GestureEffectData, GestureStatusData } from "@/shared/types/ai.types";
import { aiGestureHandler } from '../ai/aiGestureHandler';

class GestureHandler {
  private socket: Socket | null = null;
  private dispatch: AppDispatch | null = null;

  /**
   * Socket GestureHandler를 초기화합니다.
   * @param socket Socket.IO 소켓 인스턴스
   * @param dispatch Redux dispatch 함수
   */
  public initialize(socket: Socket, dispatch: AppDispatch): void {
    this.socket = socket;
    this.dispatch = dispatch;
    // AIGestureHandler 초기화: 여기서 dispatch를 전달하여 Redux와 연동시킵니다.
    aiGestureHandler.init(dispatch);
    this.setupEventListeners();
    
    // gestureHandler를 전역에서 접근 가능하도록 설정 (AIGestureHandler에서 사용)
    if (typeof window !== 'undefined') {
      (window as any).gestureHandler = this;
    }
    
    console.log('[GestureHandler] initialized.');
  }

  /**
   * 소켓 이벤트 리스너를 설정합니다.
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 서버로부터 'gesture_detected' 이벤트 수신
    this.socket.on('gesture_detected', (data: GestureData | GestureEffectData) => {
      console.log('[GestureHandler] Received gesture_detected:', data);
      // 수신된 제스처 데이터를 AIGestureHandler로 전달하여 처리합니다.
      aiGestureHandler.handleReceivedGesture(data);

      // (선택 사항) 기존 UI 업데이트 로직 유지
      // 예를 들어, 특정 컴포넌트가 이벤트를 직접 구독하여 UI를 업데이트하는 경우
      if ('gestureType' in data) { // GestureData 타입
        window.dispatchEvent(new CustomEvent('gestureStaticReceived', { detail: data }));
      } else if ('effect' in data) { // GestureEffectData 타입
        window.dispatchEvent(new CustomEvent('gestureEffectReceived', { detail: data }));
      }
    });

    // 참고: 'emotion_detected' 이벤트는 이제 클라이언트 로컬에서만 처리하므로,
    // 서버로부터 이 이벤트를 수신하는 리스너는 여기에 설정하지 않습니다.
  }

  /**
   * 지정된 이벤트와 데이터로 소켓 메시지를 발행합니다.
   * @param event 이벤트 이름
   * @param args 이벤트 데이터
   */
  private emit(event: string, ...args: unknown[]): void {
    this.socket?.emit(event, ...args);
  }

  /**
   * AI 처리된 제스처 데이터를 서버로 브로드캐스트합니다.
   * 이는 AIGestureHandler에서 호출됩니다.
   * @param data 브로드캐스트할 제스처 데이터 (GestureData 또는 GestureEffectData)
   */
  public broadcastGesture(data: GestureData | GestureEffectData): void {
    this.emit('gesture_detect', data);
    console.log('[GestureHandler] Broadcasted gesture_detect:', data);
  }

  /**
   * (AIGestureHandler에서 호출) 정적 제스처 데이터를 서버로 브로드캐스트합니다.
   * @param data 정적 제스처 데이터
   */
  public broadcastStaticGesture(data: GestureData): void {
    this.broadcastGesture({ ...data, gestureType: 'static' });
  }

  /**
   * (AIGestureHandler에서 호출) 동적 제스처 데이터를 서버로 브로드캐스트합니다.
   * @param data 동적 제스처 데이터
   */
  public broadcastDynamicGesture(data: GestureData): void {
    this.broadcastGesture({ ...data, gestureType: 'dynamic' });
  }

  /**
   * (AIGestureHandler에서 호출) 제스처 효과 데이터를 서버로 브로드캐스트합니다.
   * @param data 제스처 효과 데이터
   */
  public broadcastGestureEffect(data: GestureEffectData): void {
    this.emit('gesture_detect', data); // 'gesture_detect' 이벤트를 통해 효과도 함께 보낼 수 있습니다.
    console.log('[GestureHandler] Broadcasted gesture_effect (via gesture_detect):', data);
  }

  /**
   * 제스처 인식 기능의 상태 변화를 기록합니다. (서버로 전송하지 않음)
   * 이 정보는 서버에 전달할 필요가 없다는 요구사항에 따라 콘솔에만 로깅됩니다.
   * @param data 제스처 상태 데이터
   */
  public broadcastGestureStatus(data: GestureStatusData): void {
    console.log('[GestureHandler] Gesture status (local only):', data);
  }

  /**
   * 룸 정보 변경 시 AIGestureHandler에 알립니다.
   * @param roomId 새로운 방 ID
   */
  public updateRoom(roomId: string): void {
    aiGestureHandler.updateRoomInfo(roomId);
  }

  /**
   * 사용자 정보 변경 시 AIGestureHandler에 알립니다.
   * @param userId 사용자 ID
   * @param userName 사용자 이름
   */
  public updateUser(userId: string, userName: string): void {
    aiGestureHandler.updateUserInfo(userId, userName);
  }
}

export const gestureHandler = new GestureHandler();

// src/shared/types/socket.types.ts

// ============================================================================
// 기본 타입 정의
// ============================================================================
export interface BaseSocketData {
  roomId: string;
  userId: string;
  userName: string;
  timestamp?: number;
}

// ============================================================================
// 채팅 이벤트 관련 타입
// ============================================================================
export interface ChatMessage extends BaseSocketData {
  message: string;
  messageId: string;
}

export interface ChatJoinData {
  roomId: string;
  userName: string;
}

export interface ChatLeaveData {
  roomId: string;
}

export interface SendMessageData {
  roomId: string;
  content: string;
  messageType?: string;
}

export interface EditMessageData {
  roomId: string;
  messageId: string;
  content: string;
}

export interface DeleteMessageData {
  roomId: string;
  messageId: string;
}

export interface TypingData {
  roomId: string;
  isTyping: boolean;
}

export interface GetMessagesData {
  roomId: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// 제스처 이벤트 관련 타입
// ============================================================================
export interface GestureData {
  roomId: string;
  gestureType: "static" | "dynamic";
  label: string;
  emoji: string;
  confidence?: number;
  timestamp: number;
  userId: string;
  userName: string;
}

export interface GestureEffectData {
  roomId: string;
  effect: string;
  emoji: string;
  timestamp: number;
  userId: string;
  userName: string;
  duration?: number;
}

export interface GestureStatusData {
  roomId: string;
  userName: string;
  staticGestureEnabled: boolean;
  dynamicGestureEnabled: boolean;
}

// ============================================================================
// 화면 공유 이벤트 관련 타입
// ============================================================================
export interface ScreenShareStartedData {
  roomId: string;
  peerId: string;
  peerName: string;
  producerId: string;
}

export interface ScreenShareStoppedData {
  peerId: string;
  producerId: string;
}

export interface StartScreenShareData {
  roomId: string;
  peerId?: string;
  transportId: string;
  rtpParameters: unknown;
}

export interface StopScreenShareData {
  roomId: string;
  peerId?: string;
  producerId: string;
}

export interface ConsumeScreenShareData {
  roomId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities: unknown;
}

// ============================================================================
// 일반 이벤트 관련 타입
// ============================================================================
export interface UserLeftData {
  id: string;
  name?: string;
}

export interface ProducerClosedData {
  producerId: string;
}

// ============================================================================
// Socket 이벤트 응답 타입
// ============================================================================
export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// 타입 가드 함수들
// ============================================================================
export const isSocketResponse = (data: unknown): data is SocketResponse => {
  return typeof data === 'object' && data !== null && 'success' in data && typeof (data as SocketResponse).success === 'boolean';
};

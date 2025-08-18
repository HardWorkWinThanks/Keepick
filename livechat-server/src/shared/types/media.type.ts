// src/shared/types/media.type
import { RtpCapabilities, RtpParameters } from "mediasoup/node/lib/types";
// ============================================================================
// 기본 미디어 타입 정의
// ============================================================================

export type MediaTrackType = "camera" | "screen" | "audio";

// ============================================================================
// AppData 인터페이스 정의
// ============================================================================

export interface ProducerAppData {
  type: MediaTrackType;
  peerId: string;
  peerName?: string;
  trackId?: string;

  // 화면 공유 전용 메타데이터
  screenShare?: {
    resolution?: {
      width: number;
      height: number;
    };
    frameRate?: number;
    startedAt: number;
  };

  // 카메라/오디오 전용 메타데이터
  media?: {
    deviceId?: string;
    deviceLabel?: string;
    facingMode?: "user" | "environment";
  };

  // 확장 가능한 메타데이터
  metadata?: Record<string, any>;
}

export interface ConsumerAppData extends ProducerAppData {
  producerId: string;
  consumerId: string;
  consumerPeerId: string;
}

// ============================================================================
// 사용자 및 피어 관련 타입
// ============================================================================

export interface User {
  id: string;
  name: string;
  socketId?: string;
  avatar?: string;
  role?: "host" | "participant";
  joinedAt: number;
}

export interface PeerWithProducers {
  id: string;
  name: string;
  producers: {
    producerId: string;
    kind: "audio" | "video";
    appData?: ProducerAppData;
  }[];
}

// ============================================================================
// Producer/Consumer 정보 타입
// ============================================================================

export interface ProducerInfo {
  id: string;
  kind: "audio" | "video";
  rtpParameters: any;
  appData: ProducerAppData;
  paused: boolean;
  closed: boolean;
}

export interface ConsumerInfo {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  appData: ConsumerAppData;
  paused: boolean;
  closed: boolean;
}

// ============================================================================
// Socket 이벤트 데이터 타입
// ============================================================================

export interface NewProducerInfo {
  producerId: string;
  producerSocketId: string;
  kind: "audio" | "video";
  rtpParameters?: RtpCapabilities;
  appData: ProducerAppData;
}

export interface ProduceData {
  transportId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  roomId: string;
  appData?: ProducerAppData;
}

export interface ConsumeData {
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  roomId: string;
  appData?: ProducerAppData;
}

export interface ConsumerData {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  type: "simple" | "simulcast" | "svc";
  producerPaused: boolean;
  appData?: ConsumerAppData;
}

// ============================================================================
// Transport 관련 타입
// ============================================================================

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}

// ============================================================================
// 응답 타입
// ============================================================================

export interface ProducerCreatedResponse {
  id: string;
  appData?: ProducerAppData;
}

export interface ConsumerCreatedResponse {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  appData?: ProducerAppData;
}

// ============================================================================
// 이벤트 데이터 타입
// ============================================================================

export interface NewProducerEventData {
  producerId: string;
  producerSocketId: string;
  kind: "audio" | "video";
  appData: ProducerAppData;
}

export interface ProducerClosedEventData {
  producerId: string;
  appData?: ProducerAppData;
}

// ============================================================================
// 화면 공유 전용 타입
// ============================================================================

export interface ScreenShareProducerData {
  id: string;
  peerId: string;
  peerName: string;
  roomId: string;
  resolution: { width: number; height: number };
  startedAt: number;
}

// ============================================================================
// 유틸리티 타입 가드
// ============================================================================

export const isScreenShareProducer = (appData: ProducerAppData): boolean => {
  return appData.type === "screen";
};

export const isCameraProducer = (appData: ProducerAppData): boolean => {
  return appData.type === "camera";
};

export const isAudioProducer = (appData: ProducerAppData): boolean => {
  return appData.type === "audio";
};

// ============================================================================
// 헬퍼 함수
// ============================================================================

export const createProducerAppData = (
  type: MediaTrackType,
  peerId: string,
  options?: {
    peerName?: string;
    trackId?: string;
    resolution?: { width: number; height: number };
    frameRate?: number;
    deviceId?: string;
    deviceLabel?: string;
    metadata?: Record<string, any>;
  }
): ProducerAppData => {
  const appData: ProducerAppData = {
    type,
    peerId,
    peerName: options?.peerName,
    trackId: options?.trackId,
    metadata: options?.metadata,
  };

  // 화면 공유 전용 데이터
  if (type === "screen") {
    appData.screenShare = {
      resolution: options?.resolution || { width: 1920, height: 1080 },
      frameRate: options?.frameRate || 30,
      startedAt: Date.now(),
    };
  }

  // 카메라/오디오 전용 데이터
  if (type === "camera" || type === "audio") {
    appData.media = {
      deviceId: options?.deviceId,
      deviceLabel: options?.deviceLabel,
      facingMode: "user", // 기본값
    };
  }

  return appData;
};

// MediaSoup Producer/Consumer의 appData를 안전하게 캐스팅하는 헬퍼
export const getProducerAppData = (
  producer: any
): ProducerAppData | undefined => {
  try {
    return producer.appData as ProducerAppData;
  } catch {
    return undefined;
  }
};

export const getConsumerAppData = (
  consumer: any
): ConsumerAppData | undefined => {
  try {
    return consumer.appData as ConsumerAppData;
  } catch {
    return undefined;
  }
};

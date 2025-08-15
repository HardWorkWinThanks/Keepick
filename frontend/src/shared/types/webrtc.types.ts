import { RtpCapabilities, SctpCapabilities } from "mediasoup-client/types";

export interface User {
  id: string;
  name: string; // 사용자 이름 속성
  producers?: { producerId: string; kind: "audio" | "video" }[];
}

export interface PeerWithProducers {
  id: string;
  name: string;
  producers: {
    producerId: string;
    kind: "audio" | "video";
  }[];
}

export interface NewProducerInfo {
  producerId: string;
  producerSocketId: string;
  kind: "audio" | "video";
  rtpParameters?: RtpCapabilities;
  appData?: any;
}

export interface ProduceData {
  transportId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  roomId: string;
  appData?: any;
}

export interface ConsumeData {
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  roomId: string;
}

export interface ConsumerData {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  type: "simple" | "simulcast" | "svc";
  producerPaused: boolean;
}

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}

// ============================================================================
// MediaSoup Producer/Consumer AppData 타입 정의
// ============================================================================
export type MediaTrackType = "camera" | "screen" | "audio";

export interface ProducerAppData {
  type: MediaTrackType;
  peerId: string;
  peerName?: string;
  trackId?: string;
  screenShare?: {
    resolution?: { width: number; height: number };
    frameRate?: number;
    startedAt: number;
  };
  media?: {
    deviceId?: string;
    deviceLabel?: string;
  };
}

export interface ConsumerAppData extends ProducerAppData {
  producerId: string;
  consumerId: string;
  consumerPeerId: string;
}

export interface ConsumerCreatedData {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  type: string;
  producerPaused: boolean;
  appData?: ProducerAppData;
}

// ============================================================================
// 타입 가드 및 헬퍼 함수
// ============================================================================
export const isScreenShareProducer = (appData: ProducerAppData): boolean => {
  return appData.type === "screen";
};

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
  }
): ProducerAppData => {
  const appData: ProducerAppData = {
    type,
    peerId,
    peerName: options?.peerName,
    trackId: options?.trackId,
  };

  if (type === "screen") {
    appData.screenShare = {
      resolution: options?.resolution || { width: 1920, height: 1080 },
      frameRate: options?.frameRate || 30,
      startedAt: Date.now(),
    };
  } else if (type === "camera" || type === "audio") {
    appData.media = {
      deviceId: options?.deviceId,
      deviceLabel: options?.deviceLabel,
    };
  }
  return appData;
};

// ============================================================================
// WebRTC 연결 관련 타입
// ============================================================================
export interface JoinRoomData {
  roomId: string;
  userName: string;
}

export interface JoinedRoomResponse {
  rtpCapabilities: RtpCapabilities;
  peers: PeerWithProducers[];
}

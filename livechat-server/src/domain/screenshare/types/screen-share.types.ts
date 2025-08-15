// src/domain/screenshare/types/screen-share.types.ts

import { RtpCapabilities, RtpParameters } from "mediasoup/node/lib/types";

export interface ScreenShareProducerInfo {
  id: string;
  peerId: string;
  roomId: string;
  kind: "video"; // 화면 공유는 비디오만
  rtpParameters: RtpParameters;
  createdAt: Date;
  active: boolean;
}

export interface ScreenShareConsumerInfo {
  id: string;
  peerId: string;
  roomId: string;
  producerId: string;
  producerPeerId: string;
  kind: "video";
  rtpParameters: RtpParameters;
  createdAt: Date;
  active: boolean;
}

export interface ScreenShareState {
  roomId: string;
  activeProducers: Map<string, ScreenShareProducerInfo>; // peerId -> producer info
  consumers: Map<string, ScreenShareConsumerInfo[]>; // peerId -> consumer info list
}

// // Socket 이벤트 데이터 타입들 (기존 구조와 일치)
// export interface StartScreenShareData {
//   roomId: string;
//   peerId?: string;
//   transportId: string;
//   rtpParameters: RtpParameters;
// }

// export interface StopScreenShareData {
//   roomId: string;
//   peerId?: string;
//   producerId: string;
// }

// export interface ConsumeScreenShareData {
//   roomId: string;
//   transportId: string;
//   producerId: string;
//   rtpCapabilities: RtpCapabilities;
// }

// 서비스 요청/응답 타입들
export interface StartScreenShareRequest {
  roomId: string;
  peerId: string;
  rtpCapabilities: RtpCapabilities;
  rtpParameters: RtpParameters;
}

export interface StartScreenShareResponse {
  success: boolean;
  producerId?: string;
  consumers?: ScreenShareConsumerInfo[];
  error?: string;
}

export interface StopScreenShareRequest {
  roomId: string;
  peerId: string;
  producerId: string;
}

export interface StopScreenShareResponse {
  success: boolean;
  error?: string;
}

export interface ScreenShareEvent {
  type: "screen-share-started" | "screen-share-stopped" | "new-screen-share-consumer";
  roomId: string;
  peerId: string;
  producerId?: string;
  consumerInfo?: ScreenShareConsumerInfo;
}

export interface CreateScreenShareConsumerRequest {
  roomId: string;
  peerId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
}

export interface CreateScreenShareConsumerResponse {
  success: boolean;
  consumerId?: string;
  rtpParameters?: RtpParameters;
  error?: string;
}

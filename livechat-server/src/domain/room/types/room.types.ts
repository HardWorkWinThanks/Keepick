import { Socket } from "socket.io";
import {
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
} from "mediasoup/node/lib/types";
import * as mediasoup from "mediasoup";
import {
  ProducerAppData,
  ConsumerAppData,
} from "../../../shared/types/media.type";

export interface RoomState {
  id: string;
  router: Router;
  peers: Map<string, Peer>;
  createdAt: Date;
  chatSessionId?: string; // 방 생성시 채팅 세션 ID
}

export interface Peer {
  id: string;
  socket: Socket;
  name: string;
  roomId: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  rtpCapabilities?: mediasoup.types.RtpCapabilities;
  joinedAt: Date;
}

export interface TransportOptions {
  id: string;
  iceParameters: mediasoup.types.IceParameters;
  iceCandidates: mediasoup.types.IceCandidate[];
  dtlsParameters: mediasoup.types.DtlsParameters;
}

export interface CreateTransportData {
  roomId: string;
}

export interface ConnectTransportData {
  transportId: string;
  dtlsParameters: mediasoup.types.DtlsParameters;
}

export interface ProduceData {
  transportId: string;
  kind: mediasoup.types.MediaKind;
  rtpParameters: mediasoup.types.RtpParameters;
  roomId: string;
  appData?: ProducerAppData;
}

export interface ConsumeData {
  transportId: string;
  producerId: string;
  rtpCapabilities: mediasoup.types.RtpCapabilities;
  roomId: string;
  appData?: ProducerAppData;
}

export interface ProducerInfo {
  producerId: string;
  producerSocketId: string;
  kind: string;
}

export interface RoomInfo {
  id: string;
  peersCount: number;
  createdAt: Date;
}

export interface JoinRoomData {
  roomId: string;
  userName: string;
}

export interface PeerJoinedEvent {
  peerId: string;
  userName: string;
}

export interface PeerLeftEvent {
  peerId: string;
}

// Producer 정보 타입 (내부 관리용)
export interface PeerProducerInfo {
  id: string;
  kind: "audio" | "video";
  rtpParameters: any;
  appData: ProducerAppData;
  paused: boolean;
  createdAt: Date;
}

// Consumer 정보 타입 (내부 관리용)
export interface PeerConsumerInfo {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  appData: ConsumerAppData;
  paused: boolean;
  createdAt: Date;
}

// 방에 참가한 피어와 Producer 정보
export interface PeerWithProducers {
  id: string;
  name: string;
  producers: PeerProducerInfo[]; // 🆕 appData 포함된 Producer 정보
}

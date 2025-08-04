import { Socket } from "socket.io";
import {
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
} from "mediasoup/node/lib/types";
import * as mediasoup from "mediasoup";

export interface RoomState {
  id: string;
  router: Router;
  peers: Map<string, Peer>;
  createdAt: Date;
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
}

export interface ConsumeData {
  transportId: string;
  producerId: string;
  rtpCapabilities: mediasoup.types.RtpCapabilities;
  roomId: string;
}

export interface JoinRoomData {
  room: string;
  rtpCapabilities: mediasoup.types.RtpCapabilities;
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
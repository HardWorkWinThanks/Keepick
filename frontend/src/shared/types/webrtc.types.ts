import { RtpCapabilities, SctpCapabilities } from 'mediasoup-client/types';

export interface User {
  id: string;
  name: string;
  socketId?: string;
  avatar?: string;
  role?: 'host' | 'participant';
  joinedAt: number;
}

export interface PeerWithProducers {
  id: string;
  name: string;
  producers: {
    producerId: string;
    kind: 'audio' | 'video';
  }[];
}

export interface NewProducerInfo {
  producerId: string;
  producerSocketId: string;
  kind: 'audio' | 'video';
  rtpParameters?: RtpCapabilities;
  appData?: any;
}

export interface ProduceData {
  transportId: string;
  kind: 'audio' | 'video';
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
  kind: 'audio' | 'video';
  rtpParameters: any;
  type: 'simple' | 'simulcast' | 'svc';
  producerPaused: boolean;
}

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}
import {
  Producer,
  Consumer,
} from "mediasoup/node/lib/types";

export interface ScreenShareProducer {
  id: string;
  peerId: string;
  roomId: string;
  producer: Producer; // mediasoup Producer
  isActive: boolean;
  createdAt: Date;
}

export interface ScreenShareConsumer {
  id: string;
  peerId: string;
  roomId: string;
  producerId: string;
  consumer: Consumer; // mediasoup Consumer
  isActive: boolean;
  createdAt: Date;
}

export interface ScreenShareSession {
  roomId: string;
  producerId: string;
  peerId: string;
  isActive: boolean;
  consumers: Map<string, ScreenShareConsumer>;
}

export interface StartScreenShareRequest {
  roomId: string;
  peerId: string;
  rtpParameters: any;
}

export interface StopScreenShareRequest {
  roomId: string;
  peerId: string;
  producerId: string;
}

export interface ConsumeScreenShareRequest {
  roomId: string;
  peerId: string;
  producerId: string;
  rtpCapabilities: any;
}
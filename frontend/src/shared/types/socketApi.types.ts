// src/shared/types/socketApi.types.ts (Socket 이벤트 타입)
import { RtpCapabilities } from 'mediasoup-client/types';
import { User } from './webrtc';

export interface JoinRoomData {
  roomId: string;
  userName: string;
  avatar?: string;
  userAgent?: string;
}

export interface JoinRoomResponse {
  rtpCapabilities: RtpCapabilities;
  peers: User[];
  roomInfo: {
    id: string;
    name?: string;
    participantCount: number;
    maxParticipants?: number;
    created: number;
  };
}

export interface LeaveRoomData {
  roomId?: string;
  reason?: 'user_action' | 'connection_lost' | 'kicked';
}

export interface ConnectTransportData {
  transportId: string;
  dtlsParameters: any; // MediaSoup의 DtlsParameters 타입
}

export interface ResumeConsumerData {
  consumerId: string;
}

export interface ResumeConsumerResponse {
  consumerId: string;
  resumed: boolean;
}

// 제스처 관련 타입 (기존 유지 + 확장)
export interface GestureData {
  roomId: string;
  gestureType: 'static' | 'dynamic';
  label: string;
  emoji: string;
  confidence?: number;
  timestamp: number;
  userId: string;
  userName: string;
  metadata?: any;
}

export interface GestureEffectData {
  roomId: string;
  effect: string;
  emoji: string;
  timestamp: number;
  userId: string;
  userName: string;
  duration?: number;
  intensity?: number;
}

export interface GestureStatusData {
  roomId: string;
  userName: string;
  staticGestureEnabled: boolean;
  dynamicGestureEnabled: boolean;
  lastUpdated: number;
}
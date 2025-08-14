// src/shared/types/media.types.ts
import type { RtpCapabilities } from 'mediasoup-client/types';

export interface MediaTrackState {
  trackId: string;
  producerId?: string;  // Producer가 생성된 경우
  consumerId?: string;  // Consumer가 생성된 경우
  peerId: string;
  kind: 'audio' | 'video';
  enabled: boolean;
  muted?: boolean;      // audio 트랙의 경우
}

export interface PeerMediaState {
  peerId: string;
  peerName: string;
  socketId: string;
  tracks: {
    audio?: MediaTrackState;
    video?: MediaTrackState;
  };
  connected: boolean;
}

export interface LocalMediaState {
  tracks: {
    audio?: MediaTrackState;
    video?: MediaTrackState;
  };
  devices: {
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
    selectedAudioDevice?: string;
    selectedVideoDevice?: string;
  };
}

export interface MediaState {
  device: {
    loaded: boolean;
    rtpCapabilities?: RtpCapabilities;
  };
  transports: {
    sendTransportId?: string;
    recvTransportId?: string;
    connected: boolean;
  };
  local: LocalMediaState;
  remotePeers: Record<string, PeerMediaState>; // socketId를 키로 사용
  room: {
    id: string;
    connected: boolean;
  };
}
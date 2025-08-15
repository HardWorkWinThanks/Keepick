// src/entities/video-conference/media/model/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MediaState, MediaTrackState, PeerMediaState, LocalMediaState } from '@/shared/types/media.types';
import type { RtpCapabilities } from 'mediasoup-client/types';

const initialState: MediaState = {
  device: {
    loaded: false,
  },
  transports: {
    connected: false,
  },
  local: {
    tracks: {},
    devices: {
      audioDevices: [],
      videoDevices: [],
    },
  },
  remotePeers: {},
  room: {
    id: '',
    connected: false,
  },
};

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    // Device 관련
    setDeviceLoaded: (state, action: PayloadAction<boolean>) => {
      state.device.loaded = action.payload;
    },
    setRtpCapabilities: (state, action: PayloadAction<RtpCapabilities>) => {
      state.device.rtpCapabilities = action.payload;
    },

    // Transport 관련
    setTransports: (state, action: PayloadAction<{ sendId?: string; recvId?: string }>) => {
      if (action.payload.sendId) {
        state.transports.sendTransportId = action.payload.sendId;
      }
      if (action.payload.recvId) {
        state.transports.recvTransportId = action.payload.recvId;
      }
    },
    setTransportConnected: (state, action: PayloadAction<boolean>) => {
      state.transports.connected = action.payload;
    },

    // 로컬 트랙 관리
    setLocalTrack: (state, action: PayloadAction<{ kind: 'audio' | 'video'; track: MediaTrackState }>) => {
      const { kind, track } = action.payload;
      state.local.tracks[kind] = track;
    },
    updateLocalTrack: (state, action: PayloadAction<{ kind: 'audio' | 'video'; updates: Partial<MediaTrackState> }>) => {
      const { kind, updates } = action.payload;
      if (state.local.tracks[kind]) {
        Object.assign(state.local.tracks[kind]!, updates);
      }
    },
    removeLocalTrack: (state, action: PayloadAction<'audio' | 'video'>) => {
      delete state.local.tracks[action.payload];
    },

    // 원격 피어 관리
    addRemotePeer: (state, action: PayloadAction<{ socketId: string; peerId: string; peerName: string }>) => {
      const { socketId, peerId, peerName } = action.payload;
      state.remotePeers[socketId] = {
        peerId,
        peerName,
        socketId,
        tracks: {},
        connected: true,
      };
    },
    removeRemotePeer: (state, action: PayloadAction<string>) => {
      delete state.remotePeers[action.payload];
    },

    // 원격 트랙 관리
    setRemoteTrack: (state, action: PayloadAction<{ 
      socketId: string; 
      kind: 'audio' | 'video'; 
      track: MediaTrackState 
    }>) => {
      const { socketId, kind, track } = action.payload;
      if (state.remotePeers[socketId]) {
        state.remotePeers[socketId].tracks[kind] = track;
      }
    },
    updateRemoteTrack: (state, action: PayloadAction<{ 
      socketId: string; 
      kind: 'audio' | 'video'; 
      updates: Partial<MediaTrackState> 
    }>) => {
      const { socketId, kind, updates } = action.payload;
      if (state.remotePeers[socketId]?.tracks[kind]) {
        Object.assign(state.remotePeers[socketId].tracks[kind]!, updates);
      }
    },
    removeRemoteTrack: (state, action: PayloadAction<{ socketId: string; kind: 'audio' | 'video' }>) => {
      const { socketId, kind } = action.payload;
      if (state.remotePeers[socketId]) {
        delete state.remotePeers[socketId].tracks[kind];
      }
    },

    // Room 관련
    setRoomConnected: (state, action: PayloadAction<{ roomId: string; connected: boolean }>) => {
      state.room.id = action.payload.roomId;
      state.room.connected = action.payload.connected;
    },

    // 전체 상태 초기화
    resetMediaState: () => initialState,
  },
});

export const {
  setDeviceLoaded,
  setRtpCapabilities,
  setTransports,
  setTransportConnected,
  setLocalTrack,
  updateLocalTrack,
  removeLocalTrack,
  addRemotePeer,
  removeRemotePeer,
  setRemoteTrack,
  updateRemoteTrack,
  removeRemoteTrack,
  setRoomConnected,
  resetMediaState,
} = mediaSlice.actions;

export default mediaSlice.reducer;
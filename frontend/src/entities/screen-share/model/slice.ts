// src/entities/screen-share/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ScreenShare {
  id: string;
  producerId: string;
  peerId: string;
  peerName: string;
  isActive: boolean;
  startedAt: Date;
}

interface ScreenShareState {
  isSharing: boolean;
  isLoading: boolean;
  error: string | null;
  localScreenShare: ScreenShare | null;
  remoteScreenShares: { [peerId: string]: ScreenShare };
  activeScreenShareCount: number;
}

const initialState: ScreenShareState = {
  isSharing: false,
  isLoading: false,
  error: null,
  localScreenShare: null,
  remoteScreenShares: {},
  activeScreenShareCount: 0,
};

const screenShareSlice = createSlice({
  name: "screenShare",
  initialState,
  reducers: {
    // 로컬 화면 공유 시작
    startScreenShareRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    startScreenShareSuccess: (state, action: PayloadAction<ScreenShare>) => {
      state.isSharing = true;
      state.isLoading = false;
      state.localScreenShare = action.payload;
      state.activeScreenShareCount += 1;
    },

    startScreenShareFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // 로컬 화면 공유 중지
    stopScreenShareRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    stopScreenShareSuccess: (state) => {
      state.isSharing = false;
      state.isLoading = false;
      if (state.localScreenShare) {
        state.activeScreenShareCount = Math.max(
          0,
          state.activeScreenShareCount - 1
        );
      }
      state.localScreenShare = null;
    },

    stopScreenShareFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // 원격 화면 공유 관리
    addRemoteScreenShare: (state, action: PayloadAction<ScreenShare>) => {
      const screenShare = action.payload;
      state.remoteScreenShares[screenShare.peerId] = screenShare;
      state.activeScreenShareCount += 1;
    },

    removeRemoteScreenShare: (state, action: PayloadAction<string>) => {
      const peerId = action.payload;
      if (state.remoteScreenShares[peerId]) {
        delete state.remoteScreenShares[peerId];
        state.activeScreenShareCount = Math.max(
          0,
          state.activeScreenShareCount - 1
        );
      }
    },

    updateRemoteScreenShare: (
      state,
      action: PayloadAction<{ peerId: string; updates: Partial<ScreenShare> }>
    ) => {
      const { peerId, updates } = action.payload;
      if (state.remoteScreenShares[peerId]) {
        state.remoteScreenShares[peerId] = {
          ...state.remoteScreenShares[peerId],
          ...updates,
        };
      }
    },

    // 에러 및 상태 리셋
    clearError: (state) => {
      state.error = null;
    },

    resetScreenShareState: (state) => {
      state.isSharing = false;
      state.isLoading = false;
      state.error = null;
      state.localScreenShare = null;
      state.remoteScreenShares = {};
      state.activeScreenShareCount = 0;
    },
  },
});

export const {
  startScreenShareRequest,
  startScreenShareSuccess,
  startScreenShareFailure,
  stopScreenShareRequest,
  stopScreenShareSuccess,
  stopScreenShareFailure,
  addRemoteScreenShare,
  removeRemoteScreenShare,
  updateRemoteScreenShare,
  clearError,
  resetScreenShareState,
} = screenShareSlice.actions;

export const screenShareReducer = screenShareSlice.reducer;

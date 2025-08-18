// src/entities/video-conference/webrtc/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WebrtcState {
  isDeviceLoaded: boolean;
  // 🛑 MediaStream 객체 대신 원격 피어들의 ID 목록만 저장
  remotePeerIds: string[];
}

const initialState: WebrtcState = {
  isDeviceLoaded: false,
  remotePeerIds: [],
};

const webrtcSlice = createSlice({
  name: "webrtc",
  initialState,
  reducers: {
    setDeviceLoaded(state, action: PayloadAction<boolean>) {
      state.isDeviceLoaded = action.payload;
    },
    // 🛑 새로운 원격 피어 ID 추가
    addRemotePeer(state, action: PayloadAction<string>) {
      if (!state.remotePeerIds.includes(action.payload)) {
        state.remotePeerIds.push(action.payload);
      }
    },
    // 🛑 원격 피어 ID 제거
    removeRemotePeer(state, action: PayloadAction<string>) {
      state.remotePeerIds = state.remotePeerIds.filter(
        (id) => id !== action.payload
      );
    },
    // 🛑 상태 초기화 로직 수정
    resetWebrtcState: (state) => {
      state.isDeviceLoaded = false;
      state.remotePeerIds = [];
    },
  },
});

export const {
  setDeviceLoaded,
  addRemotePeer,
  removeRemotePeer,
  resetWebrtcState,
} = webrtcSlice.actions;
export default webrtcSlice.reducer;

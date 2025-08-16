// src/entities/video-conference/media/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MediaState {
  isCameraOn: boolean;
  isMicOn: boolean;
  isProducing: boolean;
}

const initialState: MediaState = {
  isCameraOn: true,
  isMicOn: false,
  isProducing: false,
};

const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    toggleCamera: (state) => {
      state.isCameraOn = !state.isCameraOn;
    },
    toggleMic: (state) => {
      state.isMicOn = !state.isMicOn;
    },
    setIsProducing: (state, action: PayloadAction<boolean>) => {
      state.isProducing = action.payload;
    },
    resetMediaState: (state) => {
      state.isCameraOn = true;
      state.isMicOn = false;
      state.isProducing = false;
    },
  },
});

export const { toggleCamera, toggleMic, setIsProducing, resetMediaState } = mediaSlice.actions;
export default mediaSlice.reducer;

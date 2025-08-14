// src/features/video-conference/toggle-mic/model/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/shared/config/store";
import { toggleMic as toggleMicAction } from "@/entities/video-conference/media/model/slice";
import { mediasoupManager } from "@/shared/api/mediasoupManager";

export const toggleMicThunk = createAsyncThunk(
  "media/toggleMic",
  async (_, { dispatch, getState }) => {
    const { media } = getState() as RootState;
    const newMicState = !media.isMicOn;
    
    console.log(`🎤 [toggleMicThunk] Toggling mic: ${media.isMicOn} -> ${newMicState}`);
    
    // mediasoupManager를 통해 실제 오디오 트랙 제어
    mediasoupManager.toggleTrack("audio", newMicState);
    
    // Redux 상태 업데이트
    dispatch(toggleMicAction());
  }
);

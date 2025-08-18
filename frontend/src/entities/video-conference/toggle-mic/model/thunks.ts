// src/features/video-conference/toggle-mic/model/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/shared/config/store";
import { toggleMic as toggleMicAction } from "@/entities/video-conference/media/model/slice";
import { mediasoupManager } from "@/shared/api/mediasoupManager";

export const toggleMicThunk = createAsyncThunk(
  "media/toggleMic",
  async (_, { dispatch, getState }) => {
    const { media } = getState() as RootState;
    const currentEnabled = media.local.tracks.audio?.enabled ?? false;
    
    console.log(`🎤 [toggleMicThunk] Toggling mic: ${currentEnabled} -> ${!currentEnabled}`);
    
    // 새로운 구조에서는 mediasoupManager의 toggleLocalTrack 사용
    mediasoupManager.toggleLocalTrack("audio");
    
    // Redux 상태는 MediaTrackManager에서 자동으로 업데이트됨
    // dispatch(toggleMicAction());
  }
);

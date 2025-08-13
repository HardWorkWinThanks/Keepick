// src/features/video-conference/toggle-camera/model/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/app/store";
import { toggleCamera as toggleCameraAction } from "@/entities/video-conference/media/model/slice";

export const toggleCameraThunk = createAsyncThunk(
  "media/toggleCamera",
  async (_, { dispatch, getState }) => {
    const { session } = getState() as RootState;
    const stream = session.localStream;

    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled; // 실제 미디어 트랙을 켜고 끕니다.
        dispatch(toggleCameraAction()); // UI 상태 업데이트를 위해 Redux 액션을 디스패치합니다.
      }
    }
  }
);

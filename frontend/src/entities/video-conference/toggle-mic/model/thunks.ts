// src/features/video-conference/toggle-mic/model/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/shared/config/store";
import { toggleMic as toggleMicAction } from "@/entities/video-conference/media/model/slice";

export const toggleMicThunk = createAsyncThunk(
  "media/toggleMic",
  async (_, { dispatch, getState }) => {
    const { session } = getState() as RootState;
    // const stream = session.localStream;

    // if (stream) {
    //   const audioTrack = stream.getAudioTracks()[0];
    //   if (audioTrack) {
    //     // 실제 미디어 스트림의 오디오 트랙을 켜거나 끕니다.
    //     audioTrack.enabled = !audioTrack.enabled;
    //     // UI 상태 업데이트를 위해 Redux 액션을 디스패치합니다.
    //     dispatch(toggleMicAction());
    //   }
    // }
  }
);

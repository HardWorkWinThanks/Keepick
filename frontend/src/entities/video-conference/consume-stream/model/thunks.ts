// src/features/video-conference/consume-stream/model/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/shared/config/store";
import { mediasoupManager } from "@/shared/api/mediasoupManager";

// 🛑 consume 로직을 담당하는 Thunk (이름 변경 제안: consumeNewProducerThunk)
export const consumeNewProducerThunk = createAsyncThunk(
  "session/consumeNewProducer",
  async (
    {
      producerId,
      producerSocketId,
    }: { producerId: string; producerSocketId: string },
    { getState }
  ) => {
    try {
      const state = getState() as RootState;
      const roomId = state.session.roomId;
      if (roomId) {
        await mediasoupManager.consume(producerId, producerSocketId, roomId);
      }
    } catch (error) {
      console.error("Failed to consume new producer:", error);
    }
  }
);

// 🛑 producer가 닫혔을 때 관련 consumer를 정리하는 Thunk
export const handleProducerClosedThunk = createAsyncThunk(
  "session/handleProducerClosed",
  async ({ producerId }: { producerId: string }) => {
    try {
      mediasoupManager.closeConsumerForProducer(producerId);
    } catch (error) {
      console.error("Failed to handle producer closed event:", error);
    }
  }
);

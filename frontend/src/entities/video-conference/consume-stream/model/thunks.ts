// src/features/video-conference/consume-stream/model/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/shared/config/store";
import { mediasoupManager } from "@/shared/api/mediasoupManager";

export const consumeNewProducerThunk = createAsyncThunk(
  "webrtc/consumeNewProducer",
  async (
    {
      producerId,
      producerSocketId,
    }: { producerId: string; producerSocketId: string },
    { getState }
  ) => {
    const { session } = getState() as RootState;
    const { roomId } = session;

    try {
      await mediasoupManager.consume(producerId, producerSocketId, roomId);
    } catch (error: any) {
      console.error(`❌ Failed to consume producer ${producerId}:`, error);
      // 실패 시 특정 에러 처리 로직 추가 가능
      throw new Error(error.message);
    }
  }
);

export const handleProducerClosedThunk = createAsyncThunk(
  "webrtc/handleProducerClosed",
  async ({ producerId }: { producerId: string }, { dispatch, getState }) => {
    try {
      console.log(`[Thunk] Handling closed producer: ${producerId}`);
      // mediasoupManager의 메서드를 Thunk 내부에서 안전하게 호출
      mediasoupManager.closeConsumerForProducer(producerId);
    } catch (error: any) {
      console.error(
        `❌ Failed to handle producer closing for ${producerId}:`,
        error
      );
      throw new Error(error.message);
    }
  }
);

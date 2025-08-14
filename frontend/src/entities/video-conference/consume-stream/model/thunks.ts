// src/features/video-conference/consume-stream/model/thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { mediasoupManager } from "@/shared/api/mediasoupManager";

// 새로운 Producer 소비 Thunk
export const consumeNewProducerThunk = createAsyncThunk(
  "session/consumeNewProducer",
  async ({
    producerId,
    producerSocketId,
  }: { producerId: string; producerSocketId: string }) => {
    try {
      await mediasoupManager.consumeProducer({
        producerId,
        producerSocketId,
      });
    } catch (error) {
      console.error("Failed to consume new producer:", error);
      throw error;
    }
  }
);

// Producer 종료 처리 Thunk
export const handleProducerClosedThunk = createAsyncThunk(
  "session/handleProducerClosed",
  async ({ producerId }: { producerId: string }) => {
    try {
      mediasoupManager.handleProducerClosed(producerId);
    } catch (error) {
      console.error("Failed to handle producer closed event:", error);
      throw error;
    }
  }
);

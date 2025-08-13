// src/entities/emoji-reaction/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface EmojiReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
  duration?: number; // 표시 시간 (ms)
}

interface EmojiReactionState {
  activeReactions: { [userId: string]: EmojiReaction }; // 현재 활성화된 반응들
  reactionHistory: EmojiReaction[]; // 반응 히스토리 (최근 50개)
}

const initialState: EmojiReactionState = {
  activeReactions: {},
  reactionHistory: [],
};

const emojiReactionSlice = createSlice({
  name: "emojiReaction",
  initialState,
  reducers: {
    addReaction: (state, action: PayloadAction<EmojiReaction>) => {
      const reaction = action.payload;

      // 해당 사용자의 기존 반응을 새 반응으로 교체
      state.activeReactions[reaction.userId] = reaction;

      // 히스토리에 추가 (최대 50개 유지)
      state.reactionHistory.unshift(reaction);
      if (state.reactionHistory.length > 50) {
        state.reactionHistory = state.reactionHistory.slice(0, 50);
      }
    },

    removeReaction: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      delete state.activeReactions[userId];
    },

    clearUserReaction: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      delete state.activeReactions[userId];
    },

    clearAllReactions: (state) => {
      state.activeReactions = {};
    },

    // 자동으로 만료된 반응들을 정리하는 액션
    cleanupExpiredReactions: (state) => {
      const now = new Date().getTime();
      Object.keys(state.activeReactions).forEach((userId) => {
        const reaction = state.activeReactions[userId];
        const reactionTime = new Date(reaction.timestamp).getTime();
        const duration = reaction.duration || 3000; // 기본 3초

        if (now - reactionTime > duration) {
          delete state.activeReactions[userId];
        }
      });
    },
  },
});

export const {
  addReaction,
  removeReaction,
  clearUserReaction,
  clearAllReactions,
  cleanupExpiredReactions,
} = emojiReactionSlice.actions;

export const emojiReactionReducer = emojiReactionSlice.reducer;

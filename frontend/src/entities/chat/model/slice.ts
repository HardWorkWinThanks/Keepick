// src/entities/chat/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  id: string;
  type: "user" | "system";
  content: string;
  sender?: {
    id: string;
    name: string;
  };
  timestamp: Date;
}

interface ChatState {
  isChatOpen: boolean;
  messages: ChatMessage[];
  unreadCount: number;
}

const initialState: ChatState = {
  isChatOpen: false,
  messages: [],
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
      if (state.isChatOpen) {
        state.unreadCount = 0;
      }
    },
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isChatOpen = action.payload;
      if (action.payload) {
        state.unreadCount = 0;
      }
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      if (!state.isChatOpen) {
        state.unreadCount += 1;
      }
    },
    addSystemMessage: (state, action: PayloadAction<string>) => {
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "system",
        content: action.payload,
        timestamp: new Date(),
      };
      state.messages.push(systemMessage);
    },
    clearMessages: (state) => {
      state.messages = [];
      state.unreadCount = 0;
    },
    markAsRead: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const {
  toggleChat,
  setChatOpen,
  addMessage,
  addSystemMessage,
  clearMessages,
  markAsRead,
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;

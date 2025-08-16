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
  timestamp: string; // Date 대신 string으로 변경
  isTemporary?: boolean; // 임시 메시지 표시용
  isError?: boolean; // 에러 상태
  isSending?: boolean; // 전송중 상태
  tempId?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  joinedAt: string;
  isTyping?: boolean;
  lastSeen?: string;
}

interface ChatState {
  isChatOpen: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  participants: ChatParticipant[];
  participantsCount: number;
}

const initialState: ChatState = {
  isChatOpen: true,
  messages: [],
  unreadCount: 0,
  participants: [],
  participantsCount: 0,
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
      const newMessage = {
        ...action.payload,
        timestamp:
          typeof action.payload.timestamp === "string"
            ? action.payload.timestamp
            : new Date(action.payload.timestamp).toISOString(), // Date를 string으로 변환
      };

      // 중복 메시지 체크 - ID가 같은 메시지가 이미 있는지 확인
      const existingMessageIndex = state.messages.findIndex((msg) => msg.id === newMessage.id);

      if (existingMessageIndex !== -1) {
        // 이미 존재하는 메시지라면 업데이트 (임시 메시지 -> 확정 메시지)
        state.messages[existingMessageIndex] = {
          ...newMessage,
          isTemporary: false,
        };
        console.log(`💬 [REDUX] Updated existing message: ${newMessage.id}`);
      } else {
        // 새로운 메시지라면 추가
        state.messages.push(newMessage);
        console.log(`💬 [REDUX] Added new message: ${newMessage.id}`);

        if (!state.isChatOpen) {
          state.unreadCount += 1;
        }
      }
    },
    addTemporaryMessage: (state, action: PayloadAction<ChatMessage>) => {
      const tempMessage = {
        ...action.payload,
        isTemporary: true,
        timestamp:
          typeof action.payload.timestamp === "string"
            ? action.payload.timestamp
            : new Date(action.payload.timestamp).toISOString(),
      };

      // 임시 메시지는 항상 새로 추가 (중복 체크 안함)
      state.messages.push(tempMessage);
      console.log(`💬 [REDUX] Added temporary message: ${tempMessage.id}`);
    },
    updateMessage: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ChatMessage> }>
    ) => {
      const { id, updates } = action.payload;
      const messageIndex = state.messages.findIndex((msg) => msg.id === id);

      if (messageIndex !== -1) {
        const updatedMessage = {
          ...state.messages[messageIndex],
          ...updates,
        };

        // timestamp가 Date 객체인 경우 string으로 변환
        if (updates.timestamp && typeof updates.timestamp !== "string") {
          updatedMessage.timestamp = new Date(updates.timestamp).toISOString();
        }

        state.messages[messageIndex] = updatedMessage;
        console.log(`💬 [REDUX] Updated message: ${id}`);
      }
    },
    removeTemporaryMessage: (state, action: PayloadAction<string>) => {
      const tempId = action.payload;
      if (tempId === "all") {
        // 모든 임시 메시지 제거
        state.messages = state.messages.filter((msg) => !msg.isTemporary);
        console.log(`💬 [REDUX] Removed all temporary messages`);
      } else {
        state.messages = state.messages.filter((msg) => msg.id !== tempId);
        console.log(`💬 [REDUX] Removed temporary message: ${tempId}`);
      }
    },
    addSystemMessage: (state, action: PayloadAction<string>) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}-${Math.random()}`, // 고유한 ID 생성
        type: "system",
        content: action.payload,
        timestamp: new Date().toISOString(), // Date를 string으로 변환
      };
      state.messages.push(systemMessage);
      console.log(`💬 [REDUX] Added system message: ${systemMessage.id}`);
    },
    clearMessages: (state) => {
      state.messages = [];
      state.unreadCount = 0;
      console.log(`💬 [REDUX] Cleared all messages`);
    },
    markAsRead: (state) => {
      state.unreadCount = 0;
    },
    // 메시지 히스토리 로드 시 사용 (중복 제거하며 대량 추가)
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      const newMessages = action.payload.map((msg) => ({
        ...msg,
        timestamp:
          typeof msg.timestamp === "string" ? msg.timestamp : new Date(msg.timestamp).toISOString(), // Date를 string으로 변환
      }));

      // 기존 메시지와 새 메시지를 합치되 중복 제거
      const messageMap = new Map();

      // 기존 메시지 먼저 추가
      state.messages.forEach((msg) => {
        messageMap.set(msg.id, msg);
      });

      // 새 메시지 추가 (중복되면 덮어씀)
      newMessages.forEach((msg) => {
        messageMap.set(msg.id, msg);
      });

      // 시간순 정렬 (string으로 변환된 timestamp를 Date로 비교)
      state.messages = Array.from(messageMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      console.log(`💬 [REDUX] Set ${state.messages.length} messages (deduped)`);
    },
    // 🆕 참가자 관리 액션들
    setParticipants: (state, action: PayloadAction<ChatParticipant[]>) => {
      state.participants = action.payload;
      state.participantsCount = action.payload.length;
      console.log(`💬 [REDUX] Set ${action.payload.length} participants`);
    },
    addParticipant: (state, action: PayloadAction<ChatParticipant>) => {
      const existingIndex = state.participants.findIndex((p) => p.id === action.payload.id);
      if (existingIndex === -1) {
        state.participants.push(action.payload);
        state.participantsCount = state.participants.length;
        console.log(`💬 [REDUX] Added participant: ${action.payload.name}`);
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter((p) => p.id !== action.payload);
      state.participantsCount = state.participants.length;
      console.log(`💬 [REDUX] Removed participant: ${action.payload}`);
    },
    updateParticipantTyping: (state, action: PayloadAction<{ id: string; isTyping: boolean }>) => {
      const participant = state.participants.find((p) => p.id === action.payload.id);
      if (participant) {
        participant.isTyping = action.payload.isTyping;
      }
    },
    setChatInfo: (
      state,
      action: PayloadAction<{ participantsCount: number; participants: ChatParticipant[] }>
    ) => {
      state.participantsCount = action.payload.participantsCount;
      state.participants = action.payload.participants;
      console.log(`💬 [REDUX] Updated chat info: ${action.payload.participantsCount} participants`);
    },
  },
});

export const {
  toggleChat,
  setChatOpen,
  addMessage,
  addTemporaryMessage,
  updateMessage,
  removeTemporaryMessage,
  addSystemMessage,
  clearMessages,
  markAsRead,
  setMessages,
  setParticipants,
  addParticipant,
  removeParticipant,
  updateParticipantTyping,
  setChatInfo,
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;

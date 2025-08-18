// src/entities/video-conference/session/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/shared/types/webrtc.types";
import { joinRoomThunk } from "./thunks";

interface SessionState {
  status: "idle" | "pending" | "succeeded" | "failed";
  isConnected: boolean;
  roomId: string;
  userName: string;
  isInRoom: boolean;
  users: User[];
  error: string | null;
}

const initialState: SessionState = {
  status: "idle",
  isConnected: false,
  roomId: "",
  userName: "게스트",
  isInRoom: false,
  users: [],
  error: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (!action.payload) {
        state.isInRoom = false;
        state.users = [];
      }
    },
    setRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    setUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload;
    },
    setInRoom: (state, action: PayloadAction<boolean>) => {
      state.isInRoom = action.payload;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      if (!state.users.find((user) => user.id === action.payload.id)) {
        state.users.push(action.payload);
      }
    },
    removeUser: (state, action: PayloadAction<string>) => {
      // payload는 socketId
      state.users = state.users.filter((user) => user.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // 🛑 resetRoomState에서 localStream 관련 로직 제거
    resetRoomState: (state) => {
      state.isInRoom = false;
      state.users = [];
      state.error = null;
      state.roomId = "";
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(joinRoomThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(joinRoomThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Thunk가 성공적으로 요청을 보냈을 때의 로직 (필요 시)
        // 예를 들어, action.payload에서 roomId, userName을 받아와 설정할 수 있습니다.
        state.roomId = action.payload.roomId;
        state.userName = action.payload.userName;
      })
      .addCase(joinRoomThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const {
  setConnected,
  setRoomId,
  setUserName,
  setInRoom,
  setUsers,
  addUser,
  removeUser,
  setError,
  resetRoomState,
} = sessionSlice.actions;

export default sessionSlice.reducer;

// src/shared/api/socket/useSocket.ts

import { useRef, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { SOCKET_SERVER_URL } from "@/shared/config";
import type { RtpCapabilities } from "mediasoup-client/types";

// 필요한 타입들을 명확하게 정의합니다.
// 이 타입들은 다른 파일에서 가져와서 사용할 수 있습니다.
interface ProducerInfo {
  producerId: string;
  producerSocketId: string;
  kind: "audio" | "video";
}

interface JoinRoomResponse {
  rtpCapabilities: RtpCapabilities;
  existingProducers: ProducerInfo[];
}

interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onConnectError?: (error: Error) => void;
}

export const useSocket = (callbacks?: SocketCallbacks) => {
  const socketRef = useRef<Socket | null>(null);

  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log("Socket already connected");
      return;
    }

    console.log("🔌 Connecting to:", SOCKET_SERVER_URL);

    const socket = io(SOCKET_SERVER_URL, {
      path: "/sfu-demo/socket.io/",
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
      callbacks?.onConnect?.();
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      callbacks?.onDisconnect?.();
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      callbacks?.onConnectError?.(error);
    });

    socketRef.current = socket;
    console.log("✅ Socket initialized");
  }, [callbacks]);

  /**
   * 🔥 [수정됨] SFU 방식의 joinRoom
   * Promise를 반환하여, 서버로부터 'joined_room' 응답을 받아야만 완료됩니다.
   * 이렇게 하면 레이스 컨디션을 방지하고 안정적인 데이터 흐름을 보장할 수 있습니다.
   */
  const joinRoom = useCallback((roomId: string): Promise<JoinRoomResponse> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        return reject(new Error("Socket not connected. Cannot join room."));
      }

      console.log(`🚪 Emitting join_room request for room: ${roomId}`);
      // 서버에 방 참여를 요청합니다.
      socketRef.current.emit("join_room", { roomId });

      // 서버로부터 'joined_room' 응답을 한 번만 수신합니다.
      socketRef.current.once("joined_room", (data: JoinRoomResponse) => {
        // 서버로부터 받은 데이터(data)를 확인합니다.
        if (data && data.rtpCapabilities) {
          // ✅ data 안에 rtpCapabilities가 있으면 성공!
          resolve(data);
        } else {
          // ❌ data 안에 rtpCapabilities가 없으면 실패!
          reject(new Error("Server response for join_room is invalid.")); // <--- 바로 이 에러입니다.
        }
      });

      // 에러 발생 시 Promise를 reject 합니다.
      socketRef.current.once("error", (error) => {
        console.error("❌ Error while joining room:", error);
        reject(error);
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_room");
      console.log("👋 Left room");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    initializeSocket();
    return () => {
      disconnect();
    };
  }, [initializeSocket, disconnect]);

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    disconnect,
    isConnected: socketRef.current?.connected || false,
  };
};

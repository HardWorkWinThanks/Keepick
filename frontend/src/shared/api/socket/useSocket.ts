import { useRef, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { SOCKET_SERVER_URL } from "@/shared/config";

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

  // 🔥 SFU 방식의 joinRoom
  const joinRoom = useCallback(async (roomId: string) => {
    if (!socketRef.current?.connected) {
      console.warn("❌ Socket not connected");
      return null;
    }

    try {
      // 1. RTP Capabilities 가져오기
      const response = await fetch(
        `${SOCKET_SERVER_URL}/sfu-demo/rtp-capabilities/${roomId}`
      );
      const { rtpCapabilities } = await response.json();

      // 2. 룸 참가
      socketRef.current.emit("join_room", {
        room: roomId,
        rtpCapabilities,
      });

      console.log(`🚪 Joining room: ${roomId}`);
      return rtpCapabilities;
    } catch (error) {
      console.error("❌ Failed to join room:", error);
      throw error;
    }
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

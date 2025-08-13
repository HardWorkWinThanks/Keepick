// src/shared/api/socketApi.ts (채팅 기능 추가 버전)

import { io, Socket } from "socket.io-client";
import { AppDispatch } from "@/shared/config/store";
import { RtpCapabilities } from "mediasoup-client/types";
import { User, NewProducerInfo } from "@/shared/types/webrtc";
import { SOCKET_SERVER_URL } from "@/shared/config";
import { chatSocketHandler } from "@/entities/chat/model/socketEvents";

// --- Action & Thunk Imports ---
import {
  setConnected,
  addUser,
  removeUser,
  setError,
  setInRoom,
} from "@/entities/video-conference/session/model/slice";
import { setupConferenceThunk } from "@/entities/video-conference/session/model/thunks";

// Thunk 타입 정의
type ConsumeProducerThunk = (data: {
  producerId: string;
  producerSocketId: string;
}) => any;
type HandleProducerClosedThunk = (data: { producerId: string }) => any;

class SocketApi {
  private socket: Socket | null = null;
  private consumeProducerThunk: ConsumeProducerThunk | null = null;
  private handleProducerClosedThunk: HandleProducerClosedThunk | null = null;

  public init(
    dispatch: AppDispatch,
    consumeProducerThunk: ConsumeProducerThunk,
    handleProducerClosedThunk: HandleProducerClosedThunk
  ) {
    if (this.socket) {
      console.log("Socket already initialized. Skipping.");
      return;
    }

    this.consumeProducerThunk = consumeProducerThunk;
    this.handleProducerClosedThunk = handleProducerClosedThunk;

    console.log("Connecting to socket server...");
    this.socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

    // 채팅 핸들러 초기화
    chatSocketHandler.init(dispatch);

    this.setupEventListeners(dispatch);
  }

  private waitForEvent<T>(eventName: string, timeout = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not initialized."));

      const timer = setTimeout(() => {
        reject(new Error(`Event '${eventName}' timed out after ${timeout}ms`));
        this.socket?.off(eventName);
      }, timeout);

      this.socket.once(eventName, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  private setupEventListeners(dispatch: AppDispatch) {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      dispatch(setConnected(true));
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      dispatch(setConnected(false));
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      dispatch(setError(`Socket connection error: ${err.message}`));
    });

    this.socket.on(
      "joined_room",
      (data: { rtpCapabilities: RtpCapabilities; peers: User[] }) => {
        console.log(
          "✅ [SocketAPI] 'joined_room' event received. Dispatching setupConferenceThunk.",
          data
        );
        dispatch(setInRoom(true));
        dispatch(
          setupConferenceThunk({
            rtpCapabilities: data.rtpCapabilities,
            peers: data.peers,
          })
        );
        // 회의실 입장 시스템 메시지
        chatSocketHandler.handleRoomJoined();
      }
    );

    this.socket.on("user_joined", (user: User) => {
      console.log(`👋 User joined: ${user.name}`);
      dispatch(addUser(user));
      // 사용자 입장 시스템 메시지
      chatSocketHandler.handleUserJoined(user.name);
    });

    this.socket.on("user_left", (data: { id: string; name?: string }) => {
      console.log(`👋 User left: ${data.id}`);
      dispatch(removeUser(data.id));
      // 사용자 퇴장 시스템 메시지
      if (data.name) {
        chatSocketHandler.handleUserLeft(data.name);
      }
    });

    this.socket.on("new_producer", (data: NewProducerInfo) => {
      console.log("🎬 New producer available:", data);
      if (
        this.consumeProducerThunk &&
        this.socket &&
        data.producerSocketId !== this.socket.id
      ) {
        this.consumeProducerThunk({
          producerId: data.producerId,
          producerSocketId: data.producerSocketId,
        });
      }
    });

    this.socket.on("producer_closed", (data: { producerId: string }) => {
      console.log(`🔌 Producer ${data.producerId} was closed on the server.`);
      if (this.handleProducerClosedThunk) {
        this.handleProducerClosedThunk({ producerId: data.producerId });
      }
    });

    // 🆕 채팅 관련 이벤트 리스너 추가
    this.socket.on("chat_message_received", (data: any) => {
      console.log("💬 Chat message received:", data);
      if (data.senderId !== this.socket?.id) {
        chatSocketHandler.handleReceivedMessage(data);
      }
    });

    this.socket.on(
      "chat_user_joined",
      (data: { userId: string; userName: string }) => {
        console.log("👋 User joined chat:", data);
        chatSocketHandler.handleUserJoined(data.userName);
      }
    );

    this.socket.on(
      "chat_user_left",
      (data: { userId: string; userName: string }) => {
        console.log("👋 User left chat:", data);
        chatSocketHandler.handleUserLeft(data.userName);
      }
    );

    // 🆕 화면 공유 관련 이벤트 리스너 추가
    this.socket.on("screen_share_started", (data: any) => {
      console.log("🖥️ Screen share started:", data);
      // screenShareManager에서 처리하도록 이벤트 전달
      if (data.peerId !== this.socket?.id) {
        // 다른 사용자의 화면 공유 시작 처리
        // 이 부분은 ConferenceClientPage에서 처리하도록 이벤트 발생
        window.dispatchEvent(
          new CustomEvent("screenShareStarted", { detail: data })
        );
      }
    });

    this.socket.on("screen_share_stopped", (data: any) => {
      console.log("🖥️ Screen share stopped:", data);
      // 화면 공유 중지 처리
      window.dispatchEvent(
        new CustomEvent("screenShareStopped", { detail: data })
      );
    });

    this.socket.on("active_screen_shares", (data: any) => {
      console.log("🖥️ Active screen shares:", data);
      // 활성 화면 공유 목록 처리
      window.dispatchEvent(
        new CustomEvent("activeScreenShares", { detail: data })
      );
    });
  }

  // 기존 메서드들...
  public getSocketId = () => this.socket?.id || null;

  private emit(event: string, ...args: any[]) {
    if (!this.socket) {
      console.error(`Cannot emit event '${event}': Socket not initialized.`);
      return;
    }
    this.socket.emit(event, ...args);
  }

  public joinRoom = (data: { roomId: string; userName: string }) =>
    this.emit("join_room", data);
  public leaveRoom = () => this.emit("leave_room");
  public connectTransport = (data: {
    transportId: string;
    dtlsParameters: any;
  }) => this.emit("connect_transport", data);

  // 🆕 채팅 관련 메서드 추가 (서버 API에 맞게)
  public sendChatMessage = (data: {
    roomId: string;
    content: string;
    messageType?: string;
  }) => {
    this.emit("chat_send_message", data);
  };

  public joinChat = (data: { roomId: string; userName: string }) => {
    this.emit("chat_join", data);
  };

  // 🆕 화면 공유 관련 메서드 추가
  public startScreenShare = (data: {
    roomId: string;
    peerId: string;
    producerId: string;
    transportId: string;
    rtpParameters: any;
  }) => {
    this.emit("start_screen_share", data);
  };

  public stopScreenShare = (data: {
    roomId: string;
    peerId: string;
    producerId: string;
  }) => {
    this.emit("stop_screen_share", data);
  };

  public consumeScreenShare = async (data: {
    roomId: string;
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
  }): Promise<any> => {
    this.emit("consume_screen_share", data);
    return this.waitForEvent("consumer_created");
  };

  public getActiveScreenShares = (data: { roomId: string }) => {
    this.emit("get_active_screen_shares", data);
  };

  public leaveChat = (data?: { roomId: string }) => {
    this.emit("chat_leave", data);
  };

  // 기존 비동기 메서드들...
  public async createProducerTransport(roomId: string): Promise<any> {
    this.emit("create_producer_transport", { roomId });
    return this.waitForEvent("producer_transport_created");
  }

  public async createConsumerTransport(roomId: string): Promise<any> {
    this.emit("create_consumer_transport", { roomId });
    return this.waitForEvent("consumer_transport_created");
  }

  public async produce(data: {
    transportId: string;
    kind: "audio" | "video";
    rtpParameters: any;
    roomId: string;
  }): Promise<{ id: string }> {
    this.emit("produce", data);
    return this.waitForEvent("producer_created");
  }

  public async consume(data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
    roomId: string;
  }): Promise<any> {
    this.emit("consume", data);
    return this.waitForEvent("consumer_created");
  }

  public async resumeConsumer(
    consumerId: string
  ): Promise<{ consumerId: string }> {
    this.emit("resume_consumer", { consumerId });
    return this.waitForEvent("consumer_resumed");
  }
}

export const socketApi = new SocketApi();

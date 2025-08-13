// src/shared/api/socketApi.ts

import { io, Socket } from "socket.io-client";
import { AppDispatch } from "@/shared/config/store";
import { RtpCapabilities } from "mediasoup-client/types";
import { User, NewProducerInfo } from "@/shared/types/webrtc";
import { SOCKET_SERVER_URL } from "@/shared/config";

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
  private dispatch: AppDispatch | null = null;
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

    this.dispatch = dispatch;
    this.consumeProducerThunk = consumeProducerThunk;
    this.handleProducerClosedThunk = handleProducerClosedThunk;

    console.log("Connecting to socket server...");
    this.socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    this.setupEventListeners();
  }

  // 🛑 헬퍼: 특정 이벤트를 기다리는 Promise를 생성합니다. (비동기 로직용)
  private waitForEvent<T>(eventName: string, timeout = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not initialized."));

      const timer = setTimeout(() => {
        reject(new Error(`Event '${eventName}' timed out after ${timeout}ms`));
        // 타임아웃 발생 시 리스너 제거
        this.socket?.off(eventName);
      }, timeout);

      this.socket.once(eventName, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  private setupEventListeners() {
    if (!this.socket || !this.dispatch) return;
    const dispatch = this.dispatch;

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

    // --- 비동기 흐름의 시작점 ---
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
      }
    );

    // --- 서버로부터 일방적으로 받는 이벤트들 ---
    this.socket.on("user_joined", (user: User) => {
      console.log(`👋 User joined: ${user.name}`);
      dispatch(addUser(user));
    });

    this.socket.on("user_left", (data: { id: string }) => {
      console.log(`👋 User left: ${data.id}`);
      dispatch(removeUser(data.id));
    });

    this.socket.on("new_producer", (data: NewProducerInfo) => {
      console.log("🎬 New producer available:", data);
      if (
        this.consumeProducerThunk &&
        this.socket &&
        data.producerSocketId !== this.socket.id
      ) {
        dispatch(
          this.consumeProducerThunk({
            producerId: data.producerId,
            producerSocketId: data.producerSocketId,
          })
        );
      }
    });

    this.socket.on("producer_closed", (data: { producerId: string }) => {
      console.log(`🔌 Producer ${data.producerId} was closed on the server.`);
      if (this.handleProducerClosedThunk) {
        dispatch(
          this.handleProducerClosedThunk({ producerId: data.producerId })
        );
      }
    });
  }

  // --- Public Methods (Fire-and-Forget 방식) ---

  public getSocketId = () => this.socket?.id || null;

  // 🛑 요청만 보내고 응답을 기다리지 않는 순수 이벤트 기반 메서드들
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

  // --- Public Methods (응답이 필요한 비동기 로직용) ---
  // 🛑 요청을 보내고, 특정 응답 이벤트를 기다리는 메서드들

  public async createProducerTransport(roomId: string): Promise<any> {
    this.emit("create_producer_transport", { roomId });
    // 서버의 TransportEventsHandler는 응답을 'producer_transport_created' 이벤트로 보낼 것으로 예상
    return this.waitForEvent("producer_transport_created");
  }

  public async createConsumerTransport(roomId: string): Promise<any> {
    this.emit("create_consumer_transport", { roomId });
    // 서버의 TransportEventsHandler는 응답을 'consumer_transport_created' 이벤트로 보낼 것으로 예상
    return this.waitForEvent("consumer_transport_created");
  }

  public async produce(data: {
    transportId: string;
    kind: "audio" | "video";
    rtpParameters: any;
    roomId: string;
  }): Promise<{ id: string }> {
    this.emit("produce", data);
    // 서버의 MediaEventsHandler는 'producer_created' 이벤트로 응답
    return this.waitForEvent("producer_created");
  }

  public async consume(data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
    roomId: string;
  }): Promise<any> {
    this.emit("consume", data);
    // 서버의 MediaEventsHandler는 'consumer_created' 이벤트로 응답
    return this.waitForEvent("consumer_created");
  }

  public async resumeConsumer(
    consumerId: string
  ): Promise<{ consumerId: string }> {
    this.emit("resume_consumer", { consumerId });
    // 서버의 MediaEventsHandler는 'consumer_resumed' 이벤트로 응답
    return this.waitForEvent("consumer_resumed");
  }
}

export const socketApi = new SocketApi();

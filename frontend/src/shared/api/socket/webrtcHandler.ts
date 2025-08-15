// src/shared/api/socket/webrtcHandler.ts

import { Socket } from "socket.io-client";
import { AppDispatch } from "@/shared/config/store";
import {
  RtpCapabilities,
  TransportOptions,
  DtlsParameters,
  RtpParameters,
} from "mediasoup-client/types";
import { mediasoupManager } from "../mediasoupManager";
import { screenShareManager } from "../screenShareManager";
import { chatSocketHandler } from "@/entities/chat/model/socketEvents";
import { addUser, removeUser, setInRoom } from "@/entities/video-conference/session/model/slice";
import {
  User,
  NewProducerInfo,
  PeerWithProducers,
  JoinedRoomResponse,
  JoinRoomData,
  ProducerAppData,
} from "@/shared/types/webrtc.types";
import {
  UserLeftData,
  ProducerClosedData,
  ScreenShareStartedData,
  ScreenShareStoppedData,
} from "@/shared/types/socket.types";
import { socketManager } from "./socketManager"; // socketManager를 가져옵니다.

class WebRTCHandler {
  private socket: Socket | null = null;
  private dispatch: AppDispatch | null = null;
  private mediasoupInitialized: boolean = false;

  public initialize(socket: Socket, dispatch: AppDispatch) {
    this.socket = socket;
    this.dispatch = dispatch;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket || !this.dispatch) return;
    const dispatch = this.dispatch;

    this.socket.on("joined_room", (data: JoinedRoomResponse) => {
      console.log("✅ [WebRTCHandler] 'joined_room' event received.", data);
      this.initializeMediasoupWithProducers(data.rtpCapabilities, data.peers, dispatch);
      dispatch(setInRoom(true));
      chatSocketHandler.handleRoomJoined();
    });

    this.socket.on("user_joined", (user: User) => {
      console.log(`👋 [WebRTCHandler] User joined: ${user.name}`);
      dispatch(addUser(user));
      mediasoupManager.addPeer(user.id, user.name);
    });

    this.socket.on("user_left", (data: UserLeftData) => {
      console.log(`👋 [WebRTCHandler] User left: ${data.id}`);
      dispatch(removeUser(data.id));
      mediasoupManager.removePeer(data.id);
    });

    this.socket.on("new_producer", (data: NewProducerInfo) => {
      console.log("🎬 [WebRTCHandler] New producer available:", data);
      mediasoupManager
        .consumeProducer({
          producerId: data.producerId,
          producerSocketId: data.producerSocketId,
          appData: data.appData,
        })
        .catch((error) => console.error("Failed to consume new producer:", error));
    });

    this.socket.on("producer_closed", (data: ProducerClosedData) => {
      console.log(`🔌 [WebRTCHandler] Producer ${data.producerId} was closed.`);
      mediasoupManager.handleProducerClosed(data.producerId);
    });

    // [수정] 화면 공유 자동 소비 로직 추가
    this.socket.on("screen_share_started", (data: ScreenShareStartedData) => {
      console.log("🖥️ [WebRTCHandler] Screen share started:", data);
      if (this.socket && data.peerId !== this.socket.id) {
        // 다른 사람이 시작한 화면 공유를 자동으로 consume 합니다.
        mediasoupManager
          .consumeProducer({
            producerId: data.producerId,
            producerSocketId: data.peerId,
            appData: { type: "screen", peerId: data.peerId, peerName: data.peerName },
          })
          .catch((err) => console.error("Auto-consuming screen share failed", err));
      }
      window.dispatchEvent(new CustomEvent("screenShareStarted", { detail: data }));
    });

    this.socket.on("screen_share_stopped", (data: ScreenShareStoppedData) => {
      console.log("🖥️ [WebRTCHandler] Screen share stopped:", data);
      window.dispatchEvent(new CustomEvent("screenShareStopped", { detail: data }));
    });
  }

  // [수정] mediasoup 초기화 로직 변경 -> 순환 참조 문제 해결
  private async initializeMediasoupWithProducers(
    rtpCapabilities: RtpCapabilities,
    peers: PeerWithProducers[],
    dispatch: AppDispatch
  ) {
    if (this.mediasoupInitialized) return;
    try {
      await mediasoupManager.loadDevice(rtpCapabilities);
      const roomId = this.getCurrentRoomId();

      // 기존 mediasoupManager의 createTransports 메서드를 사용합니다.
      await mediasoupManager.createTransports(roomId);

      await mediasoupManager.startLocalMedia();

      peers.forEach((peer) => mediasoupManager.addPeer(peer.id, peer.name));
      for (const peer of peers) {
        for (const producer of peer.producers) {
          await mediasoupManager.consumeProducer({
            producerId: producer.producerId,
            producerSocketId: peer.id,
            appData: undefined, // PeerWithProducers doesn't include appData
          });
        }
      }
      this.mediasoupInitialized = true;
    } catch (error) {
      console.error("❌ MediaSoup initialization failed:", error);
    }
  }

  // --- 서버와 통신하는 비동기 메서드들 ---

  public joinRoom = (data: JoinRoomData) => this.socket?.emit("join_room", data);

  public leaveRoom = () => {
    mediasoupManager.cleanup();
    this.mediasoupInitialized = false;
    this.socket?.emit("leave_room");
  };

  public createProducerTransport = (data: { roomId: string }): Promise<TransportOptions> =>
    socketManager.request("create_producer_transport", "producer_transport_created", data);

  public createConsumerTransport = (data: { roomId: string }): Promise<TransportOptions> =>
    socketManager.request("create_consumer_transport", "consumer_transport_created", data);

  public connectTransport = (data: {
    transportId: string;
    dtlsParameters: DtlsParameters;
  }): Promise<void> => socketManager.request("connect_transport", "transport_connected", data);

  public produce = (data: {
    transportId: string;
    kind: "audio" | "video";
    rtpParameters: RtpParameters;
    roomId: string;
    appData?: ProducerAppData;
  }): Promise<{ id: string }> => socketManager.request("produce", "producer_created", data);

  public consume = (data: {
    transportId: string;
    producerId: string;
    rtpCapabilities: RtpCapabilities;
    roomId: string;
  }): Promise<any> => socketManager.request("consume", "consumer_created", data);

  public resumeConsumer = (data: { consumerId: string }): Promise<void> =>
    socketManager.request("resume_consumer", "consumer_resumed", data);

  private getCurrentRoomId(): string {
    const path = window.location.pathname;
    const matches = path.match(/\/groupchat\/([^\/\?#]+)/);
    const roomId = matches ? decodeURIComponent(matches[1]) : "";
    if (!roomId && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const roomIdParam = urlParams.get("roomId");
      if (roomIdParam) return roomIdParam;
    }
    return roomId || "test";
  }
}

export const webrtcHandler = new WebRTCHandler();

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
  private processingProducers = new Set<string>(); // 🆕 처리 중인 Producer 추적

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

      // 중복 처리 방지 로직 (그대로 유지)
      if (this.processingProducers.has(data.producerId)) {
        console.warn(`⚠️ Producer ${data.producerId} is already being processed, ignoring...`);
        return;
      }
      this.processingProducers.add(data.producerId);

      // appData.type을 확인하여 화면 공유인지 판단
      const isScreenShare = data.appData?.type === "screen" || data.appData?.type === "screenshare" || data.appData?.trackType === "screen";

      // mediasoupManager의 consumeProducer를 항상 호출
      // consumeProducer 내부에서 trackType에 따라 다르게 처리하도록 책임을 위임
      mediasoupManager
        .consumeProducer({
          producerId: data.producerId,
          producerSocketId: data.producerSocketId,
          kind: data.kind,
          appData: data.appData,
        })
        .catch((error) => {
          console.error(`❌ Failed to consume producer ${data.producerId}:`, error);
        })
        .finally(() => {
          this.processingProducers.delete(data.producerId);
        });

      // 화면 공유인 경우 UI 이벤트를 위해 추가 처리
      if (isScreenShare) {
        window.dispatchEvent(new CustomEvent("screenShareStarted", { detail: data }));
      }
    });

    // [통합] 프로듀서 종료 처리 (카메라, 오디오, 화면 공유 모두)
    this.socket.on("producer_closed", (data: ProducerClosedData) => {
      console.log(`🔌 [WebRTCHandler] Producer ${data.producerId} was closed.`);

      // mediasoupManager가 producerId를 받아 알아서 처리하도록 위임
      mediasoupManager.handleProducerClosed(data.producerId);
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
            kind: producer.kind, // 🆕 kind 정보 전달
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

  public closeProducer = (data: { producerId: string }): Promise<void> =>
    socketManager.request("close_producer", "producer_closed", data);

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

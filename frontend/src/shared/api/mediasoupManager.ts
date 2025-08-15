// src/shared/api/mediasoupManager.ts
import { Device } from "mediasoup-client";
import { Transport, RtpCapabilities } from "mediasoup-client/types";
import { AppDispatch } from "@/shared/config/store";
import { mediaTrackManager } from "./mediaTrackManager";
import { screenShareManager } from "./screenShareManager"; // 🆕 화면 공유 매니저 추가
import {
  setDeviceLoaded,
  setRtpCapabilities,
  setTransports,
  setTransportConnected,
  addRemotePeer,
  removeRemotePeer,
  resetMediaState,
} from "@/entities/video-conference/media/model/mediaSlice";
import { webrtcHandler } from "./socket";
import { ProducerAppData } from "@/shared/types/webrtc.types";

class MediasoupManager {
  private device: Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private dispatch: AppDispatch | null = null;
  private currentRoomId: string = "";
  private consumingProducers: Set<string> = new Set(); // 🆕 진행 중인 consume 작업 추적
  private consumedProducers: Set<string> = new Set(); // 🆕 이미 완료된 Producer 추적

  public async init(dispatch: AppDispatch) {
    this.dispatch = dispatch;
    mediaTrackManager.init(dispatch);

    try {
      console.log("🚀 Initializing MediaSoup...");

      // Device 생성 및 초기화
      this.device = new Device();
      console.log("✅ MediaSoup Device created");
    } catch (error) {
      console.error("❌ MediaSoup initialization failed:", error);
      throw error;
    }
  }

  // RTP Capabilities 로드
  public async loadDevice(rtpCapabilities: RtpCapabilities): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error("Device not initialized");
    }

    // 이미 로드된 경우 스킵
    if (this.device.loaded) {
      console.log("⚠️ Device already loaded, skipping...");
      return;
    }

    try {
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });

      this.dispatch(setRtpCapabilities(rtpCapabilities));
      this.dispatch(setDeviceLoaded(true));

      // 🆕 Device 로드 완료 후 ScreenShareManager 초기화
      if (this.device) {
        screenShareManager.init(this.dispatch, this.device);
        console.log("🖥️ ScreenShareManager initialized with device");
      }

      console.log("✅ Device loaded with RTP capabilities");
    } catch (error) {
      console.error("❌ Failed to load device:", error);
      throw error;
    }
  }

  // Transport 생성
  public async createTransports(roomId: string): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error("Device not initialized");
    }

    this.currentRoomId = roomId;

    try {
      // Send Transport 생성
      const sendTransportData = await webrtcHandler.createProducerTransport({ roomId });
      console.log("📤 Send transport data:", sendTransportData);
      this.sendTransport = this.device.createSendTransport(sendTransportData);
      this.setupSendTransportEvents(roomId);

      // Recv Transport 생성
      const recvTransportData = await webrtcHandler.createConsumerTransport({ roomId });
      console.log("📥 Recv transport data:", recvTransportData);
      this.recvTransport = this.device.createRecvTransport(recvTransportData);
      this.setupRecvTransportEvents();

      // MediaTrackManager에 Transport 설정
      mediaTrackManager.setTransports(this.sendTransport, this.recvTransport, roomId);

      this.dispatch(
        setTransports({
          sendId: this.sendTransport.id,
          recvId: this.recvTransport.id,
        })
      );

      console.log("✅ Transports created successfully");
    } catch (error) {
      console.error("❌ Failed to create transports:", error);
      throw error;
    }
  }

  // 로컬 미디어 시작
  public async startLocalMedia(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      // 개별 트랙으로 Producer 생성
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      if (audioTrack) {
        await mediaTrackManager.addLocalTrack(audioTrack, "local", "camera");
      }
      if (videoTrack) {
        await mediaTrackManager.addLocalTrack(videoTrack, "local", "camera");
      }

      console.log("✅ Local media started");
    } catch (error) {
      console.error("❌ Failed to start local media:", error);
      throw error;
    }
  }

  // 🆕 원격 Producer 소비 (화면 공유 타입 감지)
  public async consumeProducer(data: {
    producerId: string;
    producerSocketId: string;
    kind?: "audio" | "video"; // 🆕 kind 정보 추가
    appData?: any;
  }): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error("Device not initialized");
    }

    const { producerId, producerSocketId, kind, appData } = data;

    console.log(
      `🔍 Attempting to consume producer: ${producerId} (${
        kind || "unknown"
      }) from ${producerSocketId}`
    );

    // 🔒 1단계: 이미 완료된 Producer 체크 (즉시 차단)
    if (this.consumedProducers.has(producerId)) {
      console.warn(`⚠️ Producer ${producerId} already completed, ignoring...`);
      return;
    }

    // 🔒 2단계: 진행 중인 consume 작업 체크 (동시 작업 방지)
    if (this.consumingProducers.has(producerId)) {
      console.warn(`⚠️ Producer ${producerId} is already being consumed, ignoring...`);
      return;
    }

    // 🔒 3단계: MediaTrackManager의 기존 트랙 체크
    const existingTrackInfo = mediaTrackManager.getTrackByProducerId(producerId);
    if (existingTrackInfo) {
      console.warn(
        `⚠️ Producer ${producerId} already consumed as ${existingTrackInfo.trackType} ${existingTrackInfo.kind}, marking as completed...`
      );
      this.consumedProducers.add(producerId);
      return;
    }

    // 🔒 4단계: Socket ID + Kind 기반 정확한 중복 체크
    const isScreenShare =
      appData?.type === "screenshare" ||
      appData?.type === "screen" ||
      appData?.trackType === "screen";
    const trackType = isScreenShare ? "screen" : "camera";

    // kind가 있는 경우에만 정확한 중복 체크 수행
    if (kind) {
      const hasExistingTrack = mediaTrackManager.hasRemoteProducer(
        producerId,
        producerSocketId,
        kind,
        trackType
      );
      if (hasExistingTrack) {
        console.warn(
          `⚠️ Remote ${trackType} ${kind} track already exists for socket ${producerSocketId}, marking as completed...`
        );
        this.consumedProducers.add(producerId);
        return;
      }
    }

    // 🔒 진행 중인 작업으로 마킹 (모든 체크 통과 후)
    this.consumingProducers.add(producerId);
    console.log(`🔒 Locked producer ${producerId} for consumption`);

    try {
      // 🆕 화면 공유인지 감지 (이미 위에서 정의됨)
      console.log(
        `🔍 Consuming producer: ${producerId} (${
          isScreenShare ? "screen share" : "camera"
        }) from ${producerSocketId}`
      );
      if (isScreenShare) {
        await screenShareManager.consumeScreenShare(
          this.currentRoomId,
          producerId,
          producerSocketId,
          appData?.peerName || "Unknown User"
        );
      } else {
        // 📹 일반 미디어는 기존 로직으로 처리
        // 서버에서 Producer 정보 가져오기
        const consumerData = await webrtcHandler.consume({
          transportId: this.recvTransport!.id,
          producerId,
          rtpCapabilities: this.device.rtpCapabilities,
          roomId: this.currentRoomId,
        });

        // Consumer 생성
        const consumer = await this.recvTransport!.consume(consumerData);

        // 🔒 Consumer 생성 직전 최종 중복 체크
        const finalTrackCheck = mediaTrackManager.getTrackByProducerId(producerId);
        if (finalTrackCheck) {
          console.warn(
            `⚠️ Producer ${producerId} was consumed during processing, cleaning up consumer...`
          );
          consumer.close();
          this.consumingProducers.delete(producerId);
          this.consumedProducers.add(producerId);
          return;
        }

        // MediaTrackManager를 통해 트랙 관리
        await mediaTrackManager.addRemoteTrack(
          producerId,
          producerSocketId,
          kind || (consumer.kind as "audio" | "video"), // 🆕 원래 kind 정보 우선 사용
          this.device.rtpCapabilities,
          trackType // 화면 공유 vs 카메라 구분
        );

        // Consumer resume
        if (consumer.paused) {
          await webrtcHandler.resumeConsumer({ consumerId: consumer.id });
        }
      }

      console.log(`✅ Consumer created for ${producerSocketId}:`, {
        producerId,
        type: isScreenShare ? "screen" : "camera",
      });

      // 완료 후 진행 중 목록에서 제거하고 완료 목록에 추가
      this.consumingProducers.delete(producerId);
      this.consumedProducers.add(producerId);
      console.log(`🔓 Unlocked and marked completed producer ${producerId}`);
    } catch (error) {
      console.error(`❌ Failed to consume producer ${producerId}:`, error);

      // 중복 msid 오류이거나 이미 처리된 Producer인 경우 무시
      if (
        error instanceof Error &&
        (error.message.includes("Duplicate a=msid") ||
          error.message.includes("already consumed") ||
          error.message.includes("Consumer already exists"))
      ) {
        console.warn(
          `⚠️ Producer ${producerId} seems to be already consumed, marking as completed...`
        );
        this.consumingProducers.delete(producerId);
        this.consumedProducers.add(producerId);
        return;
      }

      // 에러 발생 시에도 진행 중 목록에서 제거 (재시도 가능하도록 completed에는 추가하지 않음)
      this.consumingProducers.delete(producerId);
      console.log(`🔓 Unlocked producer ${producerId} due to error`);
      throw error;
    }
  }

  // 피어 추가
  public addPeer(socketId: string, peerName: string): void {
    if (!this.dispatch) return;

    this.dispatch(
      addRemotePeer({
        socketId,
        peerId: socketId,
        peerName,
      })
    );

    console.log(`👥 Peer added: ${peerName} (${socketId})`);
  }

  // 🆕 피어 제거 (화면 공유도 함께 정리)
  public removePeer(socketId: string): void {
    if (!this.dispatch) return;

    console.log(`🧹 Starting peer removal cleanup for ${socketId}`);

    // 1. 해당 피어와 관련된 모든 completed/consuming producer 정리
    const peersProducers = Array.from(this.consumedProducers).concat(
      Array.from(this.consumingProducers)
    );
    const peersTrackIds = new Set<string>();

    // 해당 소켓ID와 관련된 모든 트랙 찾기
    for (const [trackId, trackInfo] of mediaTrackManager.getAllRemoteTracks()) {
      if (trackInfo.peerId === socketId) {
        peersTrackIds.add(trackId);
        if (trackInfo.consumer) {
          console.log(
            `🗑️ Cleaning up consumer for peer ${socketId}: ${trackInfo.consumer.producerId}`
          );
          this.consumedProducers.delete(trackInfo.consumer.producerId);
          this.consumingProducers.delete(trackInfo.consumer.producerId);
        }
      }
    }

    // 2. MediaTrackManager에서 해당 피어의 모든 트랙 제거 (카메라 + 화면 공유)
    mediaTrackManager.removeRemoteTrackByType(socketId, "camera");
    mediaTrackManager.removeRemoteTrackByType(socketId, "screen");

    // 3. ScreenShareManager에서도 정리
    try {
      screenShareManager.removeRemoteScreenShare("unknown", socketId);
    } catch (error) {
      console.warn(`⚠️ Screen share cleanup failed for ${socketId}:`, error);
    }

    // 4. Redux 상태에서 피어 제거
    this.dispatch(removeRemotePeer(socketId));

    console.log(
      `✅ Peer removal completed for ${socketId}. Cleaned up ${peersTrackIds.size} tracks`
    );
  }

  // 🆕 Producer 종료 처리 (화면 공유 감지)
  public handleProducerClosed(producerId: string): void {
    console.log(`🔌 Producer ${producerId} closed - cleaning up consumer states`);

    // Producer 관련 상태 정리
    this.consumedProducers.delete(producerId);
    this.consumingProducers.delete(producerId);

    const trackInfo = mediaTrackManager.getTrackByProducerId(producerId);
    if (!trackInfo) {
      console.warn(`⚠️ No track found for producer ${producerId} - already cleaned up`);
      return;
    }

    console.log(`🔌 Producer ${producerId} closed, track type: ${trackInfo.trackType}`);

    // [역할 분리] 화면 공유 트랙이면 screenShareManager에 정리 위임
    if (trackInfo.trackType === "screen") {
      // 원격 트랙인지 확인 (remoteTracks에서 관리되는 트랙)
      const isRemoteTrack = mediaTrackManager.getAllRemoteTracks().has(trackInfo.trackId);

      if (isRemoteTrack) {
        // 원격 화면 공유 트랙 - screenShareManager에서 처리
        screenShareManager.removeRemoteScreenShare(producerId, trackInfo.peerId);
      } else {
        // 로컬 화면 공유 트랙 - 이미 stopScreenShare에서 처리되었으므로 스킵
        console.log(`🚫 Skipping local screen share cleanup - already handled by stopScreenShare`);
      }
    } else {
      // 일반 카메라/오디오 트랙은 직접 제거
      mediaTrackManager.removeTrackByProducerId(producerId);
    }
  }

  // 현재 사용자 ID 가져오기 (소켓 ID 등)
  private getCurrentUserId(): string {
    // 여기서는 간단히 처리하기 위해 로컬 트랙인지 확인하는 다른 방법을 사용
    return "local"; // 실제로는 현재 사용자의 소켓 ID를 반환해야 함
  }

  // 로컬 트랙 토글
  public toggleLocalTrack(kind: "audio" | "video"): void {
    // 🆕 카메라 전용 메서드 사용 (화면 공유와 완전 분리)
    const track = mediaTrackManager.getLocalCameraTrack(kind);
    const trackInfo = mediaTrackManager.getLocalCameraTrackInfo(kind);

    if (track && trackInfo) {
      const newEnabled = !track.enabled;
      mediaTrackManager.enableLocalTrack(trackInfo.trackId, newEnabled);
      console.log(`🔄 Local camera ${kind} ${newEnabled ? "enabled" : "disabled"}`);
    } else {
      console.warn(`⚠️ Local camera ${kind} track not found`);
    }
  }

  // 디바이스 변경
  public async changeDevice(kind: "audio" | "video", deviceId: string): Promise<void> {
    try {
      const constraints =
        kind === "video"
          ? { video: { deviceId, width: 1280, height: 720 } }
          : { audio: { deviceId } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = stream.getTracks()[0];

      // 🆕 카메라 전용 메서드로 기존 트랙 교체
      const existingTrackInfo = mediaTrackManager.getLocalCameraTrackInfo(kind);
      if (existingTrackInfo) {
        await mediaTrackManager.replaceLocalTrack(existingTrackInfo.trackId, newTrack);
        console.log(`🔄 Camera ${kind} device changed successfully`);
      } else {
        console.warn(`⚠️ No existing camera ${kind} track to replace`);
      }

      console.log(`🔄 ${kind} device changed to:`, deviceId);
    } catch (error) {
      console.error(`❌ Failed to change ${kind} device:`, error);
      throw error;
    }
  }

  // 정리
  public cleanup(): void {
    console.log("🧹 Cleaning up MediaSoup...");

    // 🆕 ScreenShareManager 정리
    screenShareManager.cleanup();

    // 트랙 매니저 정리
    mediaTrackManager.cleanup();

    // Transport 정리
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }
    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }

    // Device 정리
    this.device = null;

    // 진행 중인 consume 작업 목록 및 완료된 Producer 목록 초기화
    this.consumingProducers.clear();
    this.consumedProducers.clear();

    // Redux 상태 초기화
    if (this.dispatch) {
      this.dispatch(resetMediaState());
    }

    this.currentRoomId = "";
    this.dispatch = null;

    console.log("✅ MediaSoup cleanup completed");
  }

  // Send Transport 이벤트 설정
  private setupSendTransportEvents(roomId: string): void {
    if (!this.sendTransport) return;

    this.sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        await webrtcHandler.connectTransport({
          transportId: this.sendTransport!.id,
          dtlsParameters,
        });
        callback();
        console.log("✅ Send transport connected");
      } catch (error) {
        console.error("❌ Send transport connect failed:", error);
        errback(error as Error);
      }
    });

    this.sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const { id } = await webrtcHandler.produce({
            transportId: this.sendTransport!.id,
            kind,
            rtpParameters,
            roomId,
            appData: appData as unknown as ProducerAppData | undefined, // 🆕 appData 전달 (화면 공유 정보 포함)
          });
          callback({ id });
          console.log(
            `✅ Producer created: ${id} (${kind})${
              appData?.type === "screen" ? " [SCREEN SHARE]" : ""
            }`
          );
        } catch (error) {
          console.error("❌ Produce failed:", error);
          errback(error as Error);
        }
      }
    );

    this.sendTransport.on("connectionstatechange", (state) => {
      console.log(`🔗 Send transport state: ${state}`);

      if (this.dispatch) {
        const functionallyConnected = state === "connected" || state === "failed";
        this.dispatch(setTransportConnected(functionallyConnected));
      }

      if (state === "failed") {
        console.warn("⚠️ Send transport state is failed, but may still be functional");
        this.sendTransport?.getStats().then((stats) => {
          console.log("Send transport stats:", stats);
        });
      }
    });

    // ICE gathering state 변경 추적
    this.sendTransport.on("icegatheringstatechange", (iceState) => {
      console.log(`🧊 Send transport ICE gathering state: ${iceState}`);
    });

    // ICE candidate error 추적
    this.sendTransport.on("icecandidateerror", (error) => {
      console.error(`❌ Send transport ICE candidate error:`, error);
    });
  }

  // Recv Transport 이벤트 설정
  private setupRecvTransportEvents(): void {
    if (!this.recvTransport) return;

    this.recvTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        await webrtcHandler.connectTransport({
          transportId: this.recvTransport!.id,
          dtlsParameters,
        });
        callback();
        console.log("✅ Recv transport connected");
      } catch (error) {
        console.error("❌ Recv transport connect failed:", error);
        errback(error as Error);
      }
    });

    this.recvTransport.on("connectionstatechange", (state) => {
      console.log(`🔗 Recv transport state: ${state}`);

      if (this.dispatch && this.sendTransport) {
        const bothConnected =
          (state === "connected" && this.sendTransport.connectionState === "connected") ||
          (this.sendTransport.connectionState === "connected" && state === "connected");
        this.dispatch(setTransportConnected(bothConnected));
      }

      if (state === "failed") {
        console.error("❌ Recv transport connection failed");
        this.recvTransport?.getStats().then((stats) => {
          console.log("Recv transport stats:", stats);
        });
      }
    });

    // ICE gathering state 변경 추적
    this.recvTransport.on("icegatheringstatechange", (iceState) => {
      console.log(`🧊 Recv transport ICE gathering state: ${iceState}`);
    });

    // ICE candidate error 추적
    this.recvTransport.on("icecandidateerror", (error) => {
      console.error(`❌ Recv transport ICE candidate error:`, error);
    });
  }

  // Getters
  public getDevice(): Device | null {
    return this.device;
  }

  public isDeviceLoaded(): boolean {
    return this.device?.loaded ?? false;
  }

  // [신규] Producer ID를 받아 종료하는 범용 메서드
  public async stopProduction(producerId: string): Promise<void> {
    // 서버에 `close_producer` 이벤트를 전송
    await webrtcHandler.closeProducer({ producerId });
    // 로컬 Producer 객체는 mediaTrackManager에서 관리하므로 여기선 서버에 알리기만 함
    console.log(`Sent close_producer for ${producerId} to server.`);
  }
}

export const mediasoupManager = new MediasoupManager();

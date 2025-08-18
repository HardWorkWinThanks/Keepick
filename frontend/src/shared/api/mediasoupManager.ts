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
import { initializeAISystem, cleanupAISystem, frontendAiProcessor } from "./ai";
import { AiSystemConfig } from "@/shared/types/ai.types";

class MediasoupManager {
  private device: Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private dispatch: AppDispatch | null = null;
  private currentRoomId: string = "";
  private isLocalMediaStarted = false; // 로컬 미디어 시작 상태 추가
  
  private aiSourceTrack: MediaStreamTrack | null = null; 
  // Transport 복구 관리
  private transportRecoveryInProgress = false;
  private lastTransportFailureTime = 0;
  private transportRecoveryDelay = 5000; // 5초

  /**
   * MediasoupManager를 초기화합니다.
   * AI 시스템도 함께 초기화합니다.
   * @param dispatch Redux dispatch 함수
   */
  public async init(dispatch: AppDispatch): Promise<void> {
    this.dispatch = dispatch;
    mediaTrackManager.init(dispatch);
    await initializeAISystem(dispatch); // AI 시스템 초기화 호출

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
  /**
   * 로컬 미디어를 시작합니다.
   * @param enableAI AI 기능 활성화 여부 (사용하지 않음)
   * @param aiConfig AI 시스템 설정 (사용하지 않음)
   */
  public async startLocalMedia(enableAI: boolean = false, aiConfig?: Partial<AiSystemConfig>): Promise<void> {
    try {
      // 이미 미디어가 시작된 경우 스킵
      if (this.isLocalMediaStarted) {
        console.log("🔄 Media already started.");
        return;
      }

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
        if (enableAI && aiConfig) {
          // AI 기능이 활성화된 경우: AI 처리된 트랙을 상대방에게 전송
          console.log("🤖 Adding AI-processed video track...");
          await mediaTrackManager.addLocalTrackWithAI(videoTrack, "local", "camera", undefined, aiConfig);
        } else {
          // AI 기능이 비활성화된 경우: 원본 트랙 전송
          console.log("📹 Adding original video track...");
          await mediaTrackManager.addLocalTrack(videoTrack, "local", "camera");
        }
      }

      this.isLocalMediaStarted = true;
      console.log("✅ Local media started");
    } catch (error) {
      console.error("❌ Failed to start local media:", error);
      throw error;
    }
  }


  /**
   * AI 설정만 업데이트합니다 (트랙 교체 없이).
   * @param aiConfig AI 시스템 설정
   */
  public updateAIConfig(aiConfig: Partial<AiSystemConfig>): void {
    frontendAiProcessor.updateConfig(aiConfig);
    console.log("✅ AI configuration updated without track replacement");
  }

  /**
   * 화상회의 중 AI 토글 (실제 트랙 교체)
   * @param enabled AI 활성화 여부
   * @param aiConfig AI 설정
   */
  public async toggleAIDuringConference(enabled: boolean, aiConfig?: Partial<AiSystemConfig>): Promise<void> {
  try {
    console.log("🔄 Starting AI toggle during conference...", { enabled, aiConfig });

    // AI 비활성화 시, AI 전용 소스 트랙만 안전하게 정리 (원본 카메라 트랙 보호)
    if (!enabled && this.aiSourceTrack) {
      console.log(`🧹 Safely stopping AI source track: ${this.aiSourceTrack.id} (preserving camera)`);
      this.aiSourceTrack.stop();
      this.aiSourceTrack = null;
    }

    const existingVideoTrack = mediaTrackManager.getLocalCameraTrack("video");
    const existingTrackInfo = mediaTrackManager.getLocalCameraTrackInfo("video");

    if (!existingVideoTrack || !existingTrackInfo) {
      console.warn("⚠️ No existing video track found to toggle AI");
      return;
    }

    if (enabled && aiConfig) {
      // AI 기능 활성화
      console.log("🤖 Enabling AI during conference...");
      this.updateAIConfig(aiConfig);
      
      // 🔽 원본 카메라 트랙을 복제하여 AI 처리 (원본 보호)
      console.log(`🔄 Cloning camera track ${existingVideoTrack.id} for AI processing (preserving original)`);
      this.aiSourceTrack = existingVideoTrack.clone(); 
      
      console.log("🚀 Processing cloned track with AI...");
      // AI 처리는 복제된 트랙으로 진행 - 원본 카메라 트랙 안전
      const processedTrack = await frontendAiProcessor.processVideoTrack(this.aiSourceTrack);
      
      console.log("🎯 AI processed track created:", {
        trackId: processedTrack.id,
        enabled: processedTrack.enabled,
        readyState: processedTrack.readyState,
      });

      console.log("🔄 Replacing camera track with AI-processed track...");
      // 기존 카메라 Producer의 트랙을 AI 처리된 트랙으로 교체
      // 원본 트랙은 복제를 사용했으므로 안전하게 보존됨
      await mediaTrackManager.replaceLocalTrack(existingTrackInfo.trackId, processedTrack);
      
      console.log("✅ AI enabled with track replacement");

    } else {
      // AI 기능 비활성화
      console.log("📹 Disabling AI during conference...");
       this.updateAIConfig({
        gesture: {
          static: { enabled: false, confidence: 0.75 },
          dynamic: { enabled: false, confidence: 0.9 },
        },
        emotion: { enabled: false, confidence: 0.6 },
        beauty: { enabled: false },
      });
      
      console.log("📷 Getting new camera stream to replace AI track...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      const newVideoTrack = stream.getVideoTracks()[0];

      console.log("🔄 Replacing AI track with new original track...");
      await mediaTrackManager.replaceLocalTrack(existingTrackInfo.trackId, newVideoTrack);
      
      // 🔽 FIX: AI를 비활성화할 때, AI 전용 복제 트랙만 중지 (원본 카메라 트랙 보호)
      if (this.aiSourceTrack) {
        console.log(`🧹 Stopping AI source track: ${this.aiSourceTrack.id} (clone only)`);
        // AI 처리용 복제 트랙만 중지 - 원본 카메라 트랙은 건드리지 않음
        this.aiSourceTrack.stop();
        this.aiSourceTrack = null;
      }
      
      // AI 프로세서의 처리도 중지
      frontendAiProcessor.stopProcessing();
      
      console.log("✅ AI disabled with original track");
    }
  } catch (error) {
    console.error("❌ Failed to toggle AI during conference:", error);
    console.error("❌ Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

  // 소비 요청을 mediaTrackManager에 위임
  public async consumeProducer(data: {
    producerId: string;
    producerSocketId: string;
    kind?: "audio" | "video";
    appData?: any;
  }): Promise<void> {
    const { producerId, producerSocketId, kind, appData } = data;

    if (!this.device) {
      console.error("[SKIP] Device not initialized. Skipping consumption.");
      return;
    }

    try {
      const isScreenShare = appData?.type === "screenshare" || appData?.type === "screen" || appData?.trackType === "screen";
      const trackType = isScreenShare ? "screen" : "camera";

      console.log(`[CONSUME] Delegating consume for producer: ${producerId} (${kind}, ${trackType})`);

      if (isScreenShare) {
        await screenShareManager.consumeScreenShare(
          this.currentRoomId,
          producerId,
          producerSocketId,
          appData?.peerName || "Unknown User"
        );
      } else {
        await mediaTrackManager.consumeAndAddRemoteTrack(
          producerId,
          producerSocketId,
          kind || "video",
          this.device.rtpCapabilities,
          trackType
        );
      }

      console.log(`[SUCCESS] Consumer creation delegated for producer: ${producerId}`);
    } catch (error) {
      console.error(`❌ Failed to delegate consume for producer ${producerId}:`, error);
      
      // Transport 연결 문제인 경우 복구 시도
      if (this.isTransportError(error)) {
        console.log(`🔄 Transport error detected, attempting recovery...`);
        await this.handleTransportRecovery();
        // 복구 후 재시도
        try {
          const isScreenShare = appData?.type === "screenshare" || appData?.type === "screen" || appData?.trackType === "screen";
          const trackType = isScreenShare ? "screen" : "camera";
          
          if (isScreenShare) {
            await screenShareManager.consumeScreenShare(
              this.currentRoomId,
              producerId,
              producerSocketId,
              appData?.peerName || "Unknown User"
            );
          } else {
            await mediaTrackManager.consumeAndAddRemoteTrack(
              producerId,
              producerSocketId,
              kind || "video",
              this.device.rtpCapabilities,
              trackType
            );
          }
          console.log(`✅ Recovery successful after transport recovery for producer: ${producerId}`);
          return;
        } catch (retryError) {
          console.error(`❌ Recovery failed even after transport recovery:`, retryError);
        }
      }
      
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

    // 1. MediaTrackManager에서 해당 피어의 모든 트랙 제거
    mediaTrackManager.removeRemoteTracksByPeer(socketId);

    // 2. ScreenShareManager에서도 정리
    screenShareManager.removeRemoteScreenShare("unknown", socketId);

    // 3. Redux 상태에서 피어 제거
    this.dispatch(removeRemotePeer(socketId));

    console.log(`✅ Peer removal completed for ${socketId}.`);
  }

  // Producer 종료 처리
  public handleProducerClosed(producerId: string): void {
    console.log(`🔌 Producer ${producerId} closed - delegating cleanup to managers.`);

    const trackInfo = mediaTrackManager.getTrackByProducerId(producerId);
    if (!trackInfo) {
      console.warn(`⚠️ No track found for producer ${producerId} - already cleaned up?`);
      return;
    }

    if (trackInfo.trackType === "screen") {
      screenShareManager.removeRemoteScreenShare(producerId, trackInfo.peerId);
    } else {
      mediaTrackManager.removeTrackByProducerId(producerId);
    }
  }

  // 🆕 원격 Producer pause 처리
  public handleRemoteProducerPaused(producerId: string, socketId: string): void {
    console.log(`⏸️ Remote producer ${producerId} paused from ${socketId}`);
    
    const consumerInfo = mediaTrackManager.getRemoteTrackByProducerId(producerId);
    if (consumerInfo) {
      try {
        if (consumerInfo.consumer) {
          consumerInfo.consumer.pause();
          console.log(`⏸️ Consumer paused for producer ${producerId}`);
          
          // Redux 상태 업데이트
          mediaTrackManager.updateRemoteTrackState(socketId, consumerInfo.kind, { enabled: false });
        }
      } catch (error) {
        console.error(`❌ Failed to pause consumer for producer ${producerId}:`, error);
      }
    }
  }

  // 🆕 원격 Producer resume 처리
  public handleRemoteProducerResumed(producerId: string, socketId: string): void {
    console.log(`▶️ Remote producer ${producerId} resumed from ${socketId}`);
    
    const consumerInfo = mediaTrackManager.getRemoteTrackByProducerId(producerId);
    if (consumerInfo) {
      try {
        if (consumerInfo.consumer) {
          consumerInfo.consumer.resume();
          console.log(`▶️ Consumer resumed for producer ${producerId}`);
          
          // Redux 상태 업데이트
          mediaTrackManager.updateRemoteTrackState(socketId, consumerInfo.kind, { enabled: true });
        }
      } catch (error) {
        console.error(`❌ Failed to resume consumer for producer ${producerId}:`, error);
      }
    }
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
  /**
   * MediasoupManager와 관련된 모든 리소스를 정리합니다.
   * AI 시스템도 함께 정리합니다.
   */
  public cleanup(): void {
    console.log("🧹 Cleaning up MediaSoup...");

    // AI 소스 트랙만 안전하게 정리 (원본 카메라 트랙 보호)
    if (this.aiSourceTrack) {
      console.log(`🧹 Cleanup: Stopping AI source track: ${this.aiSourceTrack.id}`);
      this.aiSourceTrack.stop();
      this.aiSourceTrack = null;
    }

    // 🆕 ScreenShareManager 정리
    screenShareManager.cleanup();

    // 트랙 매니저 정리
    mediaTrackManager.cleanup();

    // AI 시스템 정리 호출
    cleanupAISystem();

    // Transport 정리
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }
    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }
    
    // Transport 복구 상태 초기화
    this.transportRecoveryInProgress = false;
    this.lastTransportFailureTime = 0;

    // Device 정리
    this.device = null;

    // 로컬 미디어 상태 초기화
    this.isLocalMediaStarted = false;

    // Redux 상태 초기화
    if (this.dispatch) {
      this.dispatch(resetMediaState());
    }

    this.currentRoomId = "";
    this.dispatch = null;

    console.log("✅ MediaSoup cleanup completed");
  }

  // Transport 에러 감지
  private isTransportError(error: any): boolean {
    if (error instanceof Error) {
      const transportErrors = [
        'transport', 'connection', 'dtls', 'ice', 'failed to connect',
        'transport closed', 'transport failed', 'dtls failed'
      ];
      
      const errorMessage = error.message.toLowerCase();
      return transportErrors.some(keyword => errorMessage.includes(keyword));
    }
    return false;
  }

  // Transport 복구 로직
  private async handleTransportRecovery(): Promise<void> {
    // 이미 복구 중이거나 최근에 복구한 경우 스킵
    const now = Date.now();
    if (this.transportRecoveryInProgress || (now - this.lastTransportFailureTime) < this.transportRecoveryDelay) {
      console.log(`⚠️ Skipping transport recovery (in progress: ${this.transportRecoveryInProgress}, recent: ${(now - this.lastTransportFailureTime) < this.transportRecoveryDelay})`);
      return;
    }

    this.transportRecoveryInProgress = true;
    this.lastTransportFailureTime = now;

    try {
      console.log(`🔄 Starting transport recovery...`);
      
      // 1단계: 기존 transport 상태 체크
      const sendState = this.sendTransport?.connectionState;
      const recvState = this.recvTransport?.connectionState;
      
      console.log(`🔍 Transport states - Send: ${sendState}, Recv: ${recvState}`);
      
      // 2단계: 문제가 있는 transport 재연결
      if (recvState === 'failed' || recvState === 'disconnected' || recvState === 'closed') {
        console.log(`🔄 Recreating receive transport...`);
        await this.recreateReceiveTransport();
      }
      
      if (sendState === 'failed' || sendState === 'disconnected' || sendState === 'closed') {
        console.log(`🔄 Recreating send transport...`);
        await this.recreateSendTransport();
      }
      
      console.log(`✅ Transport recovery completed successfully`);
      
    } catch (recoveryError) {
      console.error(`❌ Transport recovery failed:`, recoveryError);
      const errorMessage = recoveryError instanceof Error ? recoveryError.message : String(recoveryError);
      throw new Error(`Transport recovery failed: ${errorMessage}`);
    } finally {
      this.transportRecoveryInProgress = false;
    }
  }

  // Receive transport 재생성
  private async recreateReceiveTransport(): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error("Device not initialized for transport recreation");
    }

    try {
      // 기존 transport 정리
      if (this.recvTransport) {
        this.recvTransport.close();
      }

      // 새 transport 생성
      const recvTransportData = await webrtcHandler.createConsumerTransport({ 
        roomId: this.currentRoomId 
      });
      
      this.recvTransport = this.device.createRecvTransport(recvTransportData);
      this.setupRecvTransportEvents();

      // MediaTrackManager에 새 transport 설정
      if (this.sendTransport) {
        mediaTrackManager.setTransports(this.sendTransport, this.recvTransport, this.currentRoomId);
      }

      console.log(`✅ Receive transport recreated successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to recreate receive transport:`, error);
      throw error;
    }
  }

  // Send transport 재생성
  private async recreateSendTransport(): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error("Device not initialized for transport recreation");
    }

    try {
      // 기존 transport 정리
      if (this.sendTransport) {
        this.sendTransport.close();
      }

      // 새 transport 생성
      const sendTransportData = await webrtcHandler.createProducerTransport({ 
        roomId: this.currentRoomId 
      });
      
      this.sendTransport = this.device.createSendTransport(sendTransportData);
      this.setupSendTransportEvents(this.currentRoomId);

      // MediaTrackManager에 새 transport 설정
      if (this.recvTransport) {
        mediaTrackManager.setTransports(this.sendTransport, this.recvTransport, this.currentRoomId);
      }

      console.log(`✅ Send transport recreated successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to recreate send transport:`, error);
      throw error;
    }
  }

  // Transport 상태 강제 검증 (필요시 호출)
  public async verifyAndRecoverTransports(): Promise<void> {
    if (!this.sendTransport || !this.recvTransport) {
      throw new Error("Transports not initialized");
    }

    const sendState = this.sendTransport.connectionState;
    const recvState = this.recvTransport.connectionState;
    
    console.log(`🔍 Transport verification - Send: ${sendState}, Recv: ${recvState}`);
    
    if (sendState === 'failed' || recvState === 'failed' || 
        sendState === 'disconnected' || recvState === 'disconnected') {
      console.log(`⚠️ Transport verification failed, initiating recovery...`);
      await this.handleTransportRecovery();
    } else {
      console.log(`✅ Transport verification passed`);
    }
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

  // 로컬 미디어 시작 여부 확인
  public getIsLocalMediaStarted(): boolean {
    return this.isLocalMediaStarted;
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
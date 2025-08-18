// src/shared/api/screenShareManager.ts
import { Device } from "mediasoup-client";
import { AppDispatch } from "@/shared/config/store";
import { mediaTrackManager } from "./mediaTrackManager";
import {
  startScreenShareRequest,
  startScreenShareSuccess,
  startScreenShareFailure,
  stopScreenShareRequest,
  stopScreenShareSuccess,
  stopScreenShareFailure,
  addRemoteScreenShare,
  removeRemoteScreenShare,
} from "@/entities/screen-share/model/slice";
import { mediasoupManager } from "./mediasoupManager";
import { DuplicateValidator, TrackMaps, duplicateValidator } from "./managers/DuplicateValidator";
import { UserFeedbackManager, userFeedbackManager } from "./managers/UserFeedbackManager";
import { RecoveryManager, recoveryManager } from "./managers/RecoveryManager";

class ScreenShareManager {
  private dispatch: AppDispatch | null = null;
  private device: Device | null = null;

  // 🆕 간소화: MediaStream만 관리, Producer/Consumer는 MediaTrackManager가 담당
  private localStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>(); // peerId -> MediaStream

  // 리소스 정리를 위한 타이머
  private streamCleanupTimers = new Map<string, number>();

  // 중복 종료 방지를 위한 플래그
  private stoppingScreenShare = false;
  
  // 중복 시작 방지를 위한 플래그
  private startingScreenShare = false;

  public init(dispatch: AppDispatch, device: Device) {
    this.dispatch = dispatch;
    this.device = device;
    console.log("🔧 ScreenShareManager initialized with MediaTrackManager integration");
  }

  public getLocalScreenStream = () => {
    console.log("📺 Getting local screen stream:", !!this.localStream);
    return this.localStream;
  };

  public getRemoteScreenStream = (peerId: string) => {
    const stream = this.remoteStreams.get(peerId);
    console.log(`📺 Getting remote screen stream for ${peerId}:`, {
      streamExists: !!stream,
      streamActive: stream?.active,
      trackCount: stream?.getTracks().length,
      streamId: stream?.id,
    });

    if (stream && stream.active && stream.getTracks().length > 0) {
      console.log(`✅ Returning valid stream for ${peerId}`);
      return stream;
    } else if (stream && !stream.active) {
      console.warn(`🗑️ Removing inactive stream for ${peerId}`);
      this.remoteStreams.delete(peerId);
      return null;
    }

    console.warn(`⚠️ No valid stream found for ${peerId}`);
    return stream || null;
  };

  // 현재 방 ID 가져오기
  private getCurrentRoomId(): string {
    const path = window.location.pathname;
    const matches = path.match(/\/groupchat\/([^\/\?#]+)/);
    const roomId = matches ? decodeURIComponent(matches[1]) : "";

    if (!roomId && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const roomIdParam = urlParams.get("roomId");
      if (roomIdParam) {
        return roomIdParam;
      }
    }

    return roomId || "test";
  }

  // 🆕 화면 공유 시작 (MediaTrackManager 활용)
  public async startScreenShare(roomId: string, peerId: string, peerName: string): Promise<void> {
    const actualRoomId = roomId || this.getCurrentRoomId();
    console.log(
      `🚀 Starting screen share - roomId: "${actualRoomId}", peerId: "${peerId}", peerName: "${peerName}"`
    );

    if (!this.dispatch) {
      throw new Error("ScreenShareManager not initialized");
    }

    // 🔒 중복 시작 방지
    if (this.startingScreenShare) {
      console.warn("⚠️ Screen share start already in progress, ignoring duplicate request");
      return;
    }

    // 🔒 중복 화면 공유 방지 (정확한 peerId 관리)
    const screenSharePeerId = `${peerId}_screen`;
    const existingScreenTrack = mediaTrackManager.getLocalScreenTrack(screenSharePeerId);
    if (existingScreenTrack) {
      console.warn(`⚠️ Screen share already active for ${screenSharePeerId}, stopping previous one...`);
      console.log(`🔍 Existing screen track:`, {
        trackId: existingScreenTrack.trackId,
        peerId: existingScreenTrack.peerId,
        trackType: existingScreenTrack.trackType,
        enabled: existingScreenTrack.track.enabled,
        readyState: existingScreenTrack.track.readyState
      });
      // 정확한 screenPeerId로 중지 요청
      await this.stopScreenShare(actualRoomId, screenSharePeerId);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 기존 화면 공유만 정리 (MediaTrackManager를 통해 안전하게 처리)
    // localStream을 직접 건드리지 않고 MediaTrackManager를 통해 화면 공유 트랙만 제거

    try {
      this.startingScreenShare = true; // 🔒 시작 플래그 설정
      this.dispatch(startScreenShareRequest());
      console.log(`🚀 Starting screen share for ${peerName} (${peerId})`);

      // 화면 캡처 - 부드러운 프레임을 위한 최적화된 설정
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280, max: 1920 }, // 720p(1280x720)를 우선 시도하고, 최대 1080p(1920x1080)로 제한
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      } as any);

      this.localStream = stream;
      const videoTrack = stream.getVideoTracks()[0];

      console.log("📹 Local screen stream created:", {
        streamId: stream.id,
        trackId: videoTrack.id,
      });

      // 화면 공유가 사용자에 의해 중지될 때 처리
      videoTrack.onended = () => {
        console.log("🔚 Screen share track ended by user");
        
        // 즉시 종료되는 것을 방지하기 위해 짧은 지연 후 확인
        setTimeout(() => {
          if (!this.stoppingScreenShare && videoTrack.readyState === 'ended') {
            console.log("🛑 Confirmed track ended - initiating cleanup");
            // 올바른 screenSharePeerId 사용
            this.stopScreenShare(actualRoomId, screenSharePeerId);
          } else {
            console.log("🔄 Screen share already stopping or track recovered, ignoring ended event");
          }
        }, 100); // 100ms 지연
      };

      // 🆕 MediaTrackManager를 통해 Producer 생성 - 화면 공유 전용 peerId 사용 (이미 위에서 선언됨)
      const trackId = await mediaTrackManager.addScreenShareTrack(
        videoTrack,
        screenSharePeerId,
        `${peerName}_screen`
      );

      console.log("🖥️ Screen share track created:", {
        trackId,
        peerId,
        streamId: stream.id,
      });

      // Redux 상태 업데이트
      const screenShare = {
        id: trackId,
        producerId: trackId, // trackId가 곧 producerId 역할
        peerId,
        peerName,
        isActive: true,
        startedAt: Date.now(),
      };

      this.dispatch(startScreenShareSuccess(screenShare));

      console.log("✅ Screen share started successfully", {
        trackId,
        peerId,
        streamId: stream.id,
      });
      
      this.startingScreenShare = false; // 🔓 성공 시 플래그 해제
    } catch (error) {
      console.error("❌ Screen share failed:", error);
      this.startingScreenShare = false; // 🔓 실패 시 플래그 해제
      
      this.dispatch(
        startScreenShareFailure(error instanceof Error ? error.message : "Unknown error")
      );

      // 실패 시 정리 (화면 공유 트랙만 안전하게 정리)
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          console.log(`🛑 Stopping failed screen track: ${track.id}`);
          track.stop();
        });
        this.localStream = null;
      }
      throw error;
    }
  }

  // 🆕 화면 공유 중지 (MediaTrackManager 활용)
  // peerId는 원본 peerId 또는 이미 "_screen" 접미사가 붙은 screenPeerId 모두 받아서 처리
  public async stopScreenShare(roomId: string, peerId: string): Promise<void> {
    if (!this.dispatch) {
      throw new Error("ScreenShareManager not initialized");
    }

    // 중복 종료 방지
    if (this.stoppingScreenShare) {
      console.log(`⚠️ Screen share is already being stopped for ${peerId}`);
      return;
    }

    try {
      this.stoppingScreenShare = true;
      this.dispatch(stopScreenShareRequest());
      
      // 🔍 peerId 정규화: "_screen" 접미사가 없으면 추가, 있으면 그대로 사용
      const screenSharePeerId = peerId.endsWith('_screen') ? peerId : `${peerId}_screen`;
      const originalPeerId = peerId.endsWith('_screen') ? peerId.replace('_screen', '') : peerId;
      
      console.log(`🛑 Stopping screen share:`, {
        inputPeerId: peerId,
        screenSharePeerId,
        originalPeerId
      });

      // 🆕 서버에 화면 공유 종료 알림 먼저 처리 (producer가 살아있을 때)
      const screenTrack = mediaTrackManager.getLocalScreenTrack(screenSharePeerId);

      if (screenTrack?.producer) {
        this.dispatch(stopScreenShareSuccess());
        try {
          await mediasoupManager.stopProduction(screenTrack.producer.id);
          console.log(`📤 Screen share production stopped:`, {
            roomId,
            peerId,
            producerId: screenTrack.producer.id,
          });
        } catch (error) {
          console.warn(`⚠️ Failed to stop screen share production:`, error);
          // 서버 통신 실패해도 로컬 정리는 계속 진행
        }
      }

      // 🔄 이후 로컬 정리 진행
      console.log(`🧹 Starting local cleanup for screen share (${screenSharePeerId})`);
      
      // 🔍 정리 전 상태 확인
      console.log(`🔍 Pre-cleanup track state:`);
      mediaTrackManager.debugPrintAllTracks();

      // 1. MediaTrackManager를 통해 트랙 제거
      mediaTrackManager.removeLocalTrackByType(screenSharePeerId, "screen");
      
      // 🔍 정리 후 상태 확인
      console.log(`🔍 Post-cleanup track state:`);
      mediaTrackManager.debugPrintAllTracks();

      // 2. 화면 공유 스트림만 안전하게 정리 (카메라 트랙 완전 보호)
      if (this.localStream) {
        console.log(`🧹 Safely cleaning screen share stream: ${this.localStream.id}`);
        const tracks = this.localStream.getTracks();
        tracks.forEach((track) => {
          console.log(`🛑 Stopping screen share track: ${track.id} (${track.label})`);
          track.stop();
        });
        this.localStream = null;
        console.log(`✅ Screen share stream cleaned up, camera tracks preserved`);
      }

      console.log(`✅ Local cleanup completed for screen share (${screenSharePeerId})`);

      this.dispatch(stopScreenShareSuccess());
      console.log("✅ Screen share stopped successfully");
    } catch (error) {
      console.error("❌ Stop screen share failed:", error);
      this.dispatch(
        stopScreenShareFailure(error instanceof Error ? error.message : "Unknown error")
      );
      throw error;
    } finally {
      // 성공/실패 관계없이 플래그 해제
      this.stoppingScreenShare = false;
    }
  }

  // 🆕 원격 화면 공유 소비 (MediaTrackManager 활용)
  public async consumeScreenShare(
    roomId: string,
    producerId: string,
    producerPeerId: string,
    producerPeerName: string
  ): Promise<void> {
    if (!this.dispatch || !this.device) {
      throw new Error("ScreenShareManager not initialized");
    }

    try {
      console.log(
        `🔍 Consuming screen share from ${producerPeerName} (${producerPeerId}), producerId: ${producerId}`
      );

      // 🖥️ 화면 공유는 중복 체크 우회 - mediaTrackManager에서 이미 처리됨
      console.log(`🖥️ Screen share consumption - duplicate check bypassed for producer ${producerId}`);
      
      // 기존 정리 타이머만 취소
      this.cancelStreamCleanup(producerPeerId);

      // 🆕 MediaTrackManager를 통해 Consumer 생성
      const trackId = await mediaTrackManager.consumeAndAddRemoteTrack(
        producerId,
        producerPeerId,
        "video",
        this.device.rtpCapabilities,
        "screen" // trackType
      );

      // 🆕 MediaTrackManager에서 트랙 가져오기
      const track = mediaTrackManager.getRemoteTrack(producerPeerId, "video", "screen");
      if (!track) {
        throw new Error("Failed to get screen share track from MediaTrackManager");
      }

      // 스트림 생성
      const stream = new MediaStream([track]);
      this.remoteStreams.set(producerPeerId, stream);

      console.log("📺 Remote screen stream created:", {
        streamId: stream.id,
        mediaTrackId: trackId, // MediaTrackManager에서 생성한 trackId
        actualTrackId: track.id, // 실제 MediaStreamTrack ID  
        trackReadyState: track.readyState,
        streamActive: stream.active,
        trackCount: stream.getTracks().length,
      });

      // 스트림 종료 감지 및 자동 정리
      track.onended = () => {
        console.log(`📺 Remote screen track ended for ${producerPeerId}`);
        this.scheduleStreamCleanup(producerPeerId, producerId);
      };

      // Redux 상태 업데이트
      const screenShare = {
        id: producerId,
        producerId,
        peerId: producerPeerId,
        peerName: producerPeerName,
        isActive: true,
        startedAt: Date.now(),
      };

      this.dispatch(addRemoteScreenShare(screenShare));

      console.log(`✅ Screen share consumption successful: ${producerPeerId}`, {
        producerId,
        trackId,
        streamId: stream.id,
      });
    } catch (error) {
      console.error(`❌ Screen share consumption failed: ${producerPeerId}`, error);
      // 간단한 정리 후 에러 전파
      await this.cleanupFailedScreenShare(producerPeerId);
      throw error;
    }
  }

  // 🆕 원격 화면 공유 제거 (MediaTrackManager 활용)
  public removeRemoteScreenShare(producerId: string, producerPeerId: string): void {
    if (!this.dispatch) return;

    try {
      console.log(`🗑️ Removing remote screen share: ${producerPeerId}, producerId: ${producerId}`);

      // 정리 타이머 취소
      this.cancelStreamCleanup(producerPeerId);

      // 🆕 MediaTrackManager를 통해 트랙 제거
      mediaTrackManager.removeRemoteTrackByType(producerPeerId, "screen");

      // 스트림 정리
      const stream = this.remoteStreams.get(producerPeerId);
      if (stream) {
        const activeTracks = stream.getTracks().filter((track) => track.readyState === "live");
        activeTracks.forEach((track) => track.stop());

        this.remoteStreams.delete(producerPeerId);
        console.log(
          `🗑️ Stream removed for peerId: ${producerPeerId} (stopped ${activeTracks.length} tracks)`
        );
      } else {
        console.log(`⚠️ Stream not found for peerId: ${producerPeerId}`);
      }

      // Redux 상태 업데이트
      this.dispatch(removeRemoteScreenShare(producerPeerId));

      console.log(`✅ Remote screen share removed: ${producerPeerId}`);
      console.log(`📺 Remaining remote streams:`, Array.from(this.remoteStreams.keys()));
    } catch (error) {
      console.error(`❌ Remove remote screen share failed: ${producerPeerId}`, error);
    }
  }

  // 사용자 피드백 통합
  private notifyScreenShareStart(peerId: string, producerId: string): void {
    userFeedbackManager.notifyOperationStart(producerId, 'screen share');
  }

  private notifyScreenShareSuccess(peerId: string, producerId: string): void {
    userFeedbackManager.notifyOperationSuccess(producerId, 'screen share');
  }

  private notifyScreenShareFailed(peerId: string, producerId: string, error: any): void {
    userFeedbackManager.notifyOperationFailed(producerId, error);
  }

  // 스트림 정리 스케줄링
  private scheduleStreamCleanup(peerId: string, producerId: string): void {
    // 기존 타이머 정리
    const existingTimer = this.streamCleanupTimers.get(peerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 3초 후 정리 (딜레이를 통해 일시적 연결 끊김 처리)
    const timer = window.setTimeout(() => {
      console.log(`⏰ Scheduled cleanup for ${peerId}`);
      this.removeRemoteScreenShare(producerId, peerId);
      this.streamCleanupTimers.delete(peerId);
    }, 3000);

    this.streamCleanupTimers.set(peerId, timer);
  }

  // 즉시 스트림 정리 취소
  private cancelStreamCleanup(peerId: string): void {
    const timer = this.streamCleanupTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.streamCleanupTimers.delete(peerId);
      console.log(`⏹️ Canceled cleanup for ${peerId}`);
    }
  }

  // 화면 공유 전용 중복 검증 로직
  private validateScreenShareDuplicates(
    producerId: string, 
    producerPeerId: string
  ): {
    isDuplicate: boolean;
    reason?: string;
    hasValidStream?: boolean;
  } {
    // 1. Producer ID 기반 중복 체크
    const existingTrackByProducer = mediaTrackManager.getTrackByProducerId(producerId);
    if (existingTrackByProducer) {
      return {
        isDuplicate: true,
        reason: `Screen share consumer already exists for producer ${producerId}`
      };
    }

    // 2. peerId 기반 중복 체크  
    const existingTrack = mediaTrackManager.getRemoteScreenTrack(producerPeerId);
    if (existingTrack) {
      return {
        isDuplicate: true,
        reason: `Screen share consumer already exists for peer ${producerPeerId}`
      };
    }

    // 3. 스트림 레벨 중복 체크
    if (this.remoteStreams.has(producerPeerId)) {
      const existingStream = this.remoteStreams.get(producerPeerId);
      if (existingStream && existingStream.active) {
        return {
          isDuplicate: true,
          reason: `Valid stream already exists for ${producerPeerId}`,
          hasValidStream: true
        };
      } else {
        // 비활성 스트림 정리
        console.log(`🧹 Removing inactive stream for ${producerPeerId}`);
        this.remoteStreams.delete(producerPeerId);
      }
    }

    return { isDuplicate: false };
  }

  // 실패한 화면 공유 정리
  private async cleanupFailedScreenShare(producerPeerId: string): Promise<void> {
    console.log(`🧹 Cleaning up failed screen share for ${producerPeerId}`);
    
    // 스트림 정리
    const stream = this.remoteStreams.get(producerPeerId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.remoteStreams.delete(producerPeerId);
    }
    
    // 정리 타이머 취소
    this.cancelStreamCleanup(producerPeerId);
    
    // MediaTrackManager에서 트랙 정리
    mediaTrackManager.removeRemoteTrackByType(producerPeerId, "screen");
  }

  // 정리
  public cleanup(): void {
    console.log("🧹 Cleaning up screen share resources...");

    // 모든 정리 타이머 취소
    this.streamCleanupTimers.forEach((timer) => clearTimeout(timer));
    this.streamCleanupTimers.clear();

    // 화면 공유 스트림만 안전하게 정리 (카메라 보호)
    if (this.localStream) {
      console.log(`🧹 Cleanup: stopping screen share stream ${this.localStream.id}`);
      this.localStream.getTracks().forEach((track) => {
        console.log(`🛑 Cleanup: stopping track ${track.id} (${track.label})`);
        track.stop();
      });
      this.localStream = null;
    }

    // 원격 스트림 정리
    this.remoteStreams.forEach((stream, peerId) => {
      console.log(`🗑️ Cleaning up remote stream for ${peerId}`);
      stream.getTracks().forEach((track) => track.stop());
    });
    this.remoteStreams.clear();

    // 🆕 MediaTrackManager는 별도로 정리됨 (mediasoupManager.cleanup()에서)
    this.device = null;
    this.dispatch = null;

    // 플래그 초기화
    this.stoppingScreenShare = false;

    console.log("✅ Screen share cleanup completed");
  }
}

export const screenShareManager = new ScreenShareManager();

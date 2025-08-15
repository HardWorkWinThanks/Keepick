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

class ScreenShareManager {
  private dispatch: AppDispatch | null = null;
  private device: Device | null = null;
  
  // 🆕 간소화: MediaStream만 관리, Producer/Consumer는 MediaTrackManager가 담당
  private localStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>(); // peerId -> MediaStream
  
  // 리소스 정리를 위한 타이머
  private streamCleanupTimers = new Map<string, number>();

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
      streamId: stream?.id
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
    const roomId = matches ? decodeURIComponent(matches[1]) : '';
    
    if (!roomId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomIdParam = urlParams.get('roomId');
      if (roomIdParam) {
        return roomIdParam;
      }
    }
    
    return roomId || 'test';
  }

  // 🆕 화면 공유 시작 (MediaTrackManager 활용)
  public async startScreenShare(
    roomId: string,
    peerId: string,
    peerName: string
  ): Promise<void> {
    const actualRoomId = roomId || this.getCurrentRoomId();
    console.log(`🚀 Starting screen share - roomId: "${actualRoomId}", peerId: "${peerId}", peerName: "${peerName}"`);
    
    if (!this.dispatch) {
      throw new Error("ScreenShareManager not initialized");
    }

    // 🔒 중복 화면 공유 방지
    const existingScreenTrack = mediaTrackManager.getLocalScreenTrack(peerId);
    if (existingScreenTrack) {
      console.warn("⚠️ Screen share already active, stopping previous one...");
      await this.stopScreenShare(actualRoomId, peerId);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 기존 로컬 스트림 정리
    if (this.localStream) {
      console.log("🧹 Cleaning up existing local stream...");
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    try {
      this.dispatch(startScreenShareRequest());
      console.log(`🚀 Starting screen share for ${peerName} (${peerId})`);

      // 화면 캡처
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      this.localStream = stream;
      const videoTrack = stream.getVideoTracks()[0];
      
      console.log("📹 Local screen stream created:", {
        streamId: stream.id,
        trackId: videoTrack.id
      });

      // 화면 공유가 사용자에 의해 중지될 때 처리
      videoTrack.onended = () => {
        console.log("Screen share ended by user");
        this.stopScreenShare(actualRoomId, peerId);
      };

      // 🆕 MediaTrackManager를 통해 Producer 생성
      const trackId = await mediaTrackManager.addScreenShareTrack(videoTrack, peerId, peerName);
      
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

    } catch (error) {
      console.error("❌ Screen share failed:", error);
      this.dispatch(
        startScreenShareFailure(
          error instanceof Error ? error.message : "Unknown error"
        )
      );

      // 실패 시 정리
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }
      throw error;
    }
  }

  // 🆕 화면 공유 중지 (MediaTrackManager 활용)
  public async stopScreenShare(roomId: string, peerId: string): Promise<void> {
    if (!this.dispatch) {
      throw new Error("ScreenShareManager not initialized");
    }

    try {
      this.dispatch(stopScreenShareRequest());
      console.log(`🛑 Stopping screen share for ${peerId}`);

      // 🆕 MediaTrackManager를 통해 트랙 제거
      mediaTrackManager.removeLocalTrackByType(peerId, 'screen');

      // 로컬 스트림 정리
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }

      this.dispatch(stopScreenShareSuccess());
      console.log("✅ Screen share stopped successfully");

    } catch (error) {
      console.error("❌ Stop screen share failed:", error);
      this.dispatch(
        stopScreenShareFailure(
          error instanceof Error ? error.message : "Unknown error"
        )
      );
      throw error;
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

      // 🔒 중복 Consumer 생성 방지
      const existingTrack = mediaTrackManager.getRemoteScreenTrack(producerPeerId);
      if (existingTrack) {
        console.log(`⚠️ Screen share consumer already exists for ${producerPeerId}, skipping...`);
        this.cancelStreamCleanup(producerPeerId);
        return;
      }

      // 이미 해당 peerId의 스트림이 존재하는지 확인
      if (this.remoteStreams.has(producerPeerId)) {
        console.log(`⚠️ Stream already exists for ${producerPeerId}, checking validity...`);
        
        const existingStream = this.remoteStreams.get(producerPeerId);
        if (existingStream && existingStream.active) {
          this.cancelStreamCleanup(producerPeerId);
          console.log(`✅ Valid stream exists, reusing for ${producerPeerId}`);
          return;
        } else {
          console.log(`🧹 Removing inactive stream for ${producerPeerId}`);
          this.remoteStreams.delete(producerPeerId);
        }
      }

      // 🆕 MediaTrackManager를 통해 Consumer 생성
      const trackId = await mediaTrackManager.addRemoteTrack(
        producerId,
        producerPeerId,
        'video',
        this.device.rtpCapabilities,
        'screen' // trackType
      );

      // 🆕 MediaTrackManager에서 트랙 가져오기
      const track = mediaTrackManager.getRemoteTrack(producerPeerId, 'video', 'screen');
      if (!track) {
        throw new Error('Failed to get screen share track from MediaTrackManager');
      }

      // 스트림 생성
      const stream = new MediaStream([track]);
      this.remoteStreams.set(producerPeerId, stream);
      
      console.log("📺 Remote screen stream created:", {
        streamId: stream.id,
        trackId: track.id,
        trackReadyState: track.readyState,
        streamActive: stream.active,
        trackCount: stream.getTracks().length
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
      throw error;
    }
  }

  // 🆕 원격 화면 공유 제거 (MediaTrackManager 활용)
  public removeRemoteScreenShare(
    producerId: string,
    producerPeerId: string
  ): void {
    if (!this.dispatch) return;

    try {
      console.log(
        `🗑️ Removing remote screen share: ${producerPeerId}, producerId: ${producerId}`
      );

      // 정리 타이머 취소
      this.cancelStreamCleanup(producerPeerId);

      // 🆕 MediaTrackManager를 통해 트랙 제거
      mediaTrackManager.removeRemoteTrackByType(producerPeerId, 'screen');

      // 스트림 정리
      const stream = this.remoteStreams.get(producerPeerId);
      if (stream) {
        const activeTracks = stream.getTracks().filter(track => track.readyState === 'live');
        activeTracks.forEach((track) => track.stop());
        
        this.remoteStreams.delete(producerPeerId);
        console.log(`🗑️ Stream removed for peerId: ${producerPeerId} (stopped ${activeTracks.length} tracks)`);
      } else {
        console.log(`⚠️ Stream not found for peerId: ${producerPeerId}`);
      }

      // Redux 상태 업데이트
      this.dispatch(removeRemoteScreenShare(producerPeerId));

      console.log(`✅ Remote screen share removed: ${producerPeerId}`);
      console.log(
        `📺 Remaining remote streams:`,
        Array.from(this.remoteStreams.keys())
      );
    } catch (error) {
      console.error(
        `❌ Remove remote screen share failed: ${producerPeerId}`,
        error
      );
    }
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

  // 정리
  public cleanup(): void {
    console.log("🧹 Cleaning up screen share resources...");

    // 모든 정리 타이머 취소
    this.streamCleanupTimers.forEach((timer) => clearTimeout(timer));
    this.streamCleanupTimers.clear();

    // 로컬 스트림 정리
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
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

    console.log("✅ Screen share cleanup completed");
  }
}

export const screenShareManager = new ScreenShareManager();
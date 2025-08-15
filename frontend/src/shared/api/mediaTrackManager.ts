// src/shared/api/mediaTrackManager.ts
import { Producer, Consumer, Transport, RtpCapabilities } from "mediasoup-client/types";
import { AppDispatch } from "@/shared/config/store";
import {
  ProducerAppData,
  createProducerAppData,
  isScreenShareProducer,
  ConsumerCreatedData,
} from "@/shared/types/webrtc.types";
import {
  setLocalTrack,
  updateLocalTrack,
  removeLocalTrack,
  setRemoteTrack,
  updateRemoteTrack,
  removeRemoteTrack,
} from "@/entities/video-conference/media/model/mediaSlice";
import { webrtcHandler } from "./socket";

export interface TrackInfo {
  trackId: string;
  track: MediaStreamTrack;
  producer?: Producer;
  consumer?: Consumer;
  peerId: string;
  kind: "audio" | "video";
  trackType: "camera" | "screen"; // 🆕 트랙 타입 추가
}

class MediaTrackManager {
  private dispatch: AppDispatch | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private currentRoomId: string = "";

  // 트랙 저장소 (Redux와 분리)
  private localTracks = new Map<string, TrackInfo>(); // trackId -> TrackInfo
  private remoteTracks = new Map<string, TrackInfo>(); // trackId -> TrackInfo
  private producerMap = new Map<string, string>(); // producerId -> trackId
  private consumerMap = new Map<string, string>(); // consumerId -> trackId
  private remoteProducerMap = new Map<string, string>(); // remote producerId -> trackId

  public init(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  public setTransports(sendTransport: Transport, recvTransport: Transport, roomId?: string) {
    this.sendTransport = sendTransport;
    this.recvTransport = recvTransport;
    if (roomId) {
      this.currentRoomId = roomId;
    }
  }

  // 🆕 화면 공유 트랙 생성 (통합 메서드)
  async addLocalTrack(
    track: MediaStreamTrack,
    peerId: string,
    trackType: "camera" | "screen" = "camera",
    peerName?: string
  ): Promise<string> {
    if (!this.sendTransport || !this.dispatch) {
      throw new Error("Transport or dispatch not initialized");
    }

    const trackId = `${trackType}_${track.kind}_${peerId}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      // 🎯 트랙 ID 중복 방지를 위한 고유 ID 생성
      let processedTrack = track;

      // 모든 트랙에 고유 ID 보장
      const uniqueTrackId = `${trackType}_track_${peerId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 트랙 복제 및 ID 설정
      const clonedTrack = track.clone();
      Object.defineProperty(clonedTrack, "id", {
        value: uniqueTrackId,
        writable: false,
        configurable: true,
      });

      processedTrack = clonedTrack;
      console.log(`🎯 Created unique track ID for ${track.kind}: ${uniqueTrackId}`);

      // 🆕 Producer 생성 (타입 지정된 appData)
      const appData = createProducerAppData(
        trackType === "screen" ? "screen" : track.kind === "audio" ? "audio" : "camera",
        peerId,
        {
          peerName,
          trackId: processedTrack.id,
          resolution: trackType === "screen" ? { width: 1920, height: 1080 } : undefined,
          frameRate: trackType === "screen" ? 30 : undefined,
        }
      );

      // 🆕 화면 공유를 위한 특별한 인코딩 설정
      const produceOptions: any = {
        track: processedTrack,
        appData,
      };

      // 화면 공유인 경우 더 높은 품질 설정
      if (trackType === "screen") {
        produceOptions.encodings = [
          { 
            maxBitrate: 5000000,  // 5 Mbps
            rid: "high",
            maxFramerate: 30,
            scaleResolutionDownBy: 1
          },
          { 
            maxBitrate: 3000000,  // 3 Mbps  
            rid: "medium", 
            scaleResolutionDownBy: 1.5,
            maxFramerate: 25
          },
          { 
            maxBitrate: 1500000,  // 1.5 Mbps
            rid: "low", 
            scaleResolutionDownBy: 2,
            maxFramerate: 20
          },
        ];
        produceOptions.codecOptions = {
          videoGoogleStartBitrate: 2000,  // 시작 비트레이트 증가
          videoGoogleMaxBitrate: 5000000,  // 최대 비트레이트 설정
          videoGoogleMinBitrate: 500000,   // 최소 비트레이트 설정
        };
      }

      const producer = await this.sendTransport.produce(produceOptions);

      const trackInfo: TrackInfo = {
        trackId,
        track: processedTrack,
        producer,
        peerId,
        kind: processedTrack.kind as "audio" | "video",
        trackType, // 🆕 트랙 타입 저장
      };

      // 로컬 저장
      this.localTracks.set(trackId, trackInfo);
      this.producerMap.set(producer.id, trackId);

      // Redux 상태 업데이트 (카메라 트랙만, 화면 공유 트랙 제외)
      if (trackType === "camera") {
        this.dispatch(
          setLocalTrack({
            kind: processedTrack.kind as "audio" | "video",
            track: {
              trackId,
              producerId: producer.id,
              peerId,
              kind: processedTrack.kind as "audio" | "video",
              enabled: processedTrack.enabled,
              muted: processedTrack.kind === "audio" ? processedTrack.muted : undefined,
            },
          })
        );
        console.log(`🔄 Redux updated for camera ${processedTrack.kind} track:`, trackId);
      } else {
        console.log(`🚫 Skipping Redux update for ${trackType} track:`, trackId);
      }

      console.log(`✅ Local ${trackType} ${processedTrack.kind} track added:`, trackId);

      // 🆕 화면 공유인 경우 특별한 로깅
      if (trackType === "screen") {
        console.log(`🖥️ Screen share producer created:`, {
          producerId: producer.id,
          trackId,
          peerId,
          peerName,
        });
      }

      return trackId;
    } catch (error) {
      console.error(`❌ Failed to add local ${trackType} ${track.kind} track:`, error);
      throw error;
    }
  }

  // 🆕 화면 공유 전용 편의 메서드
  async addScreenShareTrack(
    track: MediaStreamTrack,
    peerId: string,
    peerName: string
  ): Promise<string> {
    return this.addLocalTrack(track, peerId, "screen", peerName);
  }

  // 원격 트랙 Consumer 생성 (기존 로직 유지)
  async addRemoteTrack(
    producerId: string,
    socketId: string,
    kind: "audio" | "video",
    rtpCapabilities: RtpCapabilities,
    trackType: "camera" | "screen" = "camera"
  ): Promise<string> {
    if (!this.recvTransport || !this.dispatch) {
      throw new Error("Transport or dispatch not initialized");
    }

    // 🔒 중복 Consumer 생성 방지 - Producer ID 기반 강력한 체크
    const existingTrackByProducer = this.getTrackByProducerId(producerId);
    if (existingTrackByProducer) {
      console.warn(`⚠️ Consumer already exists for producer ${producerId}, reusing existing track:`, existingTrackByProducer.trackId);
      return existingTrackByProducer.trackId;
    }

    // 🔒 추가 중복 체크 - socketId + kind + trackType 조합
    const existingTrack = this.getRemoteTrack(socketId, kind, trackType);
    if (existingTrack) {
      // 기존 트랙이 있다면 해당 trackId 반환
      for (const [trackId, trackInfo] of this.remoteTracks) {
        if (trackInfo.track === existingTrack) {
          console.warn(`⚠️ Remote ${trackType} ${kind} track already exists for ${socketId}, reusing:`, trackId);
          return trackId;
        }
      }
    }

    const trackId = `${trackType}_remote_${socketId}_${kind}_${Date.now()}`;

    try {
      console.log(`🔍 Creating new consumer for producer ${producerId} (${trackType} ${kind})`);
      
      // Consumer 생성 (socketApi를 통해 서버와 협상)
      const consumerData = await this.createConsumer(producerId, rtpCapabilities);
      const consumer = await this.recvTransport.consume({
        id: consumerData.id,
        producerId: consumerData.producerId,
        kind: consumerData.kind,
        rtpParameters: consumerData.rtpParameters,
      });

      const trackInfo: TrackInfo = {
        trackId,
        track: consumer.track,
        consumer,
        peerId: socketId,
        kind,
        trackType, // 🆕 원격 트랙도 타입 저장
      };

      // 원격 저장
      this.remoteTracks.set(trackId, trackInfo);
      this.consumerMap.set(consumer.id, trackId);
      this.remoteProducerMap.set(producerId, trackId);

      // Redux 상태 업데이트
      this.dispatch(
        setRemoteTrack({
          socketId,
          kind,
          track: {
            trackId,
            consumerId: consumer.id,
            producerId,
            peerId: socketId,
            kind,
            enabled: !consumer.paused,
            // trackType는 MediaTrackState에 없으므로 제거
          },
        })
      );

      console.log(`✅ Remote ${trackType} ${kind} track added for ${socketId}:`, trackId);

      // 🆕 화면 공유인 경우 특별한 로깅
      if (trackType === "screen") {
        console.log(`🖥️ Screen share consumer created:`, {
          consumerId: consumer.id,
          producerId,
          trackId,
          socketId,
        });
      }

      return trackId;
    } catch (error) {
      console.error(`❌ Failed to add remote ${trackType} ${kind} track:`, error);
      throw error;
    }
  }

  // 🆕 카메라 트랙 전용 메서드들
  getLocalCameraTrack(kind: "audio" | "video"): MediaStreamTrack | null {
    for (const trackInfo of this.localTracks.values()) {
      if (trackInfo.peerId === "local" && trackInfo.trackType === "camera" && trackInfo.kind === kind) {
        return trackInfo.track;
      }
    }
    return null;
  }

  getLocalCameraTrackInfo(kind: "audio" | "video"): TrackInfo | null {
    for (const trackInfo of this.localTracks.values()) {
      if (trackInfo.peerId === "local" && trackInfo.trackType === "camera" && trackInfo.kind === kind) {
        return trackInfo;
      }
    }
    return null;
  }

  // 🆕 화면 공유 트랙 찾기
  getLocalScreenTrack(peerId: string): TrackInfo | null {
    for (const trackInfo of this.localTracks.values()) {
      if (trackInfo.peerId === peerId && trackInfo.trackType === "screen") {
        return trackInfo;
      }
    }
    return null;
  }

  getLocalScreenShareTrack(): MediaStreamTrack | null {
    for (const trackInfo of this.localTracks.values()) {
      if (trackInfo.trackType === "screen" && trackInfo.kind === "video") {
        return trackInfo.track;
      }
    }
    return null;
  }

  getRemoteScreenTrack(socketId: string): TrackInfo | null {
    for (const trackInfo of this.remoteTracks.values()) {
      if (trackInfo.peerId === socketId && trackInfo.trackType === "screen") {
        return trackInfo;
      }
    }
    return null;
  }

  // 🆕 트랙 타입별 제거
  removeLocalTrackByType(peerId: string, trackType: "camera" | "screen"): void {
    const tracksToRemove = Array.from(this.localTracks.values()).filter(
      (track) => track.peerId === peerId && track.trackType === trackType
    );

    tracksToRemove.forEach((track) => {
      console.log(`🗑️ Removing ${trackType} track for ${peerId}:`, track.trackId);
      this.removeLocalTrack(track.trackId);
    });

    if (tracksToRemove.length === 0) {
      console.warn(`⚠️ No ${trackType} tracks found for peerId: ${peerId}`);
    }
  }

  removeRemoteTrackByType(socketId: string, trackType: "camera" | "screen"): void {
    const trackToRemove = Array.from(this.remoteTracks.values()).find(
      (track) => track.peerId === socketId && track.trackType === trackType
    );

    if (trackToRemove) {
      this.removeRemoteTrack(trackToRemove.trackId, socketId);
    }
  }

  // 기존 메서드들... (변경 없음)
  enableLocalTrack(trackId: string, enabled: boolean): void {
    const trackInfo = this.localTracks.get(trackId);
    if (!trackInfo || !this.dispatch) return;

    trackInfo.track.enabled = enabled;

    // Redux 상태 업데이트 (카메라 트랙만)
    if (trackInfo.trackType === "camera") {
      this.dispatch(
        updateLocalTrack({
          kind: trackInfo.kind,
          updates: { enabled },
        })
      );
      console.log(`🔄 Redux updated camera ${trackInfo.kind} track enabled: ${enabled}`);
    } else {
      console.log(`🚫 Skipping Redux update for ${trackInfo.trackType} track enabled: ${enabled}`);
    }

    console.log(
      `🔄 Local ${trackInfo.trackType} ${trackInfo.kind} track ${enabled ? "enabled" : "disabled"}`
    );
  }

  toggleLocalTrack(trackId: string): void {
    const trackInfo = this.localTracks.get(trackId);
    if (trackInfo) {
      this.enableLocalTrack(trackId, !trackInfo.track.enabled);
    }
  }

  async replaceLocalTrack(trackId: string, newTrack: MediaStreamTrack): Promise<void> {
    const trackInfo = this.localTracks.get(trackId);
    if (!trackInfo?.producer || !this.dispatch) {
      throw new Error("Track or producer not found");
    }

    try {
      await trackInfo.producer.replaceTrack({ track: newTrack });
      trackInfo.track.stop();
      trackInfo.track = newTrack;

      // Redux 상태 업데이트 (카메라 트랙만)
      if (trackInfo.trackType === "camera") {
        this.dispatch(
          updateLocalTrack({
            kind: trackInfo.kind,
            updates: {
              enabled: newTrack.enabled,
              muted: newTrack.kind === "audio" ? newTrack.muted : undefined,
            },
          })
        );
        console.log(`🔄 Redux updated camera ${trackInfo.kind} track after replacement`);
      } else {
        console.log(`🚫 Skipping Redux update for ${trackInfo.trackType} track replacement`);
      }

      console.log(`🔄 Local ${trackInfo.trackType} ${trackInfo.kind} track replaced:`, trackId);
    } catch (error) {
      console.error(`❌ Failed to replace track:`, error);
      throw error;
    }
  }

  removeLocalTrack(trackId: string): void {
    const trackInfo = this.localTracks.get(trackId);
    if (!trackInfo || !this.dispatch) return;

    // Producer 정리
    if (trackInfo.producer) {
      trackInfo.producer.close();
      this.producerMap.delete(trackInfo.producer.id);
    }

    // 트랙 정리
    trackInfo.track.stop();
    this.localTracks.delete(trackId);

    // Redux 상태 업데이트 (카메라 트랙만, 화면 공유 트랙 제외)
    if (trackInfo.trackType === "camera") {
      this.dispatch(removeLocalTrack(trackInfo.kind));
      console.log(`🔄 Redux removed camera ${trackInfo.kind} track:`, trackId);
    } else {
      console.log(`🚫 Skipping Redux removal for ${trackInfo.trackType} track:`, trackId);
    }

    console.log(`🗑️ Local ${trackInfo.trackType} ${trackInfo.kind} track removed:`, trackId);
  }

  removeRemoteTrack(trackId: string, socketId: string): void {
    const trackInfo = this.remoteTracks.get(trackId);
    if (!trackInfo || !this.dispatch) return;

    // Consumer 정리
    if (trackInfo.consumer) {
      trackInfo.consumer.close();
      this.consumerMap.delete(trackInfo.consumer.id);

      const producerId = trackInfo.consumer.producerId;
      this.remoteProducerMap.delete(producerId);
    }

    this.remoteTracks.delete(trackId);

    // Redux 상태 업데이트
    this.dispatch(removeRemoteTrack({ socketId, kind: trackInfo.kind }));

    console.log(`🗑️ Remote ${trackInfo.trackType} ${trackInfo.kind} track removed:`, trackId);
  }

  // 트랙 가져오기 (컴포넌트에서 사용)
  getLocalTrack(
    kind: "audio" | "video",
    trackType: "camera" | "screen" = "camera",
    peerId: string = "local"  // 🆕 기본값을 "local"로 설정
  ): MediaStreamTrack | null {
    for (const trackInfo of this.localTracks.values()) {
      // peerId는 이제 필수값 (기본값 "local")
      if (trackInfo.peerId !== peerId) {
        continue;
      }
      
      if (trackInfo.kind === kind && trackInfo.trackType === trackType) {
        console.log(`🎯 Found ${trackType} ${kind} track for peerId: ${peerId}`, trackInfo.trackId);
        return trackInfo.track;
      }
    }
    
    console.warn(`⚠️ No ${trackType} ${kind} track found for peerId: ${peerId}`);
    return null;
  }

  getRemoteTrack(
    socketId: string,
    kind: "audio" | "video",
    trackType: "camera" | "screen" = "camera"
  ): MediaStreamTrack | null {
    for (const trackInfo of this.remoteTracks.values()) {
      if (
        trackInfo.peerId === socketId &&
        trackInfo.kind === kind &&
        trackInfo.trackType === trackType
      ) {
        return trackInfo.track;
      }
    }
    return null;
  }

  // Producer ID로 트랙 찾기 (로컬 및 원격 모두 검색)
  getTrackByProducerId(producerId: string): TrackInfo | null {
    const localTrackId = this.producerMap.get(producerId);
    if (localTrackId) {
      const localTrack = this.localTracks.get(localTrackId);
      if (localTrack) return localTrack;
    }

    const remoteTrackId = this.remoteProducerMap.get(producerId);
    if (remoteTrackId) {
      const remoteTrack = this.remoteTracks.get(remoteTrackId);
      if (remoteTrack) return remoteTrack;
    }

    return null;
  }

  getTrackById(trackId: string): TrackInfo | null {
    return this.localTracks.get(trackId) || this.remoteTracks.get(trackId) || null;
  }

  hasRemoteProducer(producerId: string, socketId: string, kind: "audio" | "video", trackType?: "camera" | "screen"): boolean {
    // Producer ID로 먼저 체크 (가장 정확한 방법)
    const trackByProducerId = this.getTrackByProducerId(producerId);
    if (trackByProducerId) {
      console.log(`🔍 Found existing track for producer ${producerId}:`, trackByProducerId.trackId);
      return true;
    }

    // Consumer가 있는지 체크 (원격 트랙의 경우)
    const remoteTrackId = this.remoteProducerMap.get(producerId);
    if (remoteTrackId && this.remoteTracks.has(remoteTrackId)) {
      console.log(`🔍 Found existing consumer for producer ${producerId}:`, remoteTrackId);
      return true;
    }

    // 기존 로직 (socketId + kind + trackType 기반) - 최종 fallback
    for (const trackInfo of this.remoteTracks.values()) {
      const matchesSocket = trackInfo.peerId === socketId;
      const matchesKind = trackInfo.kind === kind;
      const matchesTrackType = !trackType || trackInfo.trackType === trackType;
      
      if (matchesSocket && matchesKind && matchesTrackType) {
        console.log(`🔍 Found existing ${trackInfo.trackType} ${kind} track for ${socketId}:`, trackInfo.trackId);
        return true;
      }
    }
    return false;
  }

  getAllRemoteTracks(): Map<string, TrackInfo> {
    return this.remoteTracks;
  }

  // 전체 정리
  cleanup(): void {
    console.log("🧹 Cleaning up all tracks...");

    // 로컬 트랙 정리
    this.localTracks.forEach((trackInfo) => {
      trackInfo.track.stop();
      trackInfo.producer?.close();
    });
    this.localTracks.clear();

    // 원격 트랙 정리
    this.remoteTracks.forEach((trackInfo) => {
      trackInfo.consumer?.close();
    });
    this.remoteTracks.clear();

    // 맵 정리
    this.producerMap.clear();
    this.consumerMap.clear();
    this.remoteProducerMap.clear();

    console.log("✅ Track cleanup completed");
  }

  // 서버와 Consumer 협상 (기존 socketApi 활용)
  private async createConsumer(
    producerId: string,
    rtpCapabilities: RtpCapabilities
  ): Promise<ConsumerCreatedData> {
    if (!this.recvTransport) {
      throw new Error("Receive transport not available");
    }

    return await webrtcHandler.consume({
      transportId: this.recvTransport.id,
      producerId,
      rtpCapabilities,
      roomId: this.currentRoomId,
    });
  }
}

export const mediaTrackManager = new MediaTrackManager();

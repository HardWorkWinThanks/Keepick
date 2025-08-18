// src/shared/api/mediaTrackManager.ts
import { Producer, Consumer, Transport, RtpCapabilities } from "mediasoup-client/types";
import { AppDispatch } from "@/shared/config/store";
import {
  ProducerAppData,
  createProducerAppData,
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
import { RecoveryManager, RecoveryContext, recoveryManager } from "./managers/RecoveryManager";
import { DuplicateValidator, TrackMaps, duplicateValidator } from "./managers/DuplicateValidator";
import { UserFeedbackManager, userFeedbackManager } from "./managers/UserFeedbackManager";
import { frontendAiProcessor } from "./ai/frontendAiProcessor";
import { AiSystemConfig } from "@/shared/types/ai.types";

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

  // Race condition 방지를 위한 consume 큐 및 락
  private consumeQueue: Promise<string | null> = Promise.resolve(null);
  private processingProducers = new Set<string>(); // 현재 처리 중인 producer들

  // 타임아웃 보호
  private operationTimeouts = new Map<string, NodeJS.Timeout>(); // producerId -> timeout
  private maxOperationTimeout = 30000; // 30초 최대 대기 시간

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
      .substring(2, 11)}`;

    try {
      // 🔍 trackType과 peerId 조합 검증
      if (trackType === "camera" && peerId !== "local") {
        console.error(`❌ Invalid peerId for camera track: ${peerId}. Camera tracks must use peerId="local"`);
        throw new Error(`Invalid peerId "${peerId}" for camera track. Use "local" for camera tracks.`);
      }
      
      if (trackType === "screen" && !peerId.includes("_screen")) {
        console.warn(`⚠️ Screen share peerId "${peerId}" doesn't contain "_screen". This might cause issues.`);
      }
      
      // 🛡️ 화면 공유 트랙 추가 시 카메라 트랙 보호
      if (trackType === "screen") {
        console.log(`🛡️ Adding screen share track (${peerId}) - protecting existing camera tracks`);
        
        // 기존 카메라 트랙들이 영향받지 않도록 확인
        const existingCameraTracks = Array.from(this.localTracks.values())
          .filter(t => t.trackType === "camera");
        
        console.log(`🔍 Current camera tracks count: ${existingCameraTracks.length}`);
        existingCameraTracks.forEach(t => {
          console.log(`  📹 Camera track: ${t.trackId} (${t.kind}, enabled: ${t.track.enabled}, state: ${t.track.readyState})`);
        });
      }
      
      console.log(`✅ TrackType-peerId validation passed:`, { trackType, peerId, kind: track.kind });

      // 🎯 트랙 중복 체크 - 동일한 peerId + kind + trackType 조합 (화면 공유는 예외)
      if (trackType !== "screen") {
        const existingLocalTrack = this.getLocalTrack(
          track.kind as "audio" | "video",
          trackType,
          peerId
        );

        if (existingLocalTrack) {
          // 기존 트랙이 있으면 해당 trackId 찾아서 반환
          for (const [existingTrackId, trackInfo] of this.localTracks) {
            if (trackInfo.track === existingLocalTrack) {
              console.warn(
                `⚠️ Local ${trackType} ${track.kind} track already exists for ${peerId}, reusing:`,
                existingTrackId
              );
              return existingTrackId;
            }
          }
        }
      } else {
        console.log(`🖥️ Creating new screen share track for ${peerId} (no duplicate check)`);
      }

      // 새로운 트랙 생성 - 원본 트랙을 그대로 사용 (복제하지 않음)
      const processedTrack = track;
      console.log(`🎯 Using original track for ${trackType} ${track.kind}: ${track.id}`);

      if (processedTrack.kind === "audio") {
        processedTrack.enabled = false;
        console.log(`[Audio] Audio track starts disabled: ${trackId}`);
      }
      console.log(
        `🎯 Using original track for ${trackType} ${processedTrack.kind}: ${processedTrack.id}`
      );

      // 🆕 Producer 생성 (타입 지정된 appData)
      const appData = createProducerAppData(
        trackType === "screen" ? "screen" : track.kind === "audio" ? "audio" : "camera",
        peerId,
        {
          peerName,
          trackId,
          resolution: trackType === "screen" ? { width: 1920, height: 1080 } : undefined,
          frameRate: trackType === "screen" ? 60 : undefined,
        }
      );

      // 🆕 트랙 타입에 따른 Producer 옵션 생성
      const produceOptions = this.createProduceOptions(processedTrack, trackType, appData);

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
        console.log(`🔄 Updating Redux for camera ${processedTrack.kind} track - ensuring camera state preservation`);
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
        console.log(`✅ Redux updated for camera ${processedTrack.kind} track:`, trackId);
      } else {
        console.log(`🚫 Skipping Redux update for ${trackType} track (preserving camera state):`, trackId);
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

  // 🆕 AI 기능이 포함된 로컬 트랙 추가 (주요 수정)
  public async addLocalTrackWithAI(
    track: MediaStreamTrack,
    peerId: string,
    trackType: "camera" | "screen" = "camera",
    peerName?: string,
    aiConfig?: Partial<AiSystemConfig> // AI 설정을 추가 파라미터로 받음
  ): Promise<string> {
    if (!this.sendTransport || !this.dispatch) {
      throw new Error("Transport or dispatch not initialized");
    }

    // AI 처리 활성화 조건: 비디오 트랙, 카메라 타입, AI 기능 켜짐
    const enableAI = aiConfig?.gesture?.static.enabled || aiConfig?.gesture?.dynamic.enabled || aiConfig?.emotion?.enabled || aiConfig?.beauty?.enabled;

    if (track.kind === "video" && trackType === "camera" && enableAI) {
      console.log('🤖 Applying AI processing to video track.');
      // FrontendAiProcessor에 현재 AI 설정 업데이트 (이모지 오버레이, 뷰티 필터 등)
      frontendAiProcessor.updateConfig(aiConfig || {});
      
      try {
        // AI 처리된 트랙을 받아옴 (이모지 등이 합성된 트랙)
        const processedTrack = await frontendAiProcessor.processVideoTrack(track);
        console.log('✅ AI-processed track received. Proceeding to add local track.');
        // 기존 addLocalTrack을 호출하여 AI 처리된 트랙을 Producer로 등록
        return await this.addLocalTrack(processedTrack, peerId, trackType, peerName);
      } catch (aiProcessingError) {
        console.error('❌ Failed to process video track with AI. Falling back to original track:', aiProcessingError);
        // AI 처리 실패 시, AI 없이 원본 트랙을 사용합니다.
        return await this.addLocalTrack(track, peerId, trackType, peerName);
      }
    } else {
      console.log('🚫 AI processing skipped for this track (not video, not camera, or AI disabled).');
      // AI 처리가 필요 없으면 원본 트랙을 그대로 추가합니다.
      return await this.addLocalTrack(track, peerId, trackType, peerName);
    }
  }

  // 🆕 화면 공유 전용 편의 메서드
  async addScreenShareTrack(
    track: MediaStreamTrack,
    peerId: string,
    peerName: string
  ): Promise<string> {
    console.log(`🖥️ Creating new screen share track for ${peerId}`);
    const trackId = await this.addLocalTrack(track, peerId, "screen", peerName);
    
    // 생성 후 즉시 확인
    const verifyTrack = this.getLocalScreenTrack(peerId);
    if (verifyTrack) {
      console.log(`✅ Screen track verification successful for ${peerId}:`, verifyTrack.trackId);
    } else {
      console.error(`❌ Screen track verification failed for ${peerId} - track not found!`);
    }
    
    return trackId;
  }

  // 원격 트랙 Consumer 생성 - consume 요청의 유일한 진입점 (Race condition 방지)
  public consumeAndAddRemoteTrack(
    producerId: string,
    socketId: string,
    kind: "audio" | "video",
    rtpCapabilities: RtpCapabilities,
    trackType: "camera" | "screen" = "camera"
  ): Promise<string | null> {
    // 사용자에게 처리 시작 알림
    userFeedbackManager.notifyOperationStart(producerId, trackType);

    // 타임아웃 보호 설정
    const timeoutId = setTimeout(() => {
      console.error(
        `⏰ Operation timeout for producer ${producerId} after ${this.maxOperationTimeout}ms`
      );
      userFeedbackManager.notifyOperationTimeout(producerId);
      this.cleanupConsumeOperation(producerId);
    }, this.maxOperationTimeout);

    this.operationTimeouts.set(producerId, timeoutId);

    // 모든 consume 요청을 순차적으로 처리하는 큐에 추가
    this.consumeQueue = this.consumeQueue
      .then(() =>
        this._executeConsumeSequentially(producerId, socketId, kind, rtpCapabilities, trackType)
      )
      .catch((error) => {
        console.error(`❌ Consume queue error for producer ${producerId}:`, error);
        userFeedbackManager.notifyOperationFailed(producerId, error);
        return null;
      })
      .finally(() => {
        // 타임아웃 정리
        const timeout = this.operationTimeouts.get(producerId);
        if (timeout) {
          clearTimeout(timeout);
          this.operationTimeouts.delete(producerId);
        }
      });

    return this.consumeQueue;
  }

  // 순차적 consume 실행 (내부 메서드)
  private async _executeConsumeSequentially(
    producerId: string,
    socketId: string,
    kind: "audio" | "video",
    rtpCapabilities: RtpCapabilities,
    trackType: "camera" | "screen"
  ): Promise<string | null> {
    if (!this.recvTransport || !this.dispatch) {
      throw new Error("Transport or dispatch not initialized");
    }

    // 🚫 중복 체크 완전 제거 - ID 일관성 문제 해결을 위해
    console.log(`🔓 Duplicate check disabled for producer ${producerId} (${trackType} ${kind})`);

    // 🔒 처리 중 상태로 마킹
    this.processingProducers.add(producerId);
    console.log(`🔒 Locked producer ${producerId} for sequential processing`);

    try {
      const trackId = `${trackType}_remote_${socketId}_${kind}_${Date.now()}`;
      console.log(`🔍 Creating new consumer for producer ${producerId} (${trackType} ${kind})`);
      console.log(`🆔 Generated trackId: ${trackId}`);

      // Consumer 생성
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
        trackType,
      };

      console.log(`🆔 TrackInfo created - trackId: ${trackId}, actualTrackId: ${consumer.track.id}`);

      // 원격 저장 (atomic operation)
      this.saveTrackInfo(trackInfo, producerId, consumer.id);

      // Redux 상태 업데이트
      this.updateReduxState(socketId, kind, trackInfo, producerId, consumer.id);

      console.log(`✅ Remote ${trackType} ${kind} track added for ${socketId}:`, trackId);
      userFeedbackManager.notifyOperationSuccess(producerId, trackType);

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

      // 알려진 중복 에러인 경우 무시
      if (this.isKnownDuplicateError(error)) {
        console.warn(`⚠️ Producer ${producerId} seems to be already consumed, ignoring error.`);
        return null;
      }

      // 복구 로직 시작
      if (recoveryManager.shouldRetryError(error, producerId)) {
        console.log(`🔄 Attempting recovery for producer ${producerId}`);
        return await this.executeRecovery(
          producerId,
          socketId,
          kind,
          rtpCapabilities,
          trackType,
          error
        );
      }

      throw error;
    } finally {
      // 🔓 처리 완료 후 락 해제
      this.processingProducers.delete(producerId);
      console.log(`🔓 Unlocked producer ${producerId}`);
    }
  }

  // 🆕 카메라 트랙 전용 메서드들 (화면 공유와 완전 분리)
  getLocalCameraTrack(kind: "audio" | "video"): MediaStreamTrack | null {
    console.log(`🔍 Looking for local camera ${kind} track...`);
    
    const allLocalTracks = Array.from(this.localTracks.values());
    console.log(`📊 Total local tracks: ${allLocalTracks.length}`);
    console.log(`📋 Local tracks breakdown:`, allLocalTracks.map(t => ({
      trackId: t.trackId,
      peerId: t.peerId,
      trackType: t.trackType,
      kind: t.kind,
      enabled: t.track.enabled,
      readyState: t.track.readyState
    })));
    
    for (const trackInfo of this.localTracks.values()) {
      if (
        trackInfo.peerId === "local" &&
        trackInfo.trackType === "camera" &&
        trackInfo.kind === kind
      ) {
        console.log(`🎯 Found local camera ${kind} track: ${trackInfo.trackId}`, {
          enabled: trackInfo.track.enabled,
          readyState: trackInfo.track.readyState,
          hasProducer: !!trackInfo.producer
        });
        return trackInfo.track;
      }
    }
    console.warn(`⚠️ No local camera ${kind} track found among ${allLocalTracks.length} tracks`);
    return null;
  }

  getLocalCameraTrackInfo(kind: "audio" | "video"): TrackInfo | null {
    console.log(`🔍 Looking for local camera ${kind} track info...`);
    
    const allLocalTracks = Array.from(this.localTracks.values());
    const cameraTracksOfKind = allLocalTracks.filter(t => 
      t.peerId === "local" && t.trackType === "camera" && t.kind === kind
    );
    
    console.log(`📊 Found ${cameraTracksOfKind.length} camera ${kind} tracks for "local"`, 
      cameraTracksOfKind.map(t => ({
        trackId: t.trackId,
        peerId: t.peerId,
        trackType: t.trackType,
        enabled: t.track.enabled,
        readyState: t.track.readyState
      }))
    );
    
    // 🔍 중복 카메라 트랙이 있으면 경고
    if (cameraTracksOfKind.length > 1) {
      console.warn(`⚠️ Multiple camera ${kind} tracks found! This should not happen.`);
      // 가장 최신 트랙 반환 (trackId에 timestamp 포함)
      return cameraTracksOfKind.sort((a, b) => 
        b.trackId.localeCompare(a.trackId)
      )[0];
    }
    
    for (const trackInfo of this.localTracks.values()) {
      if (
        trackInfo.peerId === "local" &&
        trackInfo.trackType === "camera" &&
        trackInfo.kind === kind
      ) {
        console.log(`🎯 Found camera ${kind} trackInfo: ${trackInfo.trackId}`);
        return trackInfo;
      }
    }
    
    console.warn(`⚠️ No camera ${kind} trackInfo found for "local"`);
    return null;
  }

  // 🆕 화면 공유 트랙 찾기 (카메라 트랙과 완전 분리)
  getLocalScreenTrack(peerId: string): TrackInfo | null {
    console.log(`🔍 Looking for screen share track with peerId: ${peerId}`);
    
    const allLocalTracks = Array.from(this.localTracks.values());
    const screenTracks = allLocalTracks.filter(t => t.trackType === "screen");
    console.log(`📊 Total screen tracks: ${screenTracks.length}`, screenTracks.map(t => ({
      trackId: t.trackId,
      peerId: t.peerId,
      enabled: t.track.enabled,
      readyState: t.track.readyState
    })));
    
    for (const trackInfo of this.localTracks.values()) {
      if (trackInfo.peerId === peerId && trackInfo.trackType === "screen") {
        console.log(`🖥️ Found screen share track for ${peerId}: ${trackInfo.trackId}`, {
          enabled: trackInfo.track.enabled,
          readyState: trackInfo.track.readyState,
          hasProducer: !!trackInfo.producer
        });
        return trackInfo;
      }
    }
    console.warn(`⚠️ No screen share track found for peerId: ${peerId} among ${screenTracks.length} screen tracks`);
    return null;
  }

  getLocalScreenShareTrack(): MediaStreamTrack | null {
    for (const trackInfo of this.localTracks.values()) {
      if (trackInfo.trackType === "screen" && trackInfo.kind === "video") {
        console.log(`🔍 Found local screen track:`, {
          trackId: trackInfo.trackId,
          peerId: trackInfo.peerId,
          trackType: trackInfo.trackType,
          kind: trackInfo.kind,
          enabled: trackInfo.track.enabled,
          readyState: trackInfo.track.readyState,
        });
        return trackInfo.track;
      }
    }
    console.warn(
      `⚠️ No local screen share track found. Available tracks:`,
      Array.from(this.localTracks.values()).map((t) => ({
        trackId: t.trackId,
        peerId: t.peerId,
        trackType: t.trackType,
        kind: t.kind,
      }))
    );
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

  // 🆕 모든 원격 화면 공유 피어 정보 반환
  getAllRemoteScreenSharePeers(): { socketId: string; peerName: string }[] {
    const screenPeers = new Map<string, string>(); // socketId -> peerName
    
    console.log(`🔍 [getAllRemoteScreenSharePeers] Checking ${this.remoteTracks.size} remote tracks`);
    
    // 원격 트랙에서 화면 공유 트랙을 가진 피어들 찾기
    for (const [trackId, trackInfo] of this.remoteTracks.entries()) {
      console.log(`  - ${trackId}: peerId=${trackInfo.peerId}, trackType=${trackInfo.trackType}, kind=${trackInfo.kind}`);
      
      if (trackInfo.trackType === "screen") {
        // TrackInfo의 추가 정보에서 peerName 추출
        const peerName = (trackInfo as any).peerName || trackInfo.peerId;
        screenPeers.set(trackInfo.peerId, peerName);
        console.log(`  ✅ Found screen track for ${trackInfo.peerId}`);
      }
    }
    
    const result = Array.from(screenPeers.entries()).map(([socketId, peerName]) => ({
      socketId,
      peerName
    }));
    
    console.log(`🔍 [getAllRemoteScreenSharePeers] Found ${result.length} screen share peers:`, result);
    return result;
  }

  // 🆕 트랙 타입별 안전한 제거 (카메라/화면 공유 분리)
  removeLocalTrackByType(peerId: string, trackType: "camera" | "screen"): void {
    // 🛡️ 화면 공유 트랙 제거 시 카메라 트랙 보호 확인
    if (trackType === "screen") {
      const cameraTracks = Array.from(this.localTracks.values()).filter(t => t.trackType === "camera");
      console.log(`🛡️ Removing screen tracks for ${peerId} - protecting ${cameraTracks.length} camera tracks`);
      cameraTracks.forEach(t => {
        console.log(`  📹 Protected camera track: ${t.trackId} (${t.kind}, state: ${t.track.readyState})`);
      });
    }

    const tracksToRemove = Array.from(this.localTracks.values()).filter(
      (track) => track.peerId === peerId && track.trackType === trackType
    );

    if (tracksToRemove.length === 0) {
      console.warn(`⚠️ No ${trackType} tracks found for peerId: ${peerId}`);
      return;
    }

    // 🔍 제거 전 카메라 트랙 상태 기록
    const cameraTracksBefore = Array.from(this.localTracks.values()).filter(t => t.trackType === "camera");
    console.log(`🔍 Camera tracks before ${trackType} removal: ${cameraTracksBefore.length}`);

    tracksToRemove.forEach((track) => {
      // 🛡️ 실수로 카메라 트랙을 제거하려 하는지 이중 확인
      if (trackType === "screen" && track.trackType !== "screen") {
        console.error(`❌ PROTECTION: Attempted to remove non-screen track as screen track:`, track.trackId);
        return;
      }

      console.log(`🗑️ Safely removing ${trackType} track for ${peerId}:`, {
        trackId: track.trackId,
        trackType: track.trackType,
        kind: track.kind,
        enabled: track.track.enabled,
        readyState: track.track.readyState
      });
      this.removeLocalTrack(track.trackId);
    });

    // 🔍 제거 후 카메라 트랙 상태 확인
    const cameraTracksAfter = Array.from(this.localTracks.values()).filter(t => t.trackType === "camera");
    console.log(`🔍 Camera tracks after ${trackType} removal: ${cameraTracksAfter.length}`);
    
    if (trackType === "screen" && cameraTracksBefore.length !== cameraTracksAfter.length) {
      console.error(`❌ CAMERA TRACK LOSS DETECTED! Before: ${cameraTracksBefore.length}, After: ${cameraTracksAfter.length}`);
    }

    console.log(`✅ Removed ${tracksToRemove.length} ${trackType} track(s) for ${peerId}`);
  }

  removeRemoteTrackByType(socketId: string, trackType: "camera" | "screen"): void {
    const trackToRemove = Array.from(this.remoteTracks.values()).find(
      (track) => track.peerId === socketId && track.trackType === trackType
    );

    if (trackToRemove) {
      this.removeRemoteTrack(trackToRemove.trackId, socketId);
    }
  }

  // 피어의 모든 원격 트랙 제거
  removeRemoteTracksByPeer(socketId: string): void {
    const tracksToRemove = Array.from(this.remoteTracks.values()).filter(
      (track) => track.peerId === socketId
    );

    tracksToRemove.forEach((track) => {
      console.log(`🗑️ Removing track for peer ${socketId}:`, track.trackId);
      this.removeRemoteTrack(track.trackId, socketId);
    });

    if (tracksToRemove.length === 0) {
      console.warn(`⚠️ No tracks found for peer: ${socketId}`);
    }
  }

  // 🆕 개선된 로컬 트랙 활성화/비활성화 (Producer pause/resume 포함)
  async enableLocalTrack(trackId: string, enabled: boolean): Promise<void> {
    const trackInfo = this.localTracks.get(trackId);
    if (!trackInfo || !this.dispatch) return;

    trackInfo.track.enabled = enabled;

    // Producer pause/resume 처리
    if (trackInfo.producer) {
      try {
        if (enabled) {
          await trackInfo.producer.resume();
          console.log(`▶️ Producer resumed for ${trackInfo.kind} track`);
        } else {
          await trackInfo.producer.pause();
          console.log(`⏸️ Producer paused for ${trackInfo.kind} track`);
        }

        // 서버에 상태 변화 알림
        this.notifyProducerStateChange(trackInfo.producer.id, enabled);
      } catch (error) {
        console.error(`❌ Failed to ${enabled ? "resume" : "pause"} producer:`, error);
      }
    }

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

  // 🆕 서버에 Producer 상태 변화 알림
  private notifyProducerStateChange(producerId: string, enabled: boolean): void {
    const eventName = enabled ? "resume_producer" : "pause_producer";
    console.log(`📡 Notifying server: ${eventName} for producer ${producerId}`);

    webrtcHandler.emitProducerStateChange(producerId, enabled);
  }

  async toggleLocalTrack(trackId: string): Promise<void> {
    const trackInfo = this.localTracks.get(trackId);
    if (trackInfo) {
      await this.enableLocalTrack(trackId, !trackInfo.track.enabled);
    }
  }

async replaceLocalTrack(trackId: string, newTrack: MediaStreamTrack): Promise<void> {
    const oldTrackInfo = this.localTracks.get(trackId);
    if (!oldTrackInfo?.producer || !this.dispatch) {
        throw new Error("Track or producer not found");
    }

    try {
        await oldTrackInfo.producer.replaceTrack({ track: newTrack });

        // 1. 이전 트랙과 관련된 정보 완전 삭제
        this.localTracks.delete(trackId);
        this.producerMap.delete(oldTrackInfo.producer.id);
        if (oldTrackInfo.trackType === 'camera') {
            this.dispatch(removeLocalTrack(oldTrackInfo.kind));
        }

        // 2. 새로운 정보로 새 트랙을 등록 (peerId 안전성 검증 후 등록)
        console.log(`🔄 Replacing track. Old track info:`, { 
            oldTrackId: trackId,
            oldPeerId: oldTrackInfo.peerId, 
            oldTrackType: oldTrackInfo.trackType,
            newTrackId: newTrack.id, 
            newTrackKind: newTrack.kind 
        });
        
        // 🔍 peerId 안전성 검증: 카메라 트랙은 반드시 "local"이어야 함
        let safePeerId = oldTrackInfo.peerId;
        if (oldTrackInfo.trackType === "camera" && oldTrackInfo.peerId !== "local") {
            console.warn(`⚠️ Camera track has wrong peerId: ${oldTrackInfo.peerId}, correcting to "local"`);
            safePeerId = "local";
        }
        
        const newTrackId = `${oldTrackInfo.trackType}_${newTrack.kind}_${safePeerId}_${Date.now()}`;

        const newTrackInfo: TrackInfo = {
            trackId: newTrackId,
            track: newTrack,
            producer: oldTrackInfo.producer, // producer는 동일한 것을 재사용
            peerId: safePeerId, // 검증된 peerId 사용
            kind: newTrack.kind as "audio" | "video",
            trackType: oldTrackInfo.trackType, // trackType은 보존
        };
        
        // 3. 새로운 trackId로 맵과 Redux 상태 업데이트
        this.localTracks.set(newTrackId, newTrackInfo);
        this.producerMap.set(oldTrackInfo.producer.id, newTrackId); // producerId는 같지만 가리키는 trackId를 갱신

        if (newTrackInfo.trackType === 'camera') {
            this.dispatch(
                setLocalTrack({
                    kind: newTrackInfo.kind,
                    track: {
                        trackId: newTrackId, // 새로운 ID
                        producerId: oldTrackInfo.producer.id,
                        peerId: newTrackInfo.peerId,
                        kind: newTrackInfo.kind,
                        enabled: newTrack.enabled,
                        muted: newTrack.kind === "audio" ? newTrack.muted : undefined,
                    },
                })
            );
            console.log(`🔄 Redux state updated with NEW trackId: ${newTrackId}`);
        }

        console.log(`✅ Local ${newTrackInfo.trackType} ${newTrackInfo.kind} track replaced successfully. Old ID: ${trackId}, New ID: ${newTrackId}`);

    } catch (error) {
        console.error(`❌ Failed to replace track:`, error);
        throw error;
    }
}
  removeLocalTrack(trackId: string): void {
    const trackInfo = this.localTracks.get(trackId);
    if (!trackInfo || !this.dispatch) {
      console.warn(`⚠️ Cannot remove track ${trackId}: not found or no dispatch`);
      return;
    }

    console.log(`🗑️ Removing local track: ${trackId}`, {
      trackType: trackInfo.trackType,
      kind: trackInfo.kind,
      peerId: trackInfo.peerId,
      hasProducer: !!trackInfo.producer,
      enabled: trackInfo.track.enabled,
      readyState: trackInfo.track.readyState
    });

    // Producer 정리 및 매핑 동기화
    if (trackInfo.producer) {
      trackInfo.producer.close();
      this.producerMap.delete(trackInfo.producer.id);
      console.log(`🔄 Producer closed and removed from producerMap: ${trackInfo.producer.id}`);
    }

    // MediaStreamTrack 정리
    if (trackInfo.track && trackInfo.track.readyState !== "ended") {
      trackInfo.track.stop();
    }

    // 로컬 트랙 맵에서 제거
    this.localTracks.delete(trackId);

    // Redux 상태 업데이트 (카메라 트랙만, 화면 공유 트랙 제외)
    if (trackInfo.trackType === "camera") {
      console.log(`🔄 Updating Redux state: removing ${trackInfo.kind} track`);
      this.dispatch(removeLocalTrack(trackInfo.kind));
      console.log(`✅ Redux state updated: camera ${trackInfo.kind} track removed`);
    } else {
      console.log(`🚫 Skipping Redux removal for ${trackInfo.trackType} track (non-camera):`, trackId);
    }

    console.log(`✅ Local ${trackInfo.trackType} ${trackInfo.kind} track completely removed:`, trackId);
  }

  removeRemoteTrack(trackId: string, socketId: string): void {
    const trackInfo = this.remoteTracks.get(trackId);
    if (!trackInfo || !this.dispatch) return;

    console.log(`🗑️ Removing remote track: ${trackId}`, {
      trackType: trackInfo.trackType,
      kind: trackInfo.kind,
      peerId: trackInfo.peerId,
      socketId,
      hasConsumer: !!trackInfo.consumer,
    });

    // Consumer 정리 및 매핑 동기화
    if (trackInfo.consumer) {
      const producerId = trackInfo.consumer.producerId;

      trackInfo.consumer.close();
      this.consumerMap.delete(trackInfo.consumer.id);
      this.remoteProducerMap.delete(producerId);

      console.log(`🔄 Consumer closed and mappings removed:`, {
        consumerId: trackInfo.consumer.id,
        producerId,
      });
    }

    // 원격 트랙 맵에서 제거
    this.remoteTracks.delete(trackId);

    // Redux 상태 업데이트 (화면 공유 트랙은 Redux에서 관리하지 않음)
    if (trackInfo.trackType === "camera") {
      this.dispatch(removeRemoteTrack({ socketId, kind: trackInfo.kind }));
      console.log(`🔄 Redux removed camera ${trackInfo.kind} track for ${socketId}`);
    } else {
      console.log(`🚫 Skipping Redux removal for ${trackInfo.trackType} track`);
    }

    console.log(`✅ Remote ${trackInfo.trackType} ${trackInfo.kind} track removed:`, trackId);
  }

  // 트랙 가져오기 (컴포넌트에서 사용)
  getLocalTrack(
    kind: "audio" | "video",
    trackType: "camera" | "screen" = "camera",
    peerId: string = "local" // 🆕 기본값을 "local"로 설정
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

  // 🆕 원격 Producer ID로 트랙 정보 조회
  getRemoteTrackByProducerId(producerId: string): TrackInfo | null {
    for (const trackInfo of this.remoteTracks.values()) {
      if (trackInfo.consumer?.id === producerId || trackInfo.producer?.id === producerId) {
        return trackInfo;
      }
    }
    return null;
  }

  // 🆕 원격 트랙 상태 업데이트
  updateRemoteTrackState(
    socketId: string,
    kind: "audio" | "video",
    updates: { enabled: boolean }
  ): void {
    if (this.dispatch) {
      this.dispatch(
        updateRemoteTrack({
          socketId,
          kind,
          updates,
        })
      );
      console.log(`🔄 Updated remote ${kind} track state for ${socketId}:`, updates);
    }
  }

  // Producer ID로 트랙 제거 (완전한 동기화 보장)
  removeTrackByProducerId(producerId: string): void {
    const trackInfo = this.getTrackByProducerId(producerId);
    if (!trackInfo) {
      console.warn(`⚠️ No track found for producer ${producerId}`);
      return;
    }

    console.log(`🗑️ Removing track by producer ID: ${producerId}`, {
      trackId: trackInfo.trackId,
      trackType: trackInfo.trackType,
      kind: trackInfo.kind,
      peerId: trackInfo.peerId,
      isLocal: this.localTracks.has(trackInfo.trackId),
      isRemote: this.remoteTracks.has(trackInfo.trackId),
    });

    // 로컬 트랙인지 원격 트랙인지 확인하고 적절한 제거 메서드 호출
    if (this.localTracks.has(trackInfo.trackId)) {
      // 로컬 트랙 제거
      this.removeLocalTrack(trackInfo.trackId);
    } else if (this.remoteTracks.has(trackInfo.trackId)) {
      // 원격 트랙 제거
      this.removeRemoteTrack(trackInfo.trackId, trackInfo.peerId);
    } else {
      // 맵에는 있지만 실제 트랙이 없는 경우 - 맵만 정리
      console.warn(
        `⚠️ TrackInfo found but track not in local/remote maps, cleaning up mappings for producer: ${producerId}`
      );
      this.cleanupProducerMappings(producerId, trackInfo);
    }
  }

  // Producer와 관련된 모든 매핑 정리 (동기화 보장)
  private cleanupProducerMappings(producerId: string, trackInfo: TrackInfo): void {
    console.log(`🧹 Cleaning up producer mappings for ${producerId}`);

    // Producer 관련 매핑 정리
    this.producerMap.delete(producerId);
    this.remoteProducerMap.delete(producerId);

    // Consumer가 있는 경우 Consumer 매핑도 정리
    if (trackInfo.consumer) {
      this.consumerMap.delete(trackInfo.consumer.id);
      trackInfo.consumer.close();
    }

    // Producer가 있는 경우 Producer 정리
    if (trackInfo.producer) {
      trackInfo.producer.close();
    }

    // MediaStreamTrack 정리
    if (trackInfo.track && trackInfo.track.readyState !== "ended") {
      trackInfo.track.stop();
    }

    console.log(`✅ Producer mappings cleaned up for ${producerId}`);
  }

  hasRemoteProducer(
    producerId: string,
    socketId: string,
    kind: "audio" | "video",
    trackType?: "camera" | "screen"
  ): boolean {
    // 1단계: Producer ID로 정확한 매핑 체크
    const existingTrack = this.getTrackByProducerId(producerId);
    if (existingTrack) {
      console.log(`🔍 Producer ${producerId} already consumed:`, existingTrack.trackId);
      return true;
    }

    // 2단계: Consumer Map에서 같은 producer ID 체크
    for (const [consumerId, trackId] of this.consumerMap) {
      const trackInfo = this.remoteTracks.get(trackId);
      if (trackInfo?.consumer?.producerId === producerId) {
        console.warn(`⚠️ Producer ${producerId} already has consumer ${consumerId}`);
        return true;
      }
    }

    // 3단계: Remote Producer Map에서 직접 체크
    if (this.remoteProducerMap.has(producerId)) {
      const existingTrackId = this.remoteProducerMap.get(producerId);
      console.warn(`⚠️ Producer ${producerId} already mapped to track ${existingTrackId}`);
      return true;
    }

    // 4단계: 동일한 peer + kind + trackType 조합 체크 (msid 충돌 방지)
    const effectiveTrackType = trackType || "camera";
    for (const trackInfo of this.remoteTracks.values()) {
      if (
        trackInfo.peerId === socketId &&
        trackInfo.kind === kind &&
        trackInfo.trackType === effectiveTrackType
      ) {
        console.warn(
          `⚠️ Blocking duplicate ${effectiveTrackType} ${kind} track for ${socketId} (msid conflict prevention)`
        );
        return true;
      }
    }

    return false;
  }

  getAllRemoteTracks(): Map<string, TrackInfo> {
    return this.remoteTracks;
  }

  // 🆕 디버깅용: 모든 트랙 상태 출력
  debugPrintAllTracks(): void {
    console.log(`🔍 === MEDIA TRACK MANAGER DEBUG INFO ===`);
    console.log(`📊 Local tracks: ${this.localTracks.size}`);
    console.log(`📊 Remote tracks: ${this.remoteTracks.size}`);
    
    console.log(`\n📋 LOCAL TRACKS:`);
    Array.from(this.localTracks.entries()).forEach(([trackId, trackInfo]) => {
      console.log(`  ${trackId}:`, {
        peerId: trackInfo.peerId,
        trackType: trackInfo.trackType,
        kind: trackInfo.kind,
        enabled: trackInfo.track.enabled,
        readyState: trackInfo.track.readyState,
        hasProducer: !!trackInfo.producer,
        producerId: trackInfo.producer?.id
      });
    });
    
    console.log(`\n📋 REMOTE TRACKS:`);
    Array.from(this.remoteTracks.entries()).forEach(([trackId, trackInfo]) => {
      console.log(`  ${trackId}:`, {
        peerId: trackInfo.peerId,
        trackType: trackInfo.trackType,
        kind: trackInfo.kind,
        hasConsumer: !!trackInfo.consumer,
        consumerId: trackInfo.consumer?.id
      });
    });
    
    console.log(`\n📋 PRODUCER MAPPINGS: ${this.producerMap.size}`);
    Array.from(this.producerMap.entries()).forEach(([producerId, trackId]) => {
      console.log(`  ${producerId} -> ${trackId}`);
    });
    
    console.log(`\n📋 CONSUMER MAPPINGS: ${this.consumerMap.size}`);
    Array.from(this.consumerMap.entries()).forEach(([consumerId, trackId]) => {
      console.log(`  ${consumerId} -> ${trackId}`);
    });
    
    console.log(`🔍 === END DEBUG INFO ===\n`);
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

    // Race condition 방지 상태 정리
    this.processingProducers.clear();
    this.consumeQueue = Promise.resolve(null);

    // 복구 로직 상태 정리
    recoveryManager.cleanup();

    // 타임아웃 정리
    this.operationTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.operationTimeouts.clear();

    console.log("✅ Track cleanup completed");
  }

  // 헬퍼 메서드들 (기존 복잡한 로직을 경량화)
  private saveTrackInfo(trackInfo: TrackInfo, producerId: string, consumerId: string): void {
    this.remoteTracks.set(trackInfo.trackId, trackInfo);
    this.consumerMap.set(consumerId, trackInfo.trackId);
    this.remoteProducerMap.set(producerId, trackInfo.trackId);
  }

  private updateReduxState(
    socketId: string,
    kind: "audio" | "video",
    trackInfo: TrackInfo,
    producerId: string,
    consumerId: string
  ): void {
    if (!this.dispatch) return;

    // 🚫 화면공유 트랙은 Redux 미디어 상태에 저장하지 않음
    // 화면공유는 별도 관리 시스템(useRemoteScreenShareTrack)으로 처리됨
    if (trackInfo.trackType === "screen") {
      console.log(`🚫 [MediaTrackManager] Skipping Redux update for screen track ${trackInfo.trackId} - handled separately`);
      return;
    }

    // 카메라 트랙만 Redux에 저장하여 UserVideoCard가 사용
    console.log(`✅ [MediaTrackManager] Updating Redux state for camera track ${trackInfo.trackId}`);
    this.dispatch(
      setRemoteTrack({
        socketId,
        kind,
        track: {
          trackId: trackInfo.trackId,
          consumerId,
          producerId,
          peerId: socketId,
          kind,
          enabled: !trackInfo.consumer?.paused,
        },
      })
    );
  }

  private isKnownDuplicateError(error: any): boolean {
    return (
      error instanceof Error &&
      (error.message.includes("Duplicate a=msid") ||
        error.message.includes("already consumed") ||
        error.message.includes("Consumer already exists"))
    );
  }

  private async executeRecovery(
    producerId: string,
    socketId: string,
    kind: "audio" | "video",
    rtpCapabilities: RtpCapabilities,
    trackType: "camera" | "screen",
    originalError: any
  ): Promise<string | null> {
    const context: RecoveryContext = {
      producerId,
      socketId,
      kind,
      rtpCapabilities,
      trackType,
      recvTransport: this.recvTransport!,
      createConsumer: this.createConsumer.bind(this),
      onTrackCreated: (trackInfo) => {
        this.saveTrackInfo(trackInfo, producerId, trackInfo.consumer!.id);
        this.updateReduxState(socketId, kind, trackInfo, producerId, trackInfo.consumer!.id);
      },
      onStateCleanup: this.cleanupInconsistentState.bind(this),
    };

    try {
      const result = await recoveryManager.attemptRecovery(context, originalError);
      if (result) {
        userFeedbackManager.notifyRecoverySuccess(producerId);
      }
      return result;
    } catch (error) {
      userFeedbackManager.notifyRecoveryFailed(producerId, originalError);
      throw error;
    }
  }

  private async cleanupInconsistentState(producerId: string): Promise<void> {
    console.log(`🧹 Cleaning up inconsistent state for producer ${producerId}`);

    // 기존 중복된 상태 제거
    const existingTrack = this.getTrackByProducerId(producerId);
    if (existingTrack) {
      console.log(`🗑️ Removing existing inconsistent track: ${existingTrack.trackId}`);
      if (existingTrack.consumer) {
        try {
          existingTrack.consumer.close();
        } catch (e) {
          console.warn("Consumer already closed:", e);
        }
      }

      // 맵에서 제거
      this.remoteTracks.delete(existingTrack.trackId);
      if (existingTrack.consumer) {
        this.consumerMap.delete(existingTrack.consumer.id);
      }
      this.remoteProducerMap.delete(producerId);
    }
  }

  private cleanupConsumeOperation(producerId: string): void {
    console.log(`🧹 [Cleanup] Cleaning up failed operation for producer ${producerId}`);

    // 처리 중 상태 제거
    this.processingProducers.delete(producerId);

    // 타임아웃 정리
    const timeout = this.operationTimeouts.get(producerId);
    if (timeout) {
      clearTimeout(timeout);
      this.operationTimeouts.delete(producerId);
    }

    // 불완전한 상태 정리
    this.cleanupInconsistentState(producerId);
  }

  // 🆕 트랙 타입별 Producer 옵션 생성
  private createProduceOptions(
    track: MediaStreamTrack,
    trackType: "camera" | "screen",
    appData: ProducerAppData
  ): {
    track: MediaStreamTrack;
    appData: any;
    encodings?: Array<{
      maxBitrate?: number;
      maxFramerate?: number;
      scaleResolutionDownBy?: number;
    }>;
  } {
    const baseOptions = {
      track,
      appData,
    };

    if (trackType === "screen") {
      // 화면 공유 최적화: 부드러운 프레임을 위한 설정
      return {
        ...baseOptions,
        encodings: [
          {
            maxBitrate: 5000000, // 6 Mbps (안정적인 높은 화질)
            maxFramerate: 30,
            scaleResolutionDownBy: 1, // 원본 해상도 유지
          },
        ],
      };
    } else {
      // 일반 카메라 트랙은 기본 설정 사용
      return baseOptions;
    }
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

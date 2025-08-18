// DuplicateValidator.ts - 중복 체크 로직 전담 클래스
import { TrackInfo } from "../mediaTrackManager";

export interface TrackMaps {
  remoteTracks: Map<string, TrackInfo>;
  consumerMap: Map<string, string>;
  remoteProducerMap: Map<string, string>;
  processingProducers: Set<string>;
}

export class DuplicateValidator {
  
  // Producer가 현재 처리 중인지 체크
  public isProcessing(producerId: string, trackMaps: TrackMaps): boolean {
    if (trackMaps.processingProducers.has(producerId)) {
      console.warn(`[SKIP] Producer ${producerId} is already being processed in queue.`);
      return true;
    }
    return false;
  }

  // Producer에 대한 기존 트랙이 존재하는지 체크
  public hasExistingTrack(producerId: string, trackMaps: TrackMaps): TrackInfo | null {
    // 1. Producer ID로 직접 매핑 체크
    const remoteTrackId = trackMaps.remoteProducerMap.get(producerId);
    if (remoteTrackId) {
      const trackInfo = trackMaps.remoteTracks.get(remoteTrackId);
      if (trackInfo) {
        console.warn(`[SKIP] Producer ${producerId} already has a track (${trackInfo.trackId}).`);
        return trackInfo;
      }
    }

    // 2. Consumer Map에서 같은 producer ID 체크
    for (const [, trackId] of trackMaps.consumerMap) {
      const trackInfo = trackMaps.remoteTracks.get(trackId);
      if (trackInfo?.consumer?.producerId === producerId) {
        console.warn(`[SKIP] Producer ${producerId} already has consumer ${trackInfo.consumer.id}`);
        return trackInfo;
      }
    }

    return null;
  }

  // 동일한 peer + kind + trackType 조합으로 중복 체크
  public hasDuplicateTrackCombination(
    socketId: string,
    kind: "audio" | "video", 
    trackType: "camera" | "screen",
    trackMaps: TrackMaps
  ): TrackInfo | null {
    for (const [trackId, trackInfo] of trackMaps.remoteTracks) {
      if (
        trackInfo.peerId === socketId &&
        trackInfo.kind === kind &&
        trackInfo.trackType === trackType
      ) {
        console.warn(
          `⚠️ Remote ${trackType} ${kind} track already exists for ${socketId}, existing: ${trackId}`
        );
        return trackInfo;
      }
    }
    return null;
  }

  // 포괄적 중복 체크 (모든 체크를 한 번에)
  public validateDuplicates(
    producerId: string,
    socketId: string,
    kind: "audio" | "video",
    trackType: "camera" | "screen",
    trackMaps: TrackMaps
  ): {
    isDuplicate: boolean;
    reason?: string;
    existingTrack?: TrackInfo;
  } {
    // 1. 처리 중인지 체크
    if (this.isProcessing(producerId, trackMaps)) {
      return { 
        isDuplicate: true, 
        reason: 'Already processing'
      };
    }

    // 2. 기존 트랙 존재 체크
    const existingTrack = this.hasExistingTrack(producerId, trackMaps);
    if (existingTrack) {
      return { 
        isDuplicate: true, 
        reason: 'Producer already consumed',
        existingTrack
      };
    }

    // 3. 트랙 조합 중복 체크
    const duplicateTrack = this.hasDuplicateTrackCombination(socketId, kind, trackType, trackMaps);
    if (duplicateTrack) {
      return { 
        isDuplicate: true, 
        reason: 'Track combination already exists',
        existingTrack: duplicateTrack
      };
    }

    return { isDuplicate: false };
  }

  // 상태 불일치 체크 및 정리 (복구용)
  public checkInconsistentState(producerId: string, trackMaps: TrackMaps): boolean {
    let hasInconsistency = false;

    // 1. remoteProducerMap에 있지만 실제 트랙이 없는 경우
    const mappedTrackId = trackMaps.remoteProducerMap.get(producerId);
    if (mappedTrackId && !trackMaps.remoteTracks.has(mappedTrackId)) {
      console.warn(`🔧 Inconsistent state: Producer ${producerId} mapped to non-existent track ${mappedTrackId}`);
      trackMaps.remoteProducerMap.delete(producerId);
      hasInconsistency = true;
    }

    // 2. consumerMap에 있지만 실제 트랙이 없는 경우
    for (const [consumerId, trackId] of trackMaps.consumerMap) {
      const trackInfo = trackMaps.remoteTracks.get(trackId);
      if (!trackInfo) {
        console.warn(`🔧 Inconsistent state: Consumer ${consumerId} mapped to non-existent track ${trackId}`);
        trackMaps.consumerMap.delete(consumerId);
        hasInconsistency = true;
      } else if (trackInfo.consumer?.producerId === producerId) {
        // Producer와 관련된 불일치 발견
        hasInconsistency = true;
      }
    }

    return hasInconsistency;
  }

  // 디버깅용 상태 출력
  public logTrackState(producerId: string, trackMaps: TrackMaps): void {
    console.log(`🔍 [Track State] Producer ${producerId}:`);
    console.log(`  - Processing: ${trackMaps.processingProducers.has(producerId)}`);
    console.log(`  - Remote Producer Map: ${trackMaps.remoteProducerMap.has(producerId)}`);
    console.log(`  - Remote Tracks Count: ${trackMaps.remoteTracks.size}`);
    console.log(`  - Consumer Map Count: ${trackMaps.consumerMap.size}`);
  }
}

export const duplicateValidator = new DuplicateValidator();
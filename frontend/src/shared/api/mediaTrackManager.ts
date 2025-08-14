// src/shared/api/mediaTrackManager.ts
import { Producer, Consumer, Transport, RtpCapabilities } from 'mediasoup-client/types';
import { AppDispatch } from '@/shared/config/store';
import { setLocalTrack, updateLocalTrack, removeLocalTrack, setRemoteTrack, updateRemoteTrack, removeRemoteTrack } from '@/entities/video-conference/media/model/mediaSlice';
import { socketApi } from './socketApi';

export interface TrackInfo {
  trackId: string;
  track: MediaStreamTrack;
  producer?: Producer;
  consumer?: Consumer;
  peerId: string;
  kind: 'audio' | 'video';
}

class MediaTrackManager {
  private dispatch: AppDispatch | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private currentRoomId: string = '';

  // 트랙 저장소 (Redux와 분리)
  private localTracks = new Map<string, TrackInfo>(); // trackId -> TrackInfo
  private remoteTracks = new Map<string, TrackInfo>(); // trackId -> TrackInfo
  private producerMap = new Map<string, string>(); // producerId -> trackId
  private consumerMap = new Map<string, string>(); // consumerId -> trackId

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

  // 로컬 트랙 추가 및 Producer 생성
  async addLocalTrack(track: MediaStreamTrack, peerId: string): Promise<string> {
    if (!this.sendTransport || !this.dispatch) {
      throw new Error('Transport or dispatch not initialized');
    }

    const trackId = `local_${track.kind}_${Date.now()}`;
    
    try {
      // Producer 생성
      const producer = await this.sendTransport.produce({ track });
      
      const trackInfo: TrackInfo = {
        trackId,
        track,
        producer,
        peerId,
        kind: track.kind as 'audio' | 'video',
      };

      // 로컬 저장
      this.localTracks.set(trackId, trackInfo);
      this.producerMap.set(producer.id, trackId);

      // Redux 상태 업데이트 (메타데이터만)
      this.dispatch(setLocalTrack({
        kind: track.kind as 'audio' | 'video',
        track: {
          trackId,
          producerId: producer.id,
          peerId,
          kind: track.kind as 'audio' | 'video',
          enabled: track.enabled,
          muted: track.kind === 'audio' ? track.muted : undefined,
        }
      }));

      console.log(`✅ Local ${track.kind} track added:`, trackId);
      return trackId;

    } catch (error) {
      console.error(`❌ Failed to add local ${track.kind} track:`, error);
      throw error;
    }
  }

  // 원격 트랙 Consumer 생성
  async addRemoteTrack(
    producerId: string, 
    socketId: string, 
    kind: 'audio' | 'video',
    rtpCapabilities: RtpCapabilities
  ): Promise<string> {
    if (!this.recvTransport || !this.dispatch) {
      throw new Error('Transport or dispatch not initialized');
    }

    const trackId = `remote_${socketId}_${kind}_${Date.now()}`;

    try {
      // Consumer 생성 (socketApi를 통해 서버와 협상)
      const consumerData = await this.createConsumer(producerId, rtpCapabilities);
      const consumer = await this.recvTransport.consume({
        ...consumerData,
        kind: kind, // 명시적으로 kind 설정
      });

      const trackInfo: TrackInfo = {
        trackId,
        track: consumer.track,
        consumer,
        peerId: socketId,
        kind,
      };

      // 원격 저장
      this.remoteTracks.set(trackId, trackInfo);
      this.consumerMap.set(consumer.id, trackId);

      // Redux 상태 업데이트
      this.dispatch(setRemoteTrack({
        socketId,
        kind,
        track: {
          trackId,
          consumerId: consumer.id,
          producerId,
          peerId: socketId,
          kind,
          enabled: !consumer.paused,
        }
      }));

      console.log(`✅ Remote ${kind} track added for ${socketId}:`, trackId);
      return trackId;

    } catch (error) {
      console.error(`❌ Failed to add remote ${kind} track:`, error);
      throw error;
    }
  }

  // 트랙 활성화/비활성화
  enableLocalTrack(trackId: string, enabled: boolean): void {
    const trackInfo = this.localTracks.get(trackId);
    if (!trackInfo || !this.dispatch) return;

    trackInfo.track.enabled = enabled;
    
    this.dispatch(updateLocalTrack({
      kind: trackInfo.kind,
      updates: { enabled }
    }));

    console.log(`🔄 Local ${trackInfo.kind} track ${enabled ? 'enabled' : 'disabled'}`);
  }

  // 트랙 토글 (Hook에서 사용)
  toggleLocalTrack(trackId: string): void {
    const trackInfo = this.localTracks.get(trackId);
    if (trackInfo) {
      this.enableLocalTrack(trackId, !trackInfo.track.enabled);
    }
  }

  // 트랙 교체 (카메라/마이크 변경 시)
  async replaceLocalTrack(trackId: string, newTrack: MediaStreamTrack): Promise<void> {
    const trackInfo = this.localTracks.get(trackId);
    if (!trackInfo?.producer || !this.dispatch) {
      throw new Error('Track or producer not found');
    }

    try {
      // Producer의 트랙 교체
      await trackInfo.producer.replaceTrack({ track: newTrack });
      
      // 기존 트랙 정리
      trackInfo.track.stop();
      
      // 새 트랙으로 업데이트
      trackInfo.track = newTrack;

      this.dispatch(updateLocalTrack({
        kind: trackInfo.kind,
        updates: { 
          enabled: newTrack.enabled,
          muted: newTrack.kind === 'audio' ? newTrack.muted : undefined,
        }
      }));

      console.log(`🔄 Local ${trackInfo.kind} track replaced:`, trackId);

    } catch (error) {
      console.error(`❌ Failed to replace track:`, error);
      throw error;
    }
  }

  // 트랙 제거
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

    // Redux 상태 업데이트
    this.dispatch(removeLocalTrack(trackInfo.kind));

    console.log(`🗑️ Local ${trackInfo.kind} track removed:`, trackId);
  }

  removeRemoteTrack(trackId: string, socketId: string): void {
    const trackInfo = this.remoteTracks.get(trackId);
    if (!trackInfo || !this.dispatch) return;

    // Consumer 정리
    if (trackInfo.consumer) {
      trackInfo.consumer.close();
      this.consumerMap.delete(trackInfo.consumer.id);
    }

    this.remoteTracks.delete(trackId);

    // Redux 상태 업데이트
    this.dispatch(removeRemoteTrack({ socketId, kind: trackInfo.kind }));

    console.log(`🗑️ Remote ${trackInfo.kind} track removed:`, trackId);
  }

  // 트랙 가져오기 (컴포넌트에서 사용)
  getLocalTrack(kind: 'audio' | 'video'): MediaStreamTrack | null {
    for (const trackInfo of this.localTracks.values()) {
      if (trackInfo.kind === kind) {
        return trackInfo.track;
      }
    }
    return null;
  }

  getRemoteTrack(socketId: string, kind: 'audio' | 'video'): MediaStreamTrack | null {
    for (const trackInfo of this.remoteTracks.values()) {
      if (trackInfo.peerId === socketId && trackInfo.kind === kind) {
        return trackInfo.track;
      }
    }
    return null;
  }

  // Producer ID로 트랙 찾기
  getTrackByProducerId(producerId: string): TrackInfo | null {
    const trackId = this.producerMap.get(producerId);
    return trackId ? this.localTracks.get(trackId) || null : null;
  }

  // 모든 원격 트랙 가져오기
  getAllRemoteTracks(): Map<string, TrackInfo> {
    return this.remoteTracks;
  }

  // 전체 정리
  cleanup(): void {
    console.log('🧹 Cleaning up all tracks...');

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

    console.log('✅ Track cleanup completed');
  }

  // 서버와 Consumer 협상 (기존 socketApi 활용)
  private async createConsumer(producerId: string, rtpCapabilities: RtpCapabilities): Promise<any> {
    if (!this.recvTransport) {
      throw new Error('Receive transport not available');
    }

    return await socketApi.consume({
      transportId: this.recvTransport.id,
      producerId,
      rtpCapabilities,
      roomId: this.currentRoomId,
    });
  }
}

export const mediaTrackManager = new MediaTrackManager();
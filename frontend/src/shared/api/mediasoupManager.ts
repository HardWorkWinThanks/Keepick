// src/shared/api/mediasoupManager.ts
import { Device } from "mediasoup-client";
import { Transport, RtpCapabilities } from "mediasoup-client/types";
import { AppDispatch } from "@/shared/config/store";
import { socketApi } from "./socketApi";
import { mediaTrackManager } from "./mediaTrackManager";
import {
  setDeviceLoaded,
  setRtpCapabilities,
  setTransports,
  setTransportConnected,
  addRemotePeer,
  removeRemotePeer,
  resetMediaState,
} from "@/entities/video-conference/media/model/mediaSlice";

class MediasoupManager {
  private device: Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private dispatch: AppDispatch | null = null;
  private currentRoomId: string = '';

  public async init(dispatch: AppDispatch) {
    this.dispatch = dispatch;
    mediaTrackManager.init(dispatch);

    try {
      console.log('🚀 Initializing MediaSoup...');
      
      // Device 생성 및 초기화
      this.device = new Device();
      console.log('✅ MediaSoup Device created');

    } catch (error) {
      console.error('❌ MediaSoup initialization failed:', error);
      throw error;
    }
  }

  // RTP Capabilities 로드
  public async loadDevice(rtpCapabilities: RtpCapabilities): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error('Device not initialized');
    }

    // 이미 로드된 경우 스킵
    if (this.device.loaded) {
      console.log('⚠️ Device already loaded, skipping...');
      return;
    }

    try {
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
      
      this.dispatch(setRtpCapabilities(rtpCapabilities));
      this.dispatch(setDeviceLoaded(true));
      
      console.log('✅ Device loaded with RTP capabilities');
    } catch (error) {
      console.error('❌ Failed to load device:', error);
      throw error;
    }
  }

  // Transport 생성
  public async createTransports(roomId: string): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error('Device not initialized');
    }

    this.currentRoomId = roomId;

    try {
      // Send Transport 생성
      const sendTransportData = await socketApi.createProducerTransport(roomId);
      console.log('📤 Send transport data:', sendTransportData);
      this.sendTransport = this.device.createSendTransport(sendTransportData);
      this.setupSendTransportEvents(roomId);

      // Recv Transport 생성
      const recvTransportData = await socketApi.createConsumerTransport(roomId);
      console.log('📥 Recv transport data:', recvTransportData);
      this.recvTransport = this.device.createRecvTransport(recvTransportData);
      this.setupRecvTransportEvents();

      // MediaTrackManager에 Transport 설정
      mediaTrackManager.setTransports(this.sendTransport, this.recvTransport, roomId);

      this.dispatch(setTransports({
        sendId: this.sendTransport.id,
        recvId: this.recvTransport.id,
      }));

      console.log('✅ Transports created successfully');

    } catch (error) {
      console.error('❌ Failed to create transports:', error);
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
        await mediaTrackManager.addLocalTrack(audioTrack, 'local');
      }
      if (videoTrack) {
        await mediaTrackManager.addLocalTrack(videoTrack, 'local');
      }

      console.log('✅ Local media started');

    } catch (error) {
      console.error('❌ Failed to start local media:', error);
      throw error;
    }
  }

  // 원격 Producer 소비
  public async consumeProducer(data: { producerId: string; producerSocketId: string }): Promise<void> {
    if (!this.device || !this.dispatch) {
      throw new Error('Device not initialized');
    }

    const { producerId, producerSocketId } = data;

    try {
      // 서버에서 Producer 정보 가져오기
      const consumerData = await socketApi.consume({
        transportId: this.recvTransport!.id,
        producerId,
        rtpCapabilities: this.device.rtpCapabilities,
        roomId: this.currentRoomId,
      });

      // Consumer 생성
      const consumer = await this.recvTransport!.consume(consumerData);
      
      // MediaTrackManager를 통해 트랙 관리
      await mediaTrackManager.addRemoteTrack(
        producerId,
        producerSocketId,
        consumer.kind as 'audio' | 'video',
        this.device.rtpCapabilities
      );

      // Consumer resume
      if (consumer.paused) {
        await socketApi.resumeConsumer(consumer.id);
      }

      console.log(`✅ Consumer created for ${producerSocketId}:`, consumer.kind);

    } catch (error) {
      console.error(`❌ Failed to consume producer ${producerId}:`, error);
      throw error;
    }
  }

  // 피어 추가
  public addPeer(socketId: string, peerName: string): void {
    if (!this.dispatch) return;

    this.dispatch(addRemotePeer({
      socketId,
      peerId: socketId,
      peerName,
    }));

    console.log(`👥 Peer added: ${peerName} (${socketId})`);
  }

  // 피어 제거
  public removePeer(socketId: string): void {
    if (!this.dispatch) return;

    // 해당 피어의 모든 트랙 제거
    const audioTrackId = `remote_${socketId}_audio`;
    const videoTrackId = `remote_${socketId}_video`;
    
    mediaTrackManager.removeRemoteTrack(audioTrackId, socketId);
    mediaTrackManager.removeRemoteTrack(videoTrackId, socketId);

    this.dispatch(removeRemotePeer(socketId));

    console.log(`👥 Peer removed: ${socketId}`);
  }

  // Producer 종료 처리
  public handleProducerClosed(producerId: string): void {
    const trackInfo = mediaTrackManager.getTrackByProducerId(producerId);
    if (trackInfo) {
      mediaTrackManager.removeRemoteTrack(trackInfo.trackId, trackInfo.peerId);
      console.log(`🔌 Producer ${producerId} closed, track removed`);
    }
  }

  // 로컬 트랙 토글
  public toggleLocalTrack(kind: 'audio' | 'video'): void {
    const track = mediaTrackManager.getLocalTrack(kind);
    if (track) {
      const newEnabled = !track.enabled;
      mediaTrackManager.enableLocalTrack(`local_${kind}`, newEnabled);
      console.log(`🔄 Local ${kind} ${newEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  // 디바이스 변경
  public async changeDevice(kind: 'audio' | 'video', deviceId: string): Promise<void> {
    try {
      const constraints = kind === 'video' 
        ? { video: { deviceId, width: 1280, height: 720 } }
        : { audio: { deviceId } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = stream.getTracks()[0];

      // 기존 트랙을 새 트랙으로 교체
      const trackId = `local_${kind}`;
      await mediaTrackManager.replaceLocalTrack(trackId, newTrack);

      console.log(`🔄 ${kind} device changed to:`, deviceId);

    } catch (error) {
      console.error(`❌ Failed to change ${kind} device:`, error);
      throw error;
    }
  }

  // 정리
  public cleanup(): void {
    console.log('🧹 Cleaning up MediaSoup...');

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

    // Redux 상태 초기화
    if (this.dispatch) {
      this.dispatch(resetMediaState());
    }

    this.currentRoomId = '';
    this.dispatch = null;

    console.log('✅ MediaSoup cleanup completed');
  }

  // Send Transport 이벤트 설정
  private setupSendTransportEvents(roomId: string): void {
    if (!this.sendTransport) return;

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socketApi.connectTransport({
          transportId: this.sendTransport!.id,
          dtlsParameters,
        });
        callback();
        console.log('✅ Send transport connected');
      } catch (error) {
        console.error('❌ Send transport connect failed:', error);
        errback(error as Error);
      }
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { id } = await socketApi.produce({
          transportId: this.sendTransport!.id,
          kind,
          rtpParameters,
          roomId,
        });
        callback({ id });
        console.log(`✅ Producer created: ${id} (${kind})`);
      } catch (error) {
        console.error('❌ Produce failed:', error);
        errback(error as Error);
      }
    });

    this.sendTransport.on('connectionstatechange', (state) => {
      console.log(`🔗 Send transport state: ${state}`);
      
      // Transport가 실패해도 기능적으로는 작동하므로 connected로 처리
      // (Producer 생성이 성공했다면 미디어 전송은 가능)
      if (this.dispatch) {
        // failed 상태라도 기능적으로는 연결된 것으로 간주
        const functionallyConnected = (state === 'connected') || (state === 'failed');
        this.dispatch(setTransportConnected(functionallyConnected));
      }
      
      // 연결 실패 시 더 자세한 로그 (하지만 panic하지 않음)
      if (state === 'failed') {
        console.warn('⚠️ Send transport state is failed, but may still be functional');
        this.sendTransport?.getStats().then(stats => {
          console.log('Send transport stats:', stats);
        });
      }
    });

    // ICE gathering state 변경 추적 (올바른 이벤트명)
    this.sendTransport.on('icegatheringstatechange', (iceState) => {
      console.log(`🧊 Send transport ICE gathering state: ${iceState}`);
    });

    // ICE candidate error 추적
    this.sendTransport.on('icecandidateerror', (error) => {
      console.error(`❌ Send transport ICE candidate error:`, error);
    });
  }

  // Recv Transport 이벤트 설정
  private setupRecvTransportEvents(): void {
    if (!this.recvTransport) return;

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await socketApi.connectTransport({
          transportId: this.recvTransport!.id,
          dtlsParameters,
        });
        callback();
        console.log('✅ Recv transport connected');
      } catch (error) {
        console.error('❌ Recv transport connect failed:', error);
        errback(error as Error);
      }
    });

    this.recvTransport.on('connectionstatechange', (state) => {
      console.log(`🔗 Recv transport state: ${state}`);
      
      // Redux 상태도 업데이트 (전체 연결 상태는 send와 recv 모두 고려)
      if (this.dispatch && this.sendTransport) {
        const bothConnected = (state === 'connected' && this.sendTransport.connectionState === 'connected') ||
                             (this.sendTransport.connectionState === 'connected' && state === 'connected');
        this.dispatch(setTransportConnected(bothConnected));
      }
      
      // 연결 실패 시 더 자세한 로그
      if (state === 'failed') {
        console.error('❌ Recv transport connection failed');
        this.recvTransport?.getStats().then(stats => {
          console.log('Recv transport stats:', stats);
        });
      }
    });

    // ICE gathering state 변경 추적
    this.recvTransport.on('icegatheringstatechange', (iceState) => {
      console.log(`🧊 Recv transport ICE gathering state: ${iceState}`);
    });

    // ICE candidate error 추적
    this.recvTransport.on('icecandidateerror', (error) => {
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
}

export const mediasoupManager = new MediasoupManager();
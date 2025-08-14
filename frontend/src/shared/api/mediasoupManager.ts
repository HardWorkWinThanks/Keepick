  // src/shared/api/mediasoupManager.ts
  import { Device } from "mediasoup-client";
  import {
    Transport,
    Producer,
    Consumer,
    RtpCapabilities,
  } from "mediasoup-client/types";
  import { AppDispatch } from "@/shared/config/store";
  import { socketApi } from "./socketApi";
  import { EventEmitter } from "events";
  import {
    setIsProducing,
    resetMediaState,
  } from "@/entities/video-conference/media/model/slice";
  import {
    addRemotePeer,
    removeRemotePeer,
    setDeviceLoaded,
    resetWebrtcState,
  } from "@/entities/video-conference/webrtc/model/slice";

  class MediasoupManager extends EventEmitter {
    private device: Device | null = null;
    private producerTransport: Transport | null = null;
    private consumerTransport: Transport | null = null;
    private producers = new Map<string, Producer>();
    private consumers = new Map<string, { consumer: Consumer; socketId: string }>();
    private localStream: MediaStream | null = null;
    private remoteStreams = new Map<string, MediaStream>();
    private dispatch: AppDispatch | null = null;
    private consumptionQueue: {
      producerId: string;
      producerSocketId: string;
      roomId: string;
    }[] = [];
    private isConsuming = false;
    private streamUpdateTimers = new Map<string, NodeJS.Timeout>();

    public getDevice = () => this.device;

    constructor() {
      super();
    }

    public init(dispatch: AppDispatch) {
      this.dispatch = dispatch;
    }

    public getLocalStream = () => this.localStream;
    public getRemoteStream = (socketId: string) => this.remoteStreams.get(socketId);

    public async initializeDevice(routerRtpCapabilities: RtpCapabilities) {
      if (!this.dispatch) throw new Error("Manager not initialized");
      try {
        this.device = new Device();
        await this.device.load({ routerRtpCapabilities });
        this.dispatch(setDeviceLoaded(true));
        console.log("✅ MediaSoup device loaded");
      } catch (error) {
        console.error("❌ Failed to load device:", error);
        this.dispatch(setDeviceLoaded(false));
        throw error;
      }
    }

    public async initializeLocalMedia() {
      if (!this.dispatch) throw new Error("Manager not initialized");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        this.localStream = stream;
        console.log("✅ Local media stream initialized");
      } catch (error) {
        console.error("❌ Failed to get local media:", error);
        throw error;
      }
    }

    public async createProducerTransport(roomId: string) {
      if (!this.device) throw new Error("Device not loaded");
      const transportOptions = await socketApi.createProducerTransport(roomId);
      this.producerTransport = this.device.createSendTransport(transportOptions);

      this.producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketApi.connectTransport({
            transportId: this.producerTransport!.id,
            dtlsParameters,
          });
          callback();
        } catch (e) {
          errback(e as Error);
        }
      });

      this.producerTransport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { id } = await socketApi.produce({
            transportId: this.producerTransport!.id,
            kind,
            rtpParameters,
            roomId,
          });
          callback({ id });
        } catch (e) {
          errback(e as Error);
        }
      });
      console.log("✅ Producer transport created");
    }

    public async createConsumerTransport(roomId: string) {
      if (!this.device) throw new Error("Device not loaded");
      const transportOptions = await socketApi.createConsumerTransport(roomId);
      this.consumerTransport = this.device.createRecvTransport(transportOptions);

      this.consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketApi.connectTransport({
            transportId: this.consumerTransport!.id,
            dtlsParameters,
          });
          callback();
        } catch (e) {
          errback(e as Error);
        }
      });
      console.log("✅ Consumer transport created");
    }

    public setLocalStream(stream: MediaStream) {
      this.localStream = stream;
      console.log("✅ Local stream has been set in mediasoupManager.");
    }

    public async startProducing() {
      if (!this.producerTransport || !this.localStream || !this.dispatch)
        throw new Error("Cannot start producing");

      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await this.producerTransport.produce({ track: videoTrack });
        this.producers.set(videoProducer.id, videoProducer);
      }

      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await this.producerTransport.produce({ track: audioTrack });
        this.producers.set(audioProducer.id, audioProducer);
      }

      this.dispatch(setIsProducing(true));
      console.log("✅ Started producing audio and video");
    }

    public async consume(producerId: string, producerSocketId: string, roomId: string) {
      this.consumptionQueue.push({ producerId, producerSocketId, roomId });
      this.processConsumptionQueue();
    }

    private async processConsumptionQueue() {
      if (this.isConsuming || this.consumptionQueue.length === 0) return;
      this.isConsuming = true;
      const { producerId, producerSocketId, roomId } = this.consumptionQueue.shift()!;
      
      console.log(`🎯 [MediasoupManager] Processing consumption:`, { producerId, producerSocketId });

      try {
        if (!this.consumerTransport || !this.device || !this.dispatch) {
          throw new Error("Cannot consume, transport is not ready.");
        }

        const consumerOptions = await socketApi.consume({
          transportId: this.consumerTransport.id,
          producerId,
          rtpCapabilities: this.device.rtpCapabilities,
          roomId,
        });

        const consumer = await this.consumerTransport.consume(consumerOptions);
        this.consumers.set(producerId, { consumer, socketId: producerSocketId });
        consumer.on("trackended", () => this.closeConsumerForProducer(producerId));

        const { track } = consumer;
        let stream = this.remoteStreams.get(producerSocketId);
        
        const isNewUserStream = !stream;
        if (isNewUserStream) {
          stream = new MediaStream();
          this.remoteStreams.set(producerSocketId, stream);
          console.log(`🆕 [MediasoupManager] Created new stream for ${producerSocketId}`);
        } else {
          console.log(`♻️ [MediasoupManager] Reusing existing stream for ${producerSocketId}`);
        }

        if (!stream) {
        // 논리적으로 이 코드는 실행되지 않아야 하지만, 타입스크립트를 만족시키고
        // 런타임 안정성을 높여줍니다.
        console.error(`[CRITICAL] Stream for ${producerSocketId} is null after initialization.`);
        return; 
      }

        // ⭐⭐⭐ 바로 여기입니다! 이 로직이 누락되었습니다. ⭐⭐⭐
        // 새로 추가할 트랙과 동일한 종류(kind)의 기존 트랙을 먼저 찾아서 제거합니다.
        // 이렇게 하면 스트림은 항상 종류별로 하나의 활성 트랙만 가지게 됩니다.
        const existingTrack = stream.getTracks().find(t => t.kind === track.kind);
        if (existingTrack) {
          stream.removeTrack(existingTrack);
          console.log(`🔄 [MediasoupManager] Replaced existing ${existingTrack.kind} track for ${producerSocketId}`);
        }
        
        // 이제 새로운 트랙을 안전하게 추가할 수 있습니다.
        stream.addTrack(track);
        console.log(`➕ [MediasoupManager] Added ${track.kind} track to stream. Total tracks: ${stream.getTracks().length}`);
        
        if (this.streamUpdateTimers.has(producerSocketId)) {
          clearTimeout(this.streamUpdateTimers.get(producerSocketId)!);
          this.streamUpdateTimers.delete(producerSocketId);
          console.log(`[Debounce] 타이머 취소. 병합된 스트림으로 즉시 업데이트 발행. user: ${producerSocketId}`);
          // ⭐ 수정: stream이 undefined일 경우를 대비해 || null 추가
          this.emit('stream-updated', { socketId: producerSocketId, stream: stream || null });
        } else {
          console.log(`[Debounce] 50ms 후 스트림 업데이트 타이머 설정. user: ${producerSocketId}`);
          const timerId = setTimeout(() => {
            console.log(`[Debounce] 타이머 실행. 스트림 업데이트 발행. user: ${producerSocketId}`);
            // ⭐ 수정: stream이 undefined일 경우를 대비해 || null 추가
            this.emit('stream-updated', { socketId: producerSocketId, stream: stream || null });
            this.streamUpdateTimers.delete(producerSocketId);
          }, 50);
          this.streamUpdateTimers.set(producerSocketId, timerId);
        }
        
        if (isNewUserStream) {
          this.dispatch(addRemotePeer(producerSocketId));
        }

        if (consumer.paused) {
          console.log(`🎮 [MediasoupManager] Consumer is paused, attempting to resume: ${consumer.id}`);
          await socketApi.resumeConsumer(consumer.id);
          console.log(`✅ [MediasoupManager] Resume request sent for: ${consumer.id}`);
        }

      } catch (error) {
        console.error(`❌ Failed to consume producer ${producerId}:`, error);
      } finally {
        this.isConsuming = false;
        if (this.consumptionQueue.length > 0) {
          this.processConsumptionQueue();
        }
      }
    }

    public closeConsumerForProducer(producerId: string) {
      const consumerData = this.consumers.get(producerId);
      if (!consumerData) return;

      const { consumer, socketId } = consumerData;
      consumer.close();

      const stream = this.remoteStreams.get(socketId);
      if (stream) {
        stream.removeTrack(consumer.track);
        if (stream.getTracks().length === 0) {
          this.remoteStreams.delete(socketId);
          if(this.streamUpdateTimers.has(socketId)){
              clearTimeout(this.streamUpdateTimers.get(socketId)!);
              this.streamUpdateTimers.delete(socketId);
          }
          this.dispatch?.(removeRemotePeer(socketId));
          // 사용자가 나갔을 때도 스트림이 null로 업데이트 되었다고 알려주는 것이 좋습니다.
          this.emit('stream-updated', { socketId, stream: null });
        }
      }
      this.consumers.delete(producerId);
    }

    public toggleTrack(kind: "video" | "audio", enabled: boolean) {
      if (!this.localStream) return;
      const track = kind === "video"
          ? this.localStream.getVideoTracks()[0]
          : this.localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = enabled;
      }
    }

    public cleanup() {
      console.log("🧹 Cleaning up media resources...");
      
      this.streamUpdateTimers.forEach(timer => clearTimeout(timer));
      this.streamUpdateTimers.clear();

      this.localStream?.getTracks().forEach((track) => track.stop());
      this.localStream = null;

      this.remoteStreams.forEach((stream) =>
        stream.getTracks().forEach((track) => track.stop())
      );
      this.remoteStreams.clear();

      this.producers.forEach((p) => p.close());
      this.producers.clear();
      this.producerTransport?.close();
      this.producerTransport = null;

      this.consumers.forEach(({ consumer }) => consumer.close());
      this.consumers.clear();
      this.consumerTransport?.close();
      this.consumerTransport = null;

      this.device = null;

      if (this.dispatch) {
        this.dispatch(resetWebrtcState());
        this.dispatch(resetMediaState());
      }
    }
  }

  export const mediasoupManager = new MediasoupManager();

// src/shared/api/screenShareManager.ts
import { Device } from "mediasoup-client";
import { Transport, Producer, Consumer } from "mediasoup-client/types";
import { AppDispatch } from "@/shared/config/store";
import { socketApi } from "./socketApi";
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
  private device: Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private producer: Producer | null = null;
  private consumers = new Map<string, Consumer>();
  private localStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>();
  private dispatch: AppDispatch | null = null;

  public init(dispatch: AppDispatch, device: Device) {
    this.dispatch = dispatch;
    this.device = device;
    console.log("🔧 ScreenShareManager initialized with device:", !!device);
  }

  public getLocalScreenStream = () => {
    console.log("📺 Getting local screen stream:", !!this.localStream);
    return this.localStream;
  };

  public getRemoteScreenStream = (peerId: string) => {
    const stream = this.remoteStreams.get(peerId);
    console.log(`📺 Getting remote screen stream for ${peerId}:`, !!stream);
    console.log(
      "📺 Available remote streams:",
      Array.from(this.remoteStreams.keys())
    );
    return stream;
  };

  // 화면 공유 시작
  public async startScreenShare(
    roomId: string,
    peerId: string,
    peerName: string
  ): Promise<void> {
    if (!this.dispatch || !this.device) {
      throw new Error("ScreenShareManager not initialized");
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
      console.log("📹 Local screen stream created:", stream.id);

      // 화면 공유가 사용자에 의해 중지될 때 처리
      videoTrack.onended = () => {
        console.log("Screen share ended by user");
        this.stopScreenShare(roomId, peerId);
      };

      // Send Transport 생성 (없는 경우)
      if (!this.sendTransport) {
        await this.createSendTransport(roomId);
      }

      if (!this.sendTransport) {
        throw new Error("Failed to create send transport");
      }

      // Producer 생성
      this.producer = await this.sendTransport.produce({
        track: videoTrack,
        appData: { type: "screenshare" },
      });

      const screenShare = {
        id: this.producer.id,
        producerId: this.producer.id,
        peerId,
        peerName,
        isActive: true,
        startedAt: new Date(),
      };

      this.dispatch(startScreenShareSuccess(screenShare));

      // 서버에 화면 공유 시작 알림
      socketApi.startScreenShare({
        roomId,
        peerId,
        producerId: this.producer.id,
        transportId: this.sendTransport.id,
        rtpParameters: this.producer.rtpParameters,
      });

      console.log("✅ Screen share started successfully", {
        producerId: this.producer.id,
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

  // 화면 공유 중지
  public async stopScreenShare(roomId: string, peerId: string): Promise<void> {
    if (!this.dispatch) {
      throw new Error("ScreenShareManager not initialized");
    }

    try {
      this.dispatch(stopScreenShareRequest());
      console.log(`🛑 Stopping screen share for ${peerId}`);

      // Producer 정리
      if (this.producer) {
        const producerId = this.producer.id;
        this.producer.close();
        this.producer = null;

        // 서버에 화면 공유 중지 알림
        socketApi.stopScreenShare({
          roomId,
          peerId,
          producerId,
        });
      }

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

  // 원격 화면 공유 소비
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

      // 이미 해당 peerId의 스트림이 존재하는지 확인
      if (this.remoteStreams.has(producerPeerId)) {
        console.log(
          `⚠️ Stream already exists for ${producerPeerId}, skipping...`
        );
        return;
      }

      // Recv Transport 생성 (없는 경우)
      if (!this.recvTransport) {
        await this.createRecvTransport(roomId);
      }

      if (!this.recvTransport) {
        throw new Error("Failed to create recv transport");
      }

      // 서버에 consume 요청
      const consumerOptions = await socketApi.consumeScreenShare({
        roomId,
        transportId: this.recvTransport.id,
        producerId,
        rtpCapabilities: this.device.rtpCapabilities,
      });

      // Consumer 생성
      const consumer = await this.recvTransport.consume(consumerOptions);
      this.consumers.set(producerId, consumer);

      // 스트림 생성
      const stream = new MediaStream([consumer.track]);
      this.remoteStreams.set(producerPeerId, stream);

      console.log(
        `📹 Remote screen stream created for ${producerPeerId}:`,
        stream.id
      );
      console.log(
        `📺 Remote streams map:`,
        Array.from(this.remoteStreams.keys())
      );

      // Redux 상태 업데이트
      const screenShare = {
        id: producerId,
        producerId,
        peerId: producerPeerId,
        peerName: producerPeerName,
        isActive: true,
        startedAt: new Date(),
      };

      this.dispatch(addRemoteScreenShare(screenShare));

      // Consumer resume (필요한 경우)
      if (consumer.paused) {
        await socketApi.resumeConsumer(consumer.id);
      }

      console.log(`✅ Screen share consumption successful: ${producerPeerId}`, {
        producerId,
        streamId: stream.id,
        consumerPaused: consumer.paused,
      });
    } catch (error) {
      console.error(
        `❌ Screen share consumption failed: ${producerPeerId}`,
        error
      );
      throw error;
    }
  }

  // 원격 화면 공유 제거
  public removeRemoteScreenShare(
    producerId: string,
    producerPeerId: string
  ): void {
    if (!this.dispatch) return;

    try {
      console.log(
        `🗑️ Removing remote screen share: ${producerPeerId}, producerId: ${producerId}`
      );

      // Consumer 정리
      const consumer = this.consumers.get(producerId);
      if (consumer) {
        consumer.close();
        this.consumers.delete(producerId);
        console.log(`🗑️ Consumer closed for producerId: ${producerId}`);
      }

      // 스트림 정리
      const stream = this.remoteStreams.get(producerPeerId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        this.remoteStreams.delete(producerPeerId);
        console.log(`🗑️ Stream removed for peerId: ${producerPeerId}`);
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

  // Send Transport 생성
  private async createSendTransport(roomId: string): Promise<void> {
    try {
      console.log("🚚 Creating screen share send transport...");
      const transportOptions = await socketApi.createProducerTransport(roomId);
      this.sendTransport = this.device!.createSendTransport(transportOptions);

      this.sendTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            await socketApi.connectTransport({
              transportId: this.sendTransport!.id,
              dtlsParameters,
            });
            callback();
          } catch (error) {
            errback(error as Error);
          }
        }
      );

      this.sendTransport.on(
        "produce",
        async ({ kind, rtpParameters }, callback, errback) => {
          try {
            const { id } = await socketApi.produce({
              transportId: this.sendTransport!.id,
              kind,
              rtpParameters,
              roomId,
            });
            callback({ id });
          } catch (error) {
            errback(error as Error);
          }
        }
      );

      console.log("✅ Screen share send transport created");
    } catch (error) {
      console.error("❌ Create send transport failed:", error);
      throw error;
    }
  }

  // Recv Transport 생성
  private async createRecvTransport(roomId: string): Promise<void> {
    try {
      console.log("🚚 Creating screen share recv transport...");
      const transportOptions = await socketApi.createConsumerTransport(roomId);
      this.recvTransport = this.device!.createRecvTransport(transportOptions);

      this.recvTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            await socketApi.connectTransport({
              transportId: this.recvTransport!.id,
              dtlsParameters,
            });
            callback();
          } catch (error) {
            errback(error as Error);
          }
        }
      );

      console.log("✅ Screen share recv transport created");
    } catch (error) {
      console.error("❌ Create recv transport failed:", error);
      throw error;
    }
  }

  // 정리
  public cleanup(): void {
    console.log("🧹 Cleaning up screen share resources...");

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

    // Producer 정리
    if (this.producer) {
      this.producer.close();
      this.producer = null;
    }

    // Consumers 정리
    this.consumers.forEach((consumer, producerId) => {
      console.log(`🗑️ Cleaning up consumer for ${producerId}`);
      consumer.close();
    });
    this.consumers.clear();

    // Transports 정리
    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }

    this.device = null;
    this.dispatch = null;

    console.log("✅ Screen share cleanup completed");
  }
}

export const screenShareManager = new ScreenShareManager();

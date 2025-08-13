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

class MediasoupManager {
  private device: Device | null = null;
  private producerTransport: Transport | null = null;
  private consumerTransport: Transport | null = null;
  private producers = new Map<string, Producer>();
  private consumers = new Map<
    string,
    { consumer: Consumer; socketId: string }
  >();
  private localStream: MediaStream | null = null;
  private remoteStreams = new Map<string, MediaStream>();
  private dispatch: AppDispatch | null = null;

  public init(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  public getLocalStream = () => this.localStream;
  public getRemoteStream = (socketId: string) =>
    this.remoteStreams.get(socketId);

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

    this.producerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketApi.connectTransport({
            transportId: this.producerTransport!.id,
            dtlsParameters,
          });
          callback();
        } catch (e) {
          errback(e as Error);
        }
      }
    );

    this.producerTransport.on(
      "produce",
      async ({ kind, rtpParameters }, callback, errback) => {
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
      }
    );
    console.log("✅ Producer transport created");
  }

  public async createConsumerTransport(roomId: string) {
    if (!this.device) throw new Error("Device not loaded");
    const transportOptions = await socketApi.createConsumerTransport(roomId);
    this.consumerTransport = this.device.createRecvTransport(transportOptions);

    this.consumerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketApi.connectTransport({
            transportId: this.consumerTransport!.id,
            dtlsParameters,
          });
          callback();
        } catch (e) {
          errback(e as Error);
        }
      }
    );
    console.log("✅ Consumer transport created");
  }

  public async startProducing() {
    if (!this.producerTransport || !this.localStream || !this.dispatch)
      throw new Error("Cannot start producing");

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      const videoProducer = await this.producerTransport.produce({
        track: videoTrack,
      });
      this.producers.set(videoProducer.id, videoProducer);
    }

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      const audioProducer = await this.producerTransport.produce({
        track: audioTrack,
      });
      this.producers.set(audioProducer.id, audioProducer);
    }

    this.dispatch(setIsProducing(true));
    console.log("✅ Started producing audio and video");
  }

  public async consume(
    producerId: string,
    producerSocketId: string,
    roomId: string
  ) {
    if (!this.consumerTransport || !this.device || !this.dispatch)
      throw new Error("Cannot consume");

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
    if (!stream) {
      stream = new MediaStream();
      this.remoteStreams.set(producerSocketId, stream);
    }
    stream.addTrack(track);

    this.dispatch(addRemotePeer(producerSocketId));
    console.log(`✅ Consuming ${consumer.kind} from ${producerSocketId}`);
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
        this.dispatch?.(removeRemotePeer(socketId));
      }
    }
    this.consumers.delete(producerId);
  }

  public toggleTrack(kind: "video" | "audio", enabled: boolean) {
    if (!this.localStream) return;
    const track =
      kind === "video"
        ? this.localStream.getVideoTracks()[0]
        : this.localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = enabled;
    }
  }

  public cleanup() {
    console.log("🧹 Cleaning up media resources...");
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

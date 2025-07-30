import { useRef, useCallback, useState } from "react";
import { Device } from "mediasoup-client";
import { Socket } from "socket.io-client";

// ✅ 서버와 통신할 때 사용하는 인터페이스들
interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
}

interface ProducerCreatedData {
  id: string;
}

interface ConsumerData {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
}

export const useMediasoup = (socket: Socket | null) => {
  const deviceRef = useRef<Device | null>(null);
  const producerTransportRef = useRef<any>(null); // Transport 타입을 any로 변경
  const consumerTransportRef = useRef<any>(null); // Transport 타입을 any로 변경
  const producersRef = useRef<Map<string, any>>(new Map()); // Producer 타입을 any로 변경
  const consumersRef = useRef<Map<string, any>>(new Map()); // Consumer 타입을 any로 변경
  const localStreamRef = useRef<MediaStream | null>(null);

  const [deviceLoaded, setDeviceLoaded] = useState(false);
  const [isProducing, setIsProducing] = useState(false);

  // Device 초기화 - RtpCapabilities 타입을 any로 변경
  const initializeDevice = useCallback(async (rtpCapabilities: any) => {
    try {
      const device = new Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });

      deviceRef.current = device;
      setDeviceLoaded(true);

      console.log("✅ MediaSoup device loaded");
      console.log("Device RTP capabilities:", device.rtpCapabilities);

      return device;
    } catch (error) {
      console.error("❌ Failed to initialize device:", error);
      throw error;
    }
  }, []);

  // Producer Transport 생성
  const createProducerTransport = useCallback(
    async (roomId: string) => {
      if (!socket || !deviceRef.current) {
        throw new Error("Socket or device not available");
      }

      return new Promise<any>((resolve, reject) => {
        socket.emit("create_producer_transport", { roomId });

        socket.once(
          "producer_transport_created",
          async (transportOptions: TransportOptions) => {
            try {
              const transport =
                deviceRef.current!.createSendTransport(transportOptions);

              transport.on(
                "connect",
                async (
                  { dtlsParameters }: any,
                  callback: any,
                  errback: any
                ) => {
                  try {
                    socket.emit("connect_transport", {
                      transportId: transport.id,
                      dtlsParameters,
                    });

                    socket.once("transport_connected", () => {
                      callback();
                    });
                  } catch (error) {
                    errback(error);
                  }
                }
              );

              transport.on(
                "produce",
                async (
                  { kind, rtpParameters }: any,
                  callback: any,
                  errback: any
                ) => {
                  try {
                    socket.emit("produce", {
                      transportId: transport.id,
                      kind,
                      rtpParameters,
                      roomId,
                    });

                    socket.once(
                      "producer_created",
                      (data: ProducerCreatedData) => {
                        callback({ id: data.id });
                      }
                    );
                  } catch (error) {
                    errback(error);
                  }
                }
              );

              producerTransportRef.current = transport;
              console.log("✅ Producer transport created");
              resolve(transport);
            } catch (error) {
              console.error("❌ Failed to create producer transport:", error);
              reject(error);
            }
          }
        );

        // 에러 처리 추가
        socket.once("error", (error: any) => {
          console.error("❌ Producer transport creation error:", error);
          reject(
            new Error(error.message || "Failed to create producer transport")
          );
        });
      });
    },
    [socket]
  );

  // Consumer Transport 생성
  const createConsumerTransport = useCallback(
    async (roomId: string) => {
      if (!socket || !deviceRef.current) {
        throw new Error("Socket or device not available");
      }

      return new Promise<any>((resolve, reject) => {
        socket.emit("create_consumer_transport", { roomId });

        socket.once(
          "consumer_transport_created",
          async (transportOptions: TransportOptions) => {
            try {
              const transport =
                deviceRef.current!.createRecvTransport(transportOptions);

              transport.on(
                "connect",
                async (
                  { dtlsParameters }: any,
                  callback: any,
                  errback: any
                ) => {
                  try {
                    socket.emit("connect_transport", {
                      transportId: transport.id,
                      dtlsParameters,
                    });

                    socket.once("transport_connected", () => {
                      callback();
                    });
                  } catch (error) {
                    errback(error);
                  }
                }
              );

              consumerTransportRef.current = transport;
              console.log("✅ Consumer transport created");
              resolve(transport);
            } catch (error) {
              console.error("❌ Failed to create consumer transport:", error);
              reject(error);
            }
          }
        );

        // 에러 처리 추가
        socket.once("error", (error: any) => {
          console.error("❌ Consumer transport creation error:", error);
          reject(
            new Error(error.message || "Failed to create consumer transport")
          );
        });
      });
    },
    [socket]
  );

  // 미디어 Produce 시작
  const startProducing = useCallback(async (stream: MediaStream) => {
    if (!producerTransportRef.current) {
      throw new Error("Producer transport not available");
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      const producers: any[] = [];

      if (videoTrack) {
        const videoProducer = await producerTransportRef.current.produce({
          track: videoTrack,
        });
        producersRef.current.set(videoProducer.id, videoProducer);
        producers.push(videoProducer);
        console.log("✅ Video producer created:", videoProducer.id);
      }

      if (audioTrack) {
        const audioProducer = await producerTransportRef.current.produce({
          track: audioTrack,
        });
        producersRef.current.set(audioProducer.id, audioProducer);
        producers.push(audioProducer);
        console.log("✅ Audio producer created:", audioProducer.id);
      }

      if (producers.length > 0) {
        setIsProducing(true);
      }

      return producers;
    } catch (error) {
      console.error("❌ Failed to start producing:", error);
      throw error;
    }
  }, []);

  // Consumer 중복 생성 방지
  const activeConsumerRequests = useRef<Set<string>>(new Set());

  const consume = useCallback(
    async (producerId: string, roomId: string): Promise<any> => {
      // 🔥 중복 요청 방지
      if (activeConsumerRequests.current.has(producerId)) {
        console.warn(
          `⏸️ Consumer request already in progress for producer: ${producerId}`
        );
        return null;
      }

      // 필수 조건 검증
      if (!socket || !consumerTransportRef.current || !deviceRef.current) {
        console.warn("❌ Cannot consume: transport or device not available");
        return null;
      }

      console.log(`🔄 Starting consume process for producer ${producerId}`);

      // 🔥 활성 요청 목록에 추가
      activeConsumerRequests.current.add(producerId);

      return new Promise((resolve, reject) => {
        const cleanup = () => {
          // 🔥 완료 후 활성 요청 목록에서 제거
          activeConsumerRequests.current.delete(producerId);
        };

        socket.emit("consume", {
          transportId: consumerTransportRef.current!.id,
          producerId,
          rtpCapabilities: deviceRef.current!.rtpCapabilities,
          roomId,
        });

        socket.once("consumer_created", async (consumerData: ConsumerData) => {
          try {
            const consumer = await consumerTransportRef.current!.consume({
              id: consumerData.id,
              producerId: consumerData.producerId,
              kind: consumerData.kind,
              rtpParameters: consumerData.rtpParameters,
            });

            consumersRef.current.set(consumer.id, consumer);

            // Consumer 재생 시작
            socket.emit("resume_consumer", { consumerId: consumer.id });

            console.log(
              "✅ Consumer created:",
              consumer.id,
              "kind:",
              consumer.kind
            );
            cleanup();
            resolve(consumer);
          } catch (error) {
            console.error("❌ Failed to create consumer:", error);
            cleanup();
            reject(error);
          }
        });

        // 에러 처리
        socket.once("error", (error: any) => {
          console.error("❌ Consumer creation error:", error);
          cleanup();
          reject(new Error(error.message || "Failed to create consumer"));
        });

        // 타임아웃 처리
        setTimeout(() => {
          cleanup();
          reject(new Error("Consumer creation timeout"));
        }, 10000); // 10초 타임아웃
      });
    },
    [socket]
  );

  // 로컬 미디어 초기화
  const initializeLocalMedia = useCallback(async () => {
    try {
      // 기존 스트림이 있다면 정리
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      localStreamRef.current = stream;

      // 트랙 상태 로깅
      stream.getTracks().forEach((track) => {
        console.log(`Local ${track.kind} track:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });
      });

      console.log("✅ Local media initialized");
      return stream;
    } catch (error) {
      console.error("❌ Failed to initialize local media:", error);
      throw error;
    }
  }, []);

  // 특정 Consumer 가져오기
  const getConsumer = useCallback((consumerId: string) => {
    return consumersRef.current.get(consumerId);
  }, []);

  // 특정 Producer 가져오기
  const getProducer = useCallback((producerId: string) => {
    return producersRef.current.get(producerId);
  }, []);

  // 정리
  const cleanup = useCallback(() => {
    console.log("🧹 MediaSoup cleanup started");

    // ✅ Producers 정리 - forEach 사용
    producersRef.current.forEach((producer) => {
      try {
        producer.close();
      } catch (error) {
        console.warn("Error closing producer:", error);
      }
    });
    producersRef.current.clear();

    // ✅ Consumers 정리 - forEach 사용
    consumersRef.current.forEach((consumer) => {
      try {
        consumer.close();
      } catch (error) {
        console.warn("Error closing consumer:", error);
      }
    });
    consumersRef.current.clear();

    // Transports 정리
    if (producerTransportRef.current) {
      try {
        producerTransportRef.current.close();
      } catch (error) {
        console.warn("Error closing producer transport:", error);
      }
      producerTransportRef.current = null;
    }

    if (consumerTransportRef.current) {
      try {
        consumerTransportRef.current.close();
      } catch (error) {
        console.warn("Error closing consumer transport:", error);
      }
      consumerTransportRef.current = null;
    }

    // Local stream 정리
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Device 정리
    deviceRef.current = null;

    setDeviceLoaded(false);
    setIsProducing(false);

    console.log("✅ MediaSoup cleanup completed");
  }, []);

  return {
    // State
    deviceLoaded,
    isProducing,

    // Methods
    initializeDevice,
    createProducerTransport,
    createConsumerTransport,
    startProducing,
    consume,
    initializeLocalMedia,
    cleanup,
    getConsumer,
    getProducer,

    // Refs
    localStreamRef,
    consumersRef,
    producersRef,
    deviceRef,
  };
};

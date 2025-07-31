// src/widgets/video-conference/ui/VideoConference.tsx
"use client";

import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSocket } from "@/shared/api/socket/useSocket";
import { useMediasoup } from "../lib/useMediaSoup";
import { useVideoSession } from "../model/useVideoSession";
import { VideoGrid } from "./VideoGrid";
import { ControlPanel } from "./ControlPanel";
import { StatusDisplay } from "./StatusDisplay";
import type { Consumer } from "mediasoup-client/types";

// Props 타입 정의
interface VideoConferenceProps {
  initialRoomId: string;
}

// 서버에서 받는 Producer 정보 타입을 명시적으로 정의
interface ProducerInfo {
  producerId: string;
  producerSocketId: string;
  kind: "audio" | "video";
}

export const VideoConference: React.FC<VideoConferenceProps> = ({
  initialRoomId,
}) => {
  const sessionState = useVideoSession();
  const {
    isConnected,
    roomId,
    isInRoom,
    connectionState,
    users,
    error,
    setRoomId,
    setIsInRoom,
    setError,
    handleConnect,
    handleDisconnect,
    handleAllUsers,
    handleUserJoined,
    handleUserExit,
    handleError,
    clearError,
  } = sessionState;

  useEffect(() => {
    if (initialRoomId && initialRoomId !== roomId) {
      setRoomId(initialRoomId);
      clearError();
    }
  }, [initialRoomId, setRoomId, roomId, clearError]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );

  // ✅ localStream을 state로 관리
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // ✅ localStream state가 변경될 때만 비디오 엘리먼트를 조작
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log(
        "✅ (useEffect) Local video stream has been set to the video element."
      );
    }
  }, [localStream]); // 이 useEffect는 오직 localStream에만 의존합니다.

  const [isProcessingExistingProducers, setIsProcessingExistingProducers] =
    useState(false);
  const processedProducersRef = useRef<Set<string>>(new Set());

  const socketCallbacks = useMemo(
    () => ({
      onConnect: () => {
        console.log("🔥 Socket connected - updating app state");
        handleConnect();
      },
      onDisconnect: () => {
        console.log("🔥 Socket disconnected - updating app state");
        handleDisconnect();
        setIsInRoom(false);
        setRemoteStreams(new Map());
        processedProducersRef.current.clear();
        setIsProcessingExistingProducers(false);
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
      },
      onConnectError: (err: Error) => {
        console.error("🔥 Socket connection error:", err);
        handleError({ message: `Connection error: ${err.message}` });
      },
    }),
    [handleConnect, handleDisconnect, handleError, setIsInRoom]
  );

  const { socket, joinRoom, leaveRoom } = useSocket(socketCallbacks);
  const {
    deviceLoaded,
    // isProducing,
    initializeDevice,
    createProducerTransport,
    createConsumerTransport,
    startProducing,
    consume,
    initializeLocalMedia,
    cleanup,
  } = useMediasoup(socket);

  const handleRemoteStream = useCallback(
    (consumer: Consumer, producerSocketId: string) => {
      try {
        const track = consumer.track;
        if (track) {
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            let stream = newMap.get(producerSocketId);
            if (!stream) {
              stream = new MediaStream();
              newMap.set(producerSocketId, stream);
            }
            const existingTracks = stream
              .getTracks()
              .filter((t) => t.kind === track.kind);
            existingTracks.forEach((t) => stream!.removeTrack(t));
            stream.addTrack(track);
            console.log(
              `✅ Remote ${consumer.kind} stream updated for peer ${producerSocketId}`
            );
            return newMap;
          });
        }
      } catch (err: unknown) {
        console.error("❌ Failed to handle remote stream:", err);
      }
    },
    []
  );

  const consumeExistingProducers = useCallback(
    async (existingProducers: ProducerInfo[]) => {
      if (isProcessingExistingProducers) {
        console.log("⏸️ Already processing existing producers, skipping...");
        return;
      }
      setIsProcessingExistingProducers(true);
      console.log(
        "🔍 Starting to consume existing producers:",
        existingProducers
      );
      try {
        for (const producerInfo of existingProducers) {
          try {
            if (processedProducersRef.current.has(producerInfo.producerId))
              continue;
            if (socket?.id === producerInfo.producerSocketId) {
              processedProducersRef.current.add(producerInfo.producerId);
              continue;
            }
            const consumer = await consume(producerInfo.producerId, roomId);
            if (consumer) {
              handleRemoteStream(consumer, producerInfo.producerSocketId);
              processedProducersRef.current.add(producerInfo.producerId);
            }
          } catch (err: unknown) {
            console.error(
              `❌ Failed to consume existing producer ${producerInfo.producerId}:`,
              err
            );
          }
        }
      } finally {
        setIsProcessingExistingProducers(false);
        console.log("✅ Finished processing existing producers.");
      }
    },
    [
      consume,
      roomId,
      handleRemoteStream,
      isProcessingExistingProducers,
      socket?.id,
    ]
  );

  const handleLeaveRoom = useCallback(() => {
    console.log("👋 Leaving room");
    leaveRoom();
    setIsInRoom(false);
    cleanup();
    setLocalStream(null); // 로컬 스트림 상태도 초기화
    processedProducersRef.current.clear();
    setIsProcessingExistingProducers(false);
    setRemoteStreams(new Map());
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    clearError();
  }, [leaveRoom, setIsInRoom, cleanup, clearError]);

  const handleJoinRoom = useCallback(async () => {
    if (!roomId.trim() || !socket?.connected) {
      setError("룸 이름을 입력해주세요.");
      return;
    }
    try {
      console.log(`🚪 Attempting to join room: ${roomId.trim()}`);
      processedProducersRef.current.clear();
      setIsProcessingExistingProducers(false);
      setRemoteStreams(new Map());

      const rtpCapabilities = await joinRoom(roomId.trim());
      if (!rtpCapabilities) {
        throw new Error("Failed to get RTP capabilities from server.");
      }

      await initializeDevice(rtpCapabilities);

      // 1. 로컬 미디어 스트림을 가져와서 state에 설정 (여기까지만 책임)
      const stream = await initializeLocalMedia();
      setLocalStream(stream);

      // 2. Transport 생성
      await createProducerTransport(roomId.trim());
      await createConsumerTransport(roomId.trim());

      // 3. 기존 Producer 목록 요청
      socket.emit("get_existing_producers", { roomId: roomId.trim() });

      // 4. 미디어 송신 시작 (방금 함수 내에서 가져온 stream 변수 사용)
      if (stream) {
        await startProducing(stream);
      } else {
        console.warn(
          "⚠️ startProducing skipped because localStream is not available."
        );
      }

      clearError();
      console.log("✅ Successfully joined room and started producing");
    } catch (err: unknown) {
      console.error("❌ Failed to join room:", err);
      setError(err instanceof Error ? err.message : "룸 참가에 실패했습니다.");
      handleLeaveRoom();
    }
  }, [
    roomId,
    socket,
    joinRoom,
    initializeDevice,
    initializeLocalMedia,
    createProducerTransport,
    createConsumerTransport,
    startProducing,
    setError,
    clearError,
    handleLeaveRoom,
  ]);

  useEffect(() => {
    if (!socket) return;
    console.log("🔌 Setting up SFU socket events");
    socket.on("joined_room", (data: { existingProducers?: ProducerInfo[] }) => {
      console.log("✅ Successfully joined room:", data);
      setIsInRoom(true);
      if (data.existingProducers)
        consumeExistingProducers(data.existingProducers);
    });
    socket.on(
      "existing_producers_list",
      (data: { existingProducers: ProducerInfo[] }) => {
        console.log(
          "📥 Received existing producers list for manual consume:",
          data.existingProducers
        );
        if (
          data.existingProducers.length > 0 &&
          !isProcessingExistingProducers
        ) {
          consumeExistingProducers(data.existingProducers);
        }
      }
    );
    socket.on("existing_peers", (data: { peers: string[] }) => {
      console.log("👥 Existing peers:", data.peers);
      handleAllUsers(data.peers.map((id) => ({ id, email: "unknown" })));
    });
    socket.on("user_joined", (data: { id: string }) => {
      console.log("👋 User joined:", data);
      handleUserJoined({ id: data.id, email: "unknown" });
    });
    socket.on("user_left", (data: { id: string }) => {
      console.log("👋 User left:", data);
      handleUserExit({ id: data.id });
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.id);
        return newMap;
      });
    });
    socket.on("new_producer", async (data: ProducerInfo) => {
      console.log("🎬 New producer available:", data);
      if (deviceLoaded && data.producerSocketId !== socket.id) {
        try {
          if (processedProducersRef.current.has(data.producerId)) return;
          const consumer = await consume(data.producerId, roomId);
          if (consumer) {
            handleRemoteStream(consumer, data.producerSocketId);
            processedProducersRef.current.add(data.producerId);
          }
        } catch (err: unknown) {
          console.error("❌ Failed to consume new producer:", err);
          setError(
            `새로운 비디오/오디오 스트림 처리 실패: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        }
      }
    });
    socket.on("error", (data: { message: string }) => {
      console.error("❌ Server error:", data);
      setError(data.message);
    });
    return () => {
      socket.off("joined_room");
      socket.off("existing_producers_list");
      socket.off("existing_peers");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("new_producer");
      socket.off("error");
    };
  }, [
    socket,
    deviceLoaded,
    roomId,
    consume,
    handleAllUsers,
    handleUserJoined,
    handleUserExit,
    setIsInRoom,
    setError,
    handleRemoteStream,
    consumeExistingProducers,
    isProcessingExistingProducers,
  ]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="p-4 text-center text-3xl font-bold bg-gray-800 shadow-md border-b border-gray-700">
        🎥 WebRTC SFU Video Call:{" "}
        <span className="text-blue-400">{roomId || initialRoomId}</span>
      </header>
      <main className="flex flex-col md:flex-row flex-grow overflow-hidden">
        <div className="w-full md:w-1/4 p-4 bg-gray-800 space-y-6 flex flex-col border-r border-gray-700 overflow-y-auto">
          <ControlPanel
            roomId={roomId}
            setRoomId={setRoomId}
            isInRoom={isInRoom}
            isConnected={isConnected}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleLeaveRoom}
          />
          <StatusDisplay
            isConnected={isConnected}
            connectionState={connectionState}
            users={users}
            isInRoom={isInRoom}
            error={error}
          />
          <div className="bg-gray-700 p-4 rounded-lg shadow-inner space-y-2 text-sm">
            {/* 디버그 정보 UI ... */}
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center bg-gray-900">
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            users={users}
          />
        </div>
      </main>
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-600 text-white rounded-lg shadow-xl">
          <span className="font-bold">❌ 에러:</span> {error}
          <button
            onClick={clearError}
            className="ml-4 text-white hover:text-gray-200 font-bold"
          >
            [닫기]
          </button>
        </div>
      )}
    </div>
  );
};

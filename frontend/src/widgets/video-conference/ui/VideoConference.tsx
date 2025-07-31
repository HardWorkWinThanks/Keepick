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
import { BottomControls } from "./BottomControls";
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

  const [isStaticGestureOn, setStaticGestureOn] = useState(true);
  const [isDynamicGestureOn, setDynamicGestureOn] = useState(true);

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
  const [isCameraOn, setCameraOn] = useState(true);
  const [isMicOn, setMicOn] = useState(true);
  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleMicrophone = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  }, [localStream]);

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

      console.log(
        "🔍 Starting to consume existing producers SEQUENTIALLY:",
        existingProducers
      );
      setIsProcessingExistingProducers(true);

      try {
        // 🔥 Promise.all 대신 for...of 루프와 await를 사용하여 순차적으로 처리합니다.
        for (const producerInfo of existingProducers) {
          if (
            socket?.id === producerInfo.producerSocketId ||
            processedProducersRef.current.has(producerInfo.producerId)
          ) {
            continue;
          }

          try {
            const consumer = await consume(producerInfo.producerId, roomId);
            if (consumer) {
              handleRemoteStream(consumer, producerInfo.producerSocketId);
              processedProducersRef.current.add(producerInfo.producerId);
            }
          } catch (err) {
            // 이 catch는 개별 producer 소비 실패를 처리합니다.
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
    setCameraOn(true);
    setMicOn(true);
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

      const { rtpCapabilities, existingProducers } = await joinRoom(
        roomId.trim()
      );

      setIsInRoom(true); // 방에 성공적으로 참여했음을 표시

      await initializeDevice(rtpCapabilities);

      console.log("1️⃣ 로컬 미디어 초기화 시작");
      const stream = await initializeLocalMedia();
      console.log("2️⃣ 로컬 미디어 초기화 성공. stream:", stream);

      setLocalStream(stream);

      console.log("3️⃣ 프로듀서 트랜스포트 생성 시작");
      await createProducerTransport(roomId.trim());
      console.log("4️⃣ 프로듀서 트랜스포트 생성 성공"); // 🚨 아마 이 로그는 안 찍힐 겁니다.

      console.log("5️⃣ 컨슈머 트랜스포트 생성 시작");
      await createConsumerTransport(roomId.trim());
      console.log("6️⃣ 컨슈머 트랜스포트 생성 성공");

      if (stream) {
        await startProducing(stream);
      }

      // 4. 모든 설정이 끝난 후, 받아온 기존 producer 목록을 처리합니다.
      if (existingProducers && existingProducers.length > 0) {
        console.log("➡️ Consuming existing producers after setup.");
        await consumeExistingProducers(existingProducers);
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
    consumeExistingProducers,
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
    // socket.on("joined_room", (data: { existingProducers?: ProducerInfo[] }) => {
    //   console.log("✅ Successfully joined room:", data);
    //   setIsInRoom(true);
    //   if (data.existingProducers)
    //     consumeExistingProducers(data.existingProducers);
    // });
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
      {/* ▼▼▼▼▼ 수정된 부분 ▼▼▼▼▼ */}
      <header className="p-4 text-center text-xl md:text-2xl font-semibold bg-gray-800 shadow-lg border-b border-gray-700 z-10 flex-shrink-0">
        ✨{" "}
        <span className="font-bold text-blue-400">
          {roomId || initialRoomId}
        </span>{" "}
        그룹챗에 오신 것을 환영합니다! ✨
      </header>
      {/* ▲▲▲▲▲ 수정 완료 ▲▲▲▲▲ */}

      <main className="flex flex-col md:flex-row flex-grow overflow-hidden">
        {/* === 사이드바 === */}
        <div className="w-full md:w-80 p-4 bg-gray-800/80 space-y-4 md:space-y-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <ControlPanel
            roomId={roomId}
            setRoomId={setRoomId}
            isInRoom={isInRoom}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleLeaveRoom}
            // ▼▼▼▼▼ 상태와 핸들러를 props로 전달 ▼▼▼▼▼
            isStaticGestureOn={isStaticGestureOn}
            setStaticGestureOn={setStaticGestureOn}
            isDynamicGestureOn={isDynamicGestureOn}
            setDynamicGestureOn={setDynamicGestureOn}
            // ▲▲▲▲▲ 전달 완료 ▲▲▲▲▲
          />
          <StatusDisplay
            isConnected={isConnected}
            connectionState={connectionState}
            users={users}
            isInRoom={isInRoom}
            error={error}
          />
        </div>

        {/* === 메인 비디오 그리드 === */}
        <div className="flex flex-col flex-grow">
          <div className="flex-grow flex items-center justify-center p-2 md:p-4 bg-gray-900 overflow-hidden"></div>
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            users={users}
            // ▼▼▼▼▼ 상태를 props로 전달 ▼▼▼▼▼
            isStaticGestureOn={isStaticGestureOn}
            isDynamicGestureOn={isDynamicGestureOn}
            // ▲▲▲▲▲ 전달 완료 ▲▲▲▲▲
          />
          <div className="flex-shrink-0">
            <BottomControls
              onLeaveRoom={handleLeaveRoom}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              onToggleCamera={toggleCamera}
              onToggleMicrophone={toggleMicrophone}
            />
          </div>
        </div>
      </main>

      {/* 에러 팝업 (기존과 동일) */}
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

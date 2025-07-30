// src/widgets/video-conference/ui/VideoConference.tsx
"use client"; // Next.js App Router에서 클라이언트 컴포넌트로 명시

import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

// FSD 구조에 맞게 임포트 경로 변경
import { useSocket } from "@/shared/api/socket/useSocket";
import { useMediasoup } from "../lib/useMediaSoup"; // widgets/video-conference/lib
import { useVideoSession } from "../model/useVideoSession"; // widgets/video-conference/model
import { VideoGrid } from "./VideoGrid"; // widgets/video-conference/ui
import { ControlPanel } from "./ControlPanel"; // widgets/video-conference/ui
import { StatusDisplay } from "./StatusDisplay"; // widgets/video-conference/ui

// Props 타입 정의
interface VideoConferenceProps {
  initialRoomId: string;
}

export const VideoConference: React.FC<VideoConferenceProps> = ({
  initialRoomId,
}) => {
  // 1. 상태 및 훅 초기화 (기존 App.tsx의 useAppState 부분)
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
    setConnectionState, // 필요하면 사용
    setError,
    handleConnect,
    handleDisconnect,
    handleAllUsers,
    handleUserJoined,
    handleUserExit,
    handleRoomFull, // 이 예시에서는 사용 안 함
    handleError,
    clearError,
  } = sessionState;

  // initialRoomId를 useVideoSession의 roomId 상태에 설정
  useEffect(() => {
    if (initialRoomId && initialRoomId !== roomId) {
      setRoomId(initialRoomId);
      clearError(); // 새 룸 ID가 들어오면 에러 초기화
    }
  }, [initialRoomId, setRoomId, roomId, clearError]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  // 🔥 원격 비디오 스트림 상태 관리: producerSocketId를 키로 MediaStream을 매핑
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );

  // 🔥 중복 처리 방지를 위한 상태
  const [isProcessingExistingProducers, setIsProcessingExistingProducers] =
    useState(false);
  const processedProducersRef = useRef<Set<string>>(new Set()); // 처리된 producer.id를 저장

  // 2. Socket 콜백 및 Mediasoup 훅 초기화
  const socketCallbacks = useMemo(
    () => ({
      onConnect: () => {
        console.log("🔥 Socket connected - updating app state");
        handleConnect();
      },
      onDisconnect: () => {
        console.log("🔥 Socket disconnected - updating app state");
        handleDisconnect();
        // 소켓 연결 끊어지면 UI 관련 상태도 초기화
        setIsInRoom(false);
        setRemoteStreams(new Map());
        processedProducersRef.current.clear();
        setIsProcessingExistingProducers(false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      },
      onConnectError: (err: any) => {
        // 'error' is of type 'unknown' 해결
        console.error("🔥 Socket connection error - updating app state:", err);
        handleError({ message: `Connection error: ${err.message}` });
      },
    }),
    [handleConnect, handleDisconnect, handleError, setIsInRoom]
  );

  const { socket, joinRoom, leaveRoom } = useSocket(socketCallbacks);
  const {
    deviceLoaded,
    isProducing, // 현재 미디어를 produce 중인지 여부
    initializeDevice,
    createProducerTransport,
    createConsumerTransport,
    startProducing,
    consume,
    initializeLocalMedia,
    cleanup, // Mediasoup 관련 리소스 정리
    // localStreamRef, // useVideoSession에서 관리하지 않고 여기서 직접 localVideoRef에 바인딩
    // consumersRef, // 내부적으로 사용되므로 외부 노출 불필요
  } = useMediasoup(socket);

  // 🔥 원격 스트림 처리 함수 (consumer로부터 받은 트랙을 MediaStream에 추가)
  const handleRemoteStream = useCallback(
    (consumer: any, producerSocketId: string) => {
      try {
        const track = consumer.track;
        if (track) {
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            let stream = newMap.get(producerSocketId);

            // 해당 producerSocketId의 스트림이 없으면 새로 생성
            if (!stream) {
              stream = new MediaStream();
              newMap.set(producerSocketId, stream);
            }

            // 같은 종류의 기존 트랙 제거 (중복 방지 및 교체)
            // 예를 들어, 비디오 트랙이 이미 있는데 새로운 비디오 트랙이 오면 기존 것을 제거
            const existingTracks = stream
              .getTracks()
              .filter((t) => t.kind === track.kind);
            existingTracks.forEach((t) => stream!.removeTrack(t));

            // 새 트랙 추가
            stream.addTrack(track);
            console.log(
              `✅ Remote ${consumer.kind} stream updated/added for peer ${producerSocketId}`
            );
            return newMap;
          });
        }
      } catch (error: any) {
        // 'error' is of type 'unknown' 해결
        console.error("❌ Failed to handle remote stream:", error);
      }
    },
    []
  );

  // 🔥 기존 Producer들을 consume하는 함수 (중복 방지 강화)
  const consumeExistingProducers = useCallback(
    async (existingProducers: any[]) => {
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
            // 🔥 이미 처리된 Producer는 건너뛰기
            if (processedProducersRef.current.has(producerInfo.producerId)) {
              console.log(
                `⏭️ Producer ${producerInfo.producerId} already processed, skipping`
              );
              continue;
            }

            console.log(
              `🔄 Attempting to consume ${producerInfo.kind} producer ${producerInfo.producerId} from ${producerInfo.producerSocketId}`
            );

            // 자기 자신이 produce한 미디어는 consume하지 않음
            if (socket?.id === producerInfo.producerSocketId) {
              console.log(
                `Skipping self-produced media: ${producerInfo.producerId}`
              );
              processedProducersRef.current.add(producerInfo.producerId); // 자기 것도 처리된 것으로 마크
              continue;
            }

            const consumer = await consume(producerInfo.producerId, roomId);

            if (consumer) {
              console.log(
                `✅ Consumer created for ${consumer.kind} from ${consumer.producerSocketId}`
              );
              handleRemoteStream(consumer, producerInfo.producerSocketId);
              // 🔥 성공적으로 처리된 Producer 기록
              processedProducersRef.current.add(producerInfo.producerId);
            }
          } catch (error: any) {
            // 'error' is of type 'unknown' 해결
            console.error(
              `❌ Failed to consume existing producer ${producerInfo.producerId}:`,
              error
            );
            // 특정 Producer 실패해도 다른 Producer 계속 시도
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

  // 룸 나가기 핸들러 (handleJoinRoom보다 먼저 선언)
  // 'Block-scoped variable 'handleLeaveRoom' used before its declaration' 해결
  const handleLeaveRoom = useCallback(() => {
    console.log("👋 Leaving room");
    leaveRoom(); // 소켓 이벤트를 통해 서버에 퇴장 알림
    setIsInRoom(false);
    cleanup(); // Mediasoup 관련 모든 리소스 정리 (Producer, Consumer, Transport 등)

    // 🔥 상태 초기화: UI 관련 상태도 함께 정리
    processedProducersRef.current.clear();
    setIsProcessingExistingProducers(false);
    setRemoteStreams(new Map());

    // 로컬 비디오 정리
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    clearError(); // 에러 메시지 초기화
  }, [leaveRoom, setIsInRoom, cleanup, clearError]);

  // 룸 참가 핸들러
  const handleJoinRoom = useCallback(async () => {
    if (!roomId.trim()) {
      setError("룸 이름을 입력해주세요.");
      return;
    }
    if (!socket?.connected) {
      setError("서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      console.log(`🚪 Attempting to join room: ${roomId.trim()}`);
      // 🔥 상태 초기화: 새로운 룸에 들어갈 때 이전 룸의 상태를 클리어
      processedProducersRef.current.clear();
      setIsProcessingExistingProducers(false);
      setRemoteStreams(new Map());

      // 1. RTP Capabilities 가져오고 룸 참가
      // joinRoom 훅이 서버에서 RTP Capabilities를 가져와서 'join_room' 소켓 이벤트를 발생시킴
      const rtpCapabilities = await joinRoom(roomId.trim());
      if (!rtpCapabilities) {
        throw new Error("Failed to get RTP capabilities from server.");
      }

      // 2. Device 초기화 (Mediasoup Device 로드)
      await initializeDevice(rtpCapabilities);

      // 3. 로컬 미디어 초기화 (카메라/마이크 접근 요청 및 스트림 생성)
      const localStream = await initializeLocalMedia();

      // 4. 로컬 비디오 엘리먼트에 스트림 바인딩
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        console.log("✅ Local video stream set");
      }

      // 5. Producer Transport 생성 (클라이언트 -> 서버로 미디어 전송)
      await createProducerTransport(roomId.trim());

      // 6. Consumer Transport 생성 (서버 -> 클라이언트로 미디어 수신)
      await createConsumerTransport(roomId.trim());

      // 🔥 7. Transport 생성 완료 후 서버에 기존 Producer 목록 수동 요청
      // 이 요청에 대한 응답은 'existing_producers_list' 소켓 이벤트로 수신됨
      console.log("🔧 Requesting existing producers after transport setup");
      socket.emit("get_existing_producers", { roomId: roomId.trim() });

      // 8. 로컬 미디어 송신 시작 (Producer 생성 및 미디어 전송)
      await startProducing(localStream);

      clearError(); // 모든 과정 성공 시 에러 메시지 제거
      console.log("✅ Successfully joined room and started producing");
    } catch (error: any) {
      // 'error' is of type 'unknown' 해결
      console.error("❌ Failed to join room:", error);
      setError(
        error.message ||
          "룸 참가에 실패했습니다. 마이크/카메라 접근 권한을 확인해주세요."
      );
      // 에러 발생 시 모든 리소스 정리 (부분적으로만 성공했을 경우 대비)
      handleLeaveRoom(); // Room Leave 로직과 동일하게 리소스 정리
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
    handleLeaveRoom, // 의존성에 추가: 순환 참조를 React가 처리하도록
  ]);

  // 3. SFU 소켓 이벤트 핸들러들
  useEffect(() => {
    if (!socket) return;
    console.log("🔌 Setting up SFU socket events");

    // 룸 참가 완료 (서버에서 이벤트를 받았을 때)
    socket.on(
      "joined_room",
      async (data: {
        roomId: string;
        peersCount: number;
        existingProducers?: any[]; // SFU 방식에서는 서버가 기존 producer 정보를 줌
      }) => {
        console.log("✅ Successfully joined room:", data);
        setIsInRoom(true);
        // 서버에서 초기 existingProducers를 주면 바로 처리 (없으면 다른 이벤트를 기다림)
        if (data.existingProducers && data.existingProducers.length > 0) {
          console.log(
            "Immediately consuming existing producers from joined_room event."
          );
          await consumeExistingProducers(data.existingProducers);
        }
      }
    );

    // 🔥 수동 요청 (get_existing_producers)으로 받은 기존 Producer 목록 처리
    socket.on(
      "existing_producers_list",
      async (data: { existingProducers: any[] }) => {
        console.log(
          "📥 Received existing producers list for manual consume:",
          data.existingProducers
        );
        if (
          data.existingProducers.length > 0 &&
          !isProcessingExistingProducers
        ) {
          console.log("🔧 Processing existing producers after transport setup");
          await consumeExistingProducers(data.existingProducers);
        } else {
          console.log(
            "⏭️ Skipping existing producers (already processing or empty)"
          );
        }
      }
    );

    // 기존 사용자 목록 (이벤트 발생 시점에는 이미 joined_room으로 들어온 peersCount가 있을 수 있음)
    // SFU 방식에서는 peer 목록보다 producer 목록이 더 중요할 수 있음
    socket.on("existing_peers", (data: { peers: string[] }) => {
      console.log("👥 Existing peers:", data.peers);
      // 이 예시에서는 User 타입에 email이 없으므로 임의로 "unknown"으로 설정
      handleAllUsers(data.peers.map((id) => ({ id, email: "unknown" })));
    });

    // 새 사용자 참가
    socket.on("user_joined", (data: { id: string; peersCount: number }) => {
      console.log("👋 User joined:", data);
      handleUserJoined({ id: data.id, email: "unknown" });
    });

    // 사용자 퇴장
    socket.on("user_left", (data: { id: string; peersCount: number }) => {
      console.log("👋 User left:", data);
      handleUserExit({ id: data.id });
      // 해당 사용자의 스트림 제거
      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.id); // user id (socket id)로 스트림 삭제
        return newMap;
      });
      // 🔥 처리된 Producer 목록에서도 해당 사용자가 남긴 Producer들을 제거 (선택 사항, 복잡성 증가)
      // 여기서는 `processedProducersRef`는 그대로 두거나,
      // 특정 user.id에 해당하는 producer.id들을 찾아 제거하는 로직이 필요.
      // 현재는 단순히 user가 나갔으니 해당 user의 스트림만 제거하는 것으로 충분하다고 판단.
    });

    // 🔥 새 Producer 생성 알림 (새로 produce되는 미디어)
    socket.on(
      "new_producer",
      async (data: {
        producerId: string;
        producerSocketId: string;
        kind: string;
      }) => {
        console.log("🎬 New producer available:", data);
        // deviceLoaded 상태 확인 및 자기 자신의 producer는 consume하지 않음
        if (deviceLoaded && data.producerSocketId !== socket.id) {
          try {
            // 🔥 새 Producer도 중복 체크
            if (processedProducersRef.current.has(data.producerId)) {
              console.log(
                `⏭️ New producer ${data.producerId} already processed, skipping`
              );
              return;
            }

            const consumer = await consume(data.producerId, roomId);
            if (consumer) {
              console.log(
                `✅ Consumer created for ${data.kind} from ${data.producerSocketId}`
              );
              handleRemoteStream(consumer, data.producerSocketId);
              // 🔥 새 Producer도 처리 목록에 추가
              processedProducersRef.current.add(data.producerId);
            }
          } catch (error: any) {
            // 'error' is of type 'unknown' 해결
            console.error("❌ Failed to consume new producer:", error);
            setError(`새로운 비디오/오디오 스트림 처리 실패: ${error.message}`);
          }
        }
      }
    );

    // 에러 처리
    socket.on("error", (data: { message: string }) => {
      console.error("❌ Server error:", data);
      setError(data.message);
    });

    // 컴포넌트 언마운트 시 소켓 이벤트 리스너 정리
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
    // sessionState.setRoomId, // useEffect 의존성에서 제거 (initialRoomId useEffect에서 처리)
  ]); // handleLeaveRoom은 직접적인 의존성으로 추가할 필요 없음 (useCallback이 이미 처리)

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* 헤더 */}
      <header className="p-4 text-center text-3xl font-bold bg-gray-800 shadow-md border-b border-gray-700">
        🎥 WebRTC SFU Video Call:{" "}
        <span className="text-blue-400">{roomId || initialRoomId}</span>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex flex-col md:flex-row flex-grow overflow-hidden">
        {/* 사이드바 (컨트롤 패널 및 상태 표시) */}
        <div className="w-full md:w-1/4 p-4 bg-gray-800 space-y-6 flex flex-col border-r border-gray-700 overflow-y-auto">
          {/* 컨트롤 패널 */}
          <ControlPanel
            roomId={roomId}
            setRoomId={setRoomId}
            isInRoom={isInRoom}
            isConnected={isConnected}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* 상태 표시 */}
          <StatusDisplay
            isConnected={isConnected}
            connectionState={connectionState}
            users={users}
            isInRoom={isInRoom}
            error={error}
          />

          {/* 디버그 정보 및 버튼 */}
          <div className="bg-gray-700 p-4 rounded-lg shadow-inner space-y-2 text-sm">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              📊 디버그 정보
            </h3>
            <p>
              ✅ 소켓 연결됨:{" "}
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "예" : "아니오"}
              </span>
            </p>
            <p>
              ✅ Mediasoup 디바이스 로드됨:{" "}
              <span
                className={deviceLoaded ? "text-green-400" : "text-red-400"}
              >
                {deviceLoaded ? "예" : "아니오"}
              </span>
            </p>
            <p>
              🎬 미디어 생산 중:{" "}
              <span className={isProducing ? "text-green-400" : "text-red-400"}>
                {isProducing ? "예" : "아니오"}
              </span>
            </p>
            <p>
              🚪 룸 참가 중:{" "}
              <span className={isInRoom ? "text-green-400" : "text-red-400"}>
                {isInRoom ? "예" : "아니오"}
              </span>
            </p>
            <p>
              👥 현재 참가자 수:{" "}
              <span className="font-bold">
                {users.length + (isInRoom ? 1 : 0)}명
              </span>
            </p>
            <p>
              📺 활성 원격 스트림:{" "}
              <span className="font-bold">{remoteStreams.size}개</span>
            </p>
            <p>
              🔄 기존 Producer 처리 중:{" "}
              <span
                className={
                  isProcessingExistingProducers
                    ? "text-yellow-400"
                    : "text-gray-400"
                }
              >
                {isProcessingExistingProducers ? "예" : "아니오"}
              </span>
            </p>
            <p>
              📋 처리된 Producer 수:{" "}
              <span className="font-bold">
                {processedProducersRef.current.size}개
              </span>
            </p>

            <div className="flex flex-col space-y-2 mt-4">
              <button
                onClick={() => {
                  console.log("📊 Current State:");
                  console.log("Socket connected:", socket?.connected);
                  console.log("Device loaded:", deviceLoaded);
                  console.log("Is producing:", isProducing);
                  console.log("Is in room:", isInRoom);
                  console.log("Users count:", users.length);
                  console.log("Remote streams:", remoteStreams.size);
                  console.log(
                    "Processing existing producers:",
                    isProcessingExistingProducers
                  );
                  console.log(
                    "Processed producers (IDs):",
                    Array.from(processedProducersRef.current)
                  );
                  remoteStreams.forEach((stream, peerId) => {
                    console.log(`Stream for ${peerId}:`, {
                      tracks: stream.getTracks().length,
                      video: stream.getVideoTracks().length,
                      audio: stream.getAudioTracks().length,
                      active: stream.active,
                    });
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
              >
                📊 상태 로그 출력
              </button>
              {isInRoom && (
                <button
                  onClick={() => {
                    console.log("🔧 Manual retry existing producers");
                    if (socket && !isProcessingExistingProducers) {
                      socket.emit("get_existing_producers", { roomId });
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors font-medium"
                >
                  🔧 기존 스트림 다시 가져오기
                </button>
              )}
              <button
                onClick={() => {
                  console.log("🧹 Clearing processed producers ref");
                  processedProducersRef.current.clear();
                  setIsProcessingExistingProducers(false);
                  setRemoteStreams(new Map()); // 원격 스트림도 비디오 초기화
                  console.log("Refreshed state. Try joining or retry consume.");
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
              >
                🧹 상태 초기화 (디버그용)
              </button>
            </div>
          </div>
        </div>

        {/* 비디오 그리드 영역 */}
        <div className="flex-grow flex items-center justify-center bg-gray-900">
          <VideoGrid
            localVideoRef={localVideoRef}
            remoteStreams={remoteStreams}
            users={users} // users는 appState에서 가져온 현재 룸 참가자 목록
          />
        </div>
      </main>

      {/* 에러 메시지 오버레이 */}
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-600 text-white rounded-lg shadow-xl animate-bounce-in">
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

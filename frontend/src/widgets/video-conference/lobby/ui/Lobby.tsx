// src/widgets/video-conference/lobby/ui/Lobby.tsx

"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  StarIcon,
  SparklesIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/shadcn/button";
import { useAppDispatch, useAppSelector } from "@/shared/config/hooks";
import { toggleCamera, toggleMic } from "@/entities/video-conference/media/model/slice";
import {
  setAiEnabled,
  toggleStaticGestureDetection,
  toggleDynamicGestureDetection,
  toggleEmotionDetection,
  toggleBeautyFilter,
} from "@/entities/video-conference/ai/model/aiSlice";
import { frontendAiProcessor } from "@/shared/api/ai"; // frontendAiProcessor는 계속 사용됩니다.
import { motion, AnimatePresence } from "framer-motion";
import { AiTestDisplay } from "./AiTestDisplay";

// 타입 정의 (shared/types/ai.types.ts 또는 별도 유틸 파일에서 임포트)
import {
  GestureResult, // AIProcessor에서 직접 받는 원본 결과
  EmotionResult, // AIProcessor에서 직접 받는 원본 결과
  AiTestResult, // AiTestDisplay용 결과 타입
} from "@/shared/types/ai.types"; // 경로 확인 및 필요시 조정


interface LobbyProps {
  onJoin: (userName: string) => void;
  isLoading: boolean;
  error: string | null;
}

interface MediaPermissions {
  camera: boolean;
  microphone: boolean;
}

const DynamicAiTestDisplay = dynamic(
  () =>
    import("@/widgets/video-conference/lobby/ui/AiTestDisplay").then((mod) => mod.AiTestDisplay),
  {
    ssr: false, // 서버 사이드 렌더링을 비활성화
  }
);

export const Lobby = ({ onJoin, isLoading, error }: LobbyProps) => {
  const dispatch = useAppDispatch();
  const { isCameraOn, isMicOn } = useAppSelector((state) => state.re_media);
  const aiState = useAppSelector((state) => state.ai); // AI 상태 가져오기

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [aiProcessedStream, setAiProcessedStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: false,
    microphone: false,
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAiPreviewOpen, setIsAiPreviewOpen] = useState(true); // AI 프리뷰 UI의 열림/닫힘 상태 (기본 활성화)

  // 실시간 AI 결과 상태
  const [realtimeGestureResults, setRealtimeGestureResults] = useState<AiTestResult[]>([]);
  const [realtimeEmotionResults, setRealtimeEmotionResults] = useState<AiTestResult[]>([]);
  
  // 랜드마크 데이터를 포함한 원본 결과 상태 추가
  const [latestGestureWithLandmarks, setLatestGestureWithLandmarks] = useState<GestureResult | null>(null);
  const [latestEmotionWithLandmarks, setLatestEmotionWithLandmarks] = useState<EmotionResult | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(false); // 랜드마크 표시 상태

  const videoRef = useRef<HTMLVideoElement>(null);
  const aiVideoRef = useRef<HTMLVideoElement>(null); // AI 처리된 비디오를 보여줄 ref
  const [userName, setUserName] = useState("");

  // AI 결과 콜백 함수들
  const handleGestureResult = useCallback((result: GestureResult) => {
    // 랜드마크 데이터를 포함한 원본 결과 저장
    setLatestGestureWithLandmarks(result);
    
    const staticResult: AiTestResult = {
      type: "gesture",
      label: result.static.label,
      confidence: result.static.confidence,
      timestamp: result.timestamp,
    };
    const dynamicResult: AiTestResult = {
      type: "gesture", 
      label: result.dynamic.label,
      confidence: result.dynamic.confidence,
      timestamp: result.timestamp,
    };
    
    setRealtimeGestureResults(prev => {
      const newResults = [...prev];
      if (result.static.label !== "none" && result.static.confidence > 0.7) {
        newResults.push(staticResult);
      }
      if (result.dynamic.label !== "none" && result.dynamic.confidence > 0.8) {
        newResults.push(dynamicResult);
      }
      // Keep only last 10 results
      return newResults.slice(-10);
    });
  }, []);

  const handleEmotionResult = useCallback((result: EmotionResult) => {
    // 랜드마크 데이터를 포함한 원본 결과 저장
    setLatestEmotionWithLandmarks(result);
    
    if (result.label !== "none" && result.confidence > 0.6) {
      const emotionResult: AiTestResult = {
        type: "emotion",
        label: result.label,
        confidence: result.confidence,
        timestamp: result.timestamp,
      };
      
      setRealtimeEmotionResults(prev => {
        const newResults = [...prev, emotionResult];
        // Keep only last 10 results
        return newResults.slice(-10);
      });
    }
  }, []);

  // AI 프리뷰 토글 함수
  const handleAiPreviewToggle = async () => {
    if (!localStream) {
      console.warn("로컬 스트림이 없습니다. AI 프리뷰를 토글할 수 없습니다.");
      return;
    }

    try {
      if (!aiState.isAiEnabled) {
        // AI 기능이 현재 비활성화 상태이면 활성화
        dispatch(setAiEnabled(true)); // Redux에 AI 상태를 활성화로 설정

        // AI 프로세서에 콜백 설정 (Lobby에서 직접 설정하지 않고,
        // AIProcessorInitializer.tsx에서 설정된 콜백이 Redux에 저장하도록 동작한다고 가정)
        // 여기서는 Lobby의 AI 프리뷰에 직접 연결하는 로직
        // AIProcessorInitializer.tsx에서 콜백을 설정했다면, 이 부분은 제거될 수 있습니다.
        // 현재는 AiTestDisplay가 Redux 상태를 구독하므로, 이곳에서 직접 콜백 설정은 불필요합니다.
        // 하지만 만약 AI 프리뷰가 Redux와 독립적으로 동작해야 한다면 이 로직이 필요합니다.
        // 여기서는 편의상 주석처리하고 AiTestDisplay가 aiState를 구독하는 방식으로 진행합니다.

        // AI 콜백 설정 (로비용 실시간 결과 콜백)
        frontendAiProcessor.setGestureCallback(handleGestureResult);
        frontendAiProcessor.setEmotionCallback(handleEmotionResult);

        // AI 설정 업데이트 (프리뷰 활성화 시 현재 AI 상태에 따라 AI 프로세서 설정)
        // isAiEnabled 상태에 따라 frontendAiProcessor의 config를 업데이트
        await frontendAiProcessor.updateConfig({
          gesture: {
            static: { enabled: aiState.isStaticGestureDetectionEnabled, confidence: 0.7 },
            dynamic: { enabled: aiState.isDynamicGestureDetectionEnabled, confidence: 0.7 },
          },
          emotion: { enabled: aiState.isEmotionDetectionEnabled, confidence: 0.5 },
          beauty: { enabled: aiState.isBeautyFilterEnabled },
        });

        // AI 처리된 비디오 트랙 생성 및 스트림 설정
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          const processedTrack = await frontendAiProcessor.processVideoTrack(videoTrack);
          const processedStream = new MediaStream([processedTrack]);
          setAiProcessedStream(processedStream); // AI 처리된 스트림을 상태에 저장

          if (aiVideoRef.current) {
            aiVideoRef.current.srcObject = processedStream; // AI 처리된 비디오를 비디오 요소에 연결
          }
        }
        setIsAiPreviewOpen(true); // AI 미리보기 UI 상태 활성화
      } else {
        // AI 기능이 현재 활성화 상태이면 비활성화
        dispatch(setAiEnabled(false)); // Redux에 AI 상태를 비활성화로 설정
        setAiProcessedStream(null); // AI 처리 스트림 제거 (비디오 렌더링 중지)
        // AI 프로세서 클린업은 AIProcessorInitializer.tsx의 언마운트 시 처리됩니다.
        setIsAiPreviewOpen(false); // AI 미리보기 UI 상태 비활성화
      }

      // setIsAiPreviewOpen(!isAiPreviewOpen); // AI 미리보기 UI 상태 토글 (위에서 이미 설정되므로 제거)
    } catch (error) {
      console.error("AI 프리뷰 토글 오류:", error);
      setMediaError("AI 기능을 시작할 수 없습니다."); // 사용자에게 에러 메시지 표시
      dispatch(setAiEnabled(false)); // 오류 발생 시 AI 기능 비활성화
      setAiProcessedStream(null); // 오류 발생 시 AI 스트림 제거
      setIsAiPreviewOpen(false); // 오류 발생 시 프리뷰 닫기
    }
  };

  // 권한 확인 함수
  const checkPermissions = async (): Promise<MediaPermissions> => {
    const result: MediaPermissions = { camera: false, microphone: false };
    try {
      const cameraPermission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      const microphonePermission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      result.camera = cameraPermission.state === "granted";
      result.microphone = microphonePermission.state === "granted";
    } catch (err) {
      console.log("권한 확인 API를 지원하지 않는 브라우저입니다.");
    }
    return result;
  };

  // 미디어 장치 초기화 (Lobby 컴포넌트 마운트 시 한 번만 실행)
  useEffect(() => {
    const initializeMedia = async () => {
      setIsInitializing(true);
      setMediaError(null);
      try {
        const perms = await checkPermissions();
        setPermissions(perms);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        setLocalStream(stream);
        setPermissions({ camera: true, microphone: true });

        // 원본 비디오에 스트림 설정
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = isCameraOn;
        }
        if (audioTrack) {
          audioTrack.enabled = isMicOn;
        }
      } catch (err: any) {
        console.error("미디어 장치 접근 오류:", err);
        if (err.name === "NotAllowedError") {
          setMediaError(
            "카메라와 마이크 사용 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요."
          );
        } else if (err.name === "NotFoundError") {
          setMediaError(
            "카메라 또는 마이크를 찾을 수 없습니다. 장치가 연결되어 있는지 확인해주세요."
          );
        } else if (err.name === "NotReadableError") {
          setMediaError(
            "다른 애플리케이션에서 카메라를 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요."
          );
        } else {
          setMediaError(`미디어 장치 오류: ${err.message || "알 수 없는 오류"}`);
        }
      } finally {
        setIsInitializing(false);
      }
    };
    initializeMedia();

    // 컴포넌트 언마운트 시 미디어 트랙 중지 및 스트림 해제
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (aiProcessedStream) {
        aiProcessedStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      // AI cleanup은 ConferenceClientPage 언마운트 시 처리됩니다.
      // aiState.isAiEnabled 상태는 Redux에서 관리하므로 여기서 직접 cleanup을 호출하지 않습니다.
    };
  }, []); // 의존성 배열을 비워 컴포넌트 마운트 시 한 번만 실행되도록 합니다.

  // aiState.isAiEnabled 또는 isAiPreviewOpen 상태가 변경될 때마다 frontendAiProcessor의 설정 업데이트
  // 이 useEffect는 AI 설정 토글 버튼이 아닌, 개별 AI 기능(정적/동적 제스처, 감정 감지, 뷰티 필터) 버튼 클릭 시
  // frontendAiProcessor에 변경된 설정을 즉시 적용하기 위함입니다.
  useEffect(() => {
    if (aiState.isAiEnabled && isAiPreviewOpen && localStream?.getVideoTracks()[0]) {
      frontendAiProcessor
        .updateConfig({
          gesture: {
            static: { enabled: aiState.isStaticGestureDetectionEnabled, confidence: 0.7 },
            dynamic: { enabled: aiState.isDynamicGestureDetectionEnabled, confidence: 0.7 },
          },
          emotion: { enabled: aiState.isEmotionDetectionEnabled, confidence: 0.5 },
          beauty: { enabled: aiState.isBeautyFilterEnabled },
        })
        .catch((error) => {
          console.error("AI 설정 업데이트 실패:", error);
        });
    }
  }, [
    aiState.isAiEnabled,
    isAiPreviewOpen,
    aiState.isStaticGestureDetectionEnabled,
    aiState.isDynamicGestureDetectionEnabled,
    aiState.isEmotionDetectionEnabled,
    aiState.isBeautyFilterEnabled,
    localStream, // localStream이 변경되면 재적용될 수 있도록
  ]);

  const handleToggleCamera = async () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0 && !isCameraOn) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.addTrack(videoTrack);
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
          }
        }
      } catch (err) {
        console.error("카메라 켜기 실패:", err);
        setMediaError("카메라를 켤 수 없습니다.");
      }
    } else {
      dispatch(toggleCamera());
      videoTracks.forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
  };

  const handleToggleMic = () => {
    if (!localStream) return;
    dispatch(toggleMic());
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !isMicOn;
    });
  };

  const handleJoinClick = () => {
    if (!isLoading && userName.trim()) {
      onJoin(userName.trim());
    }
  };

  const canJoinMeeting = !isLoading && !isInitializing && userName.trim() !== "";
  const hasVideoTrack = localStream ? localStream.getVideoTracks().length > 0 : false;
  const hasAudioTrack = localStream ? localStream.getAudioTracks().length > 0 : false;

  return (
    <div className="min-h-screen bg-[#222222] flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#FE7A25] font-header mb-2">GatherRoom</h1>
          <p className="text-[#A0A0A5]">카메라와 마이크를 확인하고 AI 기능을 테스트해보세요</p>
        </div>

        {/* 2열 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽 열: 기본 기능 */}
          <div className="space-y-6">
            <div className="bg-[#2C2C2E] rounded-2xl p-6 shadow-2xl">
          {/* 비디오 프리뷰 영역 */}
          <div className="relative w-full mb-6">
            {/* 메인 비디오 프리뷰 */}
            <div className="relative w-full h-96 bg-[#222222] rounded-xl overflow-hidden">
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#222222] z-10">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-[#A0A0A5] text-sm">미디어 장치를 확인 중...</p>
                  </div>
                </div>
              )}

              {/* 원본 비디오 (AI 프리뷰가 꺼져 있을 때) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-all duration-300 transform scale-x-[-1] ${
                  isCameraOn &&
                  hasVideoTrack &&
                  !isInitializing &&
                  (!aiState.isAiEnabled || !isAiPreviewOpen) // AI 프리뷰가 비활성화일 때 원본 비디오 표시
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                }`}
              />

              {/* AI 처리된 비디오 (AI 프리뷰가 켜져 있을 때) */}
              <video
                ref={aiVideoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 transform scale-x-[-1] ${
                  isCameraOn &&
                  hasVideoTrack &&
                  !isInitializing &&
                  aiState.isAiEnabled &&
                  isAiPreviewOpen &&
                  aiProcessedStream // AI 처리된 스트림이 존재할 때만 표시
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                }`}
              />

              {!isInitializing && (!isCameraOn || !hasVideoTrack || mediaError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#A0A0A5] bg-[#222222] z-10">
                  {mediaError ? (
                    <>
                      <ExclamationTriangleIcon className="w-12 h-12 text-[#D22016] mb-3" />
                      <p className="text-center text-[#D22016] px-4 text-sm leading-relaxed">
                        {mediaError}
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-3 px-3 py-1.5 bg-[#FE7A25] hover:bg-[#E06B1F] rounded-lg text-[#222222] text-sm font-medium transition-colors"
                      >
                        다시 시도
                      </button>
                    </>
                  ) : (
                    <>
                      <VideoCameraSlashIcon className="w-12 h-12 mb-3" />
                      <p>카메라가 꺼져 있습니다</p>
                    </>
                  )}
                </div>
              )}

              {/* AI 활성화 표시 */}
              {aiState.isAiEnabled && isAiPreviewOpen && (
                <div className="absolute top-3 left-3 z-20">
                  <div className="flex items-center space-x-2 bg-[#FE7A25]/90 rounded-full px-3 py-1 backdrop-blur-sm">
                    <StarIcon className="w-4 h-4 text-[#222222]" />
                    <span className="text-[#222222] text-sm font-medium">AI 미리보기</span>
                  </div>
                </div>
              )}

              {/* 마이크 상태 표시 */}
              {isMicOn && hasAudioTrack && !mediaError && (
                <div className="absolute bottom-3 left-3 z-20">
                  <div className="flex items-center space-x-2 bg-black/70 rounded-full px-2 py-1 backdrop-blur-sm">
                    <MicrophoneIcon className="w-3 h-3 text-[#FE7A25]" />
                    <div className="flex space-x-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 h-3 bg-[#FE7A25] rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>


            {!aiState.isAiEnabled && ( // AI 기능이 꺼져 있을 때만 이 텍스트 표시
              <div className="mt-3 p-3 bg-[#222222] rounded-lg">
                <p className="text-[#A0A0A5] text-xs">
                  회의 참여 전에 AI 기능을 테스트해보세요. 제스처, 감정 감지, 필터 효과를 미리
                  확인할 수 있습니다.
                </p>
              </div>
            )}

          </div>

          {/* 디바이스 상태 정보 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center space-x-2 p-3 bg-[#222222] rounded-lg">
              <div
                className={`p-1.5 rounded-full ${
                  hasVideoTrack ? "bg-[#FE7A25]/20" : "bg-[#D22016]/20"
                }`}
              >
                <VideoCameraIcon
                  className={`w-4 h-4 ${hasVideoTrack ? "text-[#FE7A25]" : "text-[#D22016]"}`}
                />
              </div>
              <div className="flex-1">
                <p className="text-[#FFFFFF] font-medium text-sm">카메라</p>
                <p className="text-[#A0A0A5] text-xs">
                  {hasVideoTrack ? "연결됨" : "연결되지 않음"}
                </p>
              </div>
              {hasVideoTrack && <CheckCircleIcon className="w-4 h-4 text-[#FE7A25]" />}
            </div>

            <div className="flex items-center space-x-2 p-3 bg-[#222222] rounded-lg">
              <div
                className={`p-1.5 rounded-full ${
                  hasAudioTrack ? "bg-[#FE7A25]/20" : "bg-[#D22016]/20"
                }`}
              >
                <MicrophoneIcon
                  className={`w-4 h-4 ${hasAudioTrack ? "text-[#FE7A25]" : "text-[#D22016]"}`}
                />
              </div>
              <div className="flex-1">
                <p className="text-[#FFFFFF] font-medium text-sm">마이크</p>
                <p className="text-[#A0A0A5] text-xs">
                  {hasAudioTrack ? "연결됨" : "연결되지 않음"}
                </p>
              </div>
              {hasAudioTrack && <CheckCircleIcon className="w-4 h-4 text-[#FE7A25]" />}
            </div>
          </div>

          {/* 사용자 이름 입력 및 컨트롤 한 줄 배치 */}
          <div className="mb-6">
            {/* 사용자 이름 입력 필드 */}
            <div className="relative mb-4">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A5]" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canJoinMeeting) {
                    handleJoinClick();
                  }
                }}
                placeholder="이름을 입력하세요"
                className="w-full bg-[#222222] text-[#FFFFFF] placeholder:text-[#636366] rounded-lg py-3 pl-10 pr-4 border border-[#424245] focus:ring-2 focus:ring-[#FE7A25] focus:border-[#FE7A25] outline-none transition-colors"
                disabled={isInitializing}
              />
            </div>

            {/* 미디어 컨트롤 버튼들 */}
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-[#A0A0A5] text-sm">카메라</span>
                <button
                  onClick={handleToggleCamera}
                  disabled={!localStream || isInitializing}
                  className={`relative p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                    isCameraOn && hasVideoTrack
                      ? "bg-[#FE7A25] hover:bg-[#E06B1F]"
                      : "bg-[#D22016] hover:bg-[#D22016]/80"
                  }`}
                  aria-label={isCameraOn ? "카메라 끄기" : "카메라 켜기"}
                >
                  {isCameraOn && hasVideoTrack ? (
                    <VideoCameraIcon className="w-4 h-4 text-[#222222]" />
                  ) : (
                    <VideoCameraSlashIcon className="w-4 h-4 text-white" />
                  )}
                  {!hasVideoTrack && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#D22016] rounded-full border border-[#2C2C2E]"></div>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[#A0A0A5] text-sm">마이크</span>
                <button
                  onClick={handleToggleMic}
                  disabled={!localStream || isInitializing}
                  className={`relative p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                    isMicOn && hasAudioTrack
                      ? "bg-[#FE7A25] hover:bg-[#E06B1F]"
                      : "bg-[#D22016] hover:bg-[#D22016]/80"
                  }`}
                  aria-label={isMicOn ? "마이크 끄기" : "마이크 켜기"}
                >
                  {isMicOn && hasAudioTrack ? (
                    <MicrophoneIcon className="w-4 h-4 text-[#222222]" />
                  ) : (
                    <SpeakerXMarkIcon className="w-4 h-4 text-white" />
                  )}
                  {!hasAudioTrack && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#D22016] rounded-full border border-[#2C2C2E]"></div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 참여 버튼 */}
          <Button
            onClick={handleJoinClick}
            disabled={!canJoinMeeting}
            className="w-full py-3 text-lg font-bold bg-[#FCBC34] hover:bg-[#E4A92E] text-[#222222] rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-[#222222] border-t-transparent rounded-full animate-spin"></div>
                <span>입장 중...</span>
              </div>
            ) : isInitializing ? (
              "장치 확인 중..."
            ) : (
              "지금 참여하기"
            )}
          </Button>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-[#D22016]/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-[#D22016]" />
                <p className="text-[#D22016] text-sm">서버 연결 오류: {error}</p>
              </div>
            </div>
          )}

          {/* 도움말 텍스트 */}
          <div className="mt-4 text-center">
            <p className="text-[#A0A0A5] text-xs">
              문제가 있나요?{" "}
              <button
                onClick={() => window.location.reload()}
                className="text-[#FE7A25] hover:text-[#E06B1F] underline font-medium"
              >
                페이지 새로고침
              </button>{" "}
              을 시도해보세요.
            </p>
          </div>
            </div>
            
            {/* 기본 UI 요소들은 여기에 */}
          </div>

          {/* 오른쪽 열: AI 기능 */}
          <div className="space-y-6">
            {/* AI 미리보기 토글 (맨 위로 이동) */}
            <div className="bg-[#2C2C2E] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <StarIcon className="w-5 h-5 text-[#FE7A25]" />
                  <span className="text-[#FFFFFF] font-medium">AI 기능 미리보기</span>
                </div>
                <button
                  onClick={handleAiPreviewToggle}
                  disabled={!hasVideoTrack || isInitializing}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    aiState.isAiEnabled && isAiPreviewOpen
                      ? "bg-[#FE7A25] text-[#222222]"
                      : "bg-[#424245] text-[#FFFFFF] hover:bg-[#4a4a4d]"
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {aiState.isAiEnabled && isAiPreviewOpen ? (
                    <>
                      <EyeSlashIcon className="w-5 h-5" />
                      <span>끄기</span>
                    </>
                  ) : (
                    <>
                      <EyeIcon className="w-5 h-5" />
                      <span>켜기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* AI 세부 설정 (레이아웃 간소화) */}
            <AnimatePresence>
              {aiState.isAiEnabled && isAiPreviewOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 p-3 bg-[#222222] rounded-lg"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => dispatch(toggleStaticGestureDetection())}
                      className={`flex items-center space-x-1 p-2 rounded text-xs ${
                        aiState.isStaticGestureDetectionEnabled
                          ? "bg-[#FE7A25]/20 text-[#FE7A25]"
                          : "bg-[#424245] text-[#A0A0A5]"
                      }`}
                    >
                      <HandRaisedIcon className="w-3 h-3" />
                      <span>정적 제스처</span>
                    </button>

                    <button
                      onClick={() => dispatch(toggleDynamicGestureDetection())}
                      className={`flex items-center space-x-1 p-2 rounded text-xs ${
                        aiState.isDynamicGestureDetectionEnabled
                          ? "bg-[#FE7A25]/20 text-[#FE7A25]"
                          : "bg-[#424245] text-[#A0A0A5]"
                      }`}
                    >
                      <SparklesIcon className="w-3 h-3" />
                      <span>동적 제스처</span>
                    </button>

                    <button
                      onClick={() => dispatch(toggleEmotionDetection())}
                      className={`flex items-center space-x-1 p-2 rounded text-xs ${
                        aiState.isEmotionDetectionEnabled
                          ? "bg-[#FE7A25]/20 text-[#FE7A25]"
                          : "bg-[#424245] text-[#A0A0A5]"
                      }`}
                    >
                      <FaceSmileIcon className="w-3 h-3" />
                      <span>감정 감지</span>
                    </button>

                    <button
                      onClick={() => dispatch(toggleBeautyFilter())}
                      className={`flex items-center space-x-1 p-2 rounded text-xs ${
                        aiState.isBeautyFilterEnabled
                          ? "bg-[#FE7A25]/20 text-[#FE7A25]"
                          : "bg-[#424245] text-[#A0A0A5]"
                      }`}
                    >
                      <SparklesIcon className="w-3 h-3" />
                      <span>뷰티 필터</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* AI 기능 테스트 결과 */}
            <DynamicAiTestDisplay
                isAiEnabled={aiState.isAiEnabled}
                isAiPreviewOpen={isAiPreviewOpen}
                gestureResults={realtimeGestureResults}
                emotionResults={realtimeEmotionResults}
                aiState={aiState}
                localVideoElement={videoRef.current}
                aiProcessedVideoElement={aiVideoRef.current}
                onLandmarkToggle={() => setShowLandmarks(!showLandmarks)}
                showLandmarks={showLandmarks}
                latestGestureWithLandmarks={latestGestureWithLandmarks}
                latestEmotionWithLandmarks={latestEmotionWithLandmarks}
              />
          </div>
        </div>
      </div>
    </div>
  );
};

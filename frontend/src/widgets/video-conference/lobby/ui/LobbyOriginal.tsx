"use client";

import { useState, useEffect, useRef } from "react";
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon, // 사용자 이름 입력을 위한 아이콘 추가
} from "@heroicons/react/24/solid";
import { Button } from "@/shared/ui/shadcn/button";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import { toggleCamera, toggleMic } from "@/entities/video-conference/media/model/slice";

interface LobbyProps {
  onJoin: (userName: string) => void;
  isLoading: boolean;
  error: string | null;
}

interface MediaPermissions {
  camera: boolean;
  microphone: boolean;
}

export const Lobby = ({ onJoin, isLoading, error }: LobbyProps) => {
  const dispatch = useAppDispatch();
  const { isCameraOn, isMicOn } = useAppSelector((state) => state.re_media);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: false,
    microphone: false,
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 사용자 이름 상태 추가
  const [userName, setUserName] = useState("");

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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = isCameraOn; // Redux 상태에 맞춰 설정
        }
        if (audioTrack) {
          // 마이크는 기본적으로 꺼진 상태로 시작 (Redux 상태에 맞춰)
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
        // 에러 발생 시에는 Redux 상태를 건드리지 않음 (이미 false로 초기화되어 있음)
      } finally {
        setIsInitializing(false);
      }
    };
    initializeMedia();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []); // 이 useEffect는 한 번만 실행되므로 의존성 배열은 비어 있어야 합니다.

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
          // 카메라가 새로 켜짐 - Redux 상태는 handleToggleCamera에서 업데이트
        }
      } catch (err) {
        console.error("카메라 켜기 실패:", err);
        setMediaError("카메라를 켤 수 없습니다.");
      }
    } else {
      // Redux 상태 먼저 업데이트
      dispatch(toggleCamera());
      
      // 실제 트랙 상태도 업데이트 (Redux 상태와 반대로 설정)
      videoTracks.forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
  };

  const handleToggleMic = () => {
    if (!localStream) return;
    
    // Redux 상태 먼저 업데이트
    dispatch(toggleMic());
    
    // 실제 트랙 상태도 업데이트 (Redux 상태와 반대로 설정)
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !isMicOn;
    });
  };

  const handleJoinClick = () => {
    // userName.trim()으로 공백만 있는 이름은 방지
    if (!isLoading && userName.trim()) {
      onJoin(userName.trim());
    }
  };

  // 참여 가능 조건에 userName 확인 추가
  const canJoinMeeting = !isLoading && !isInitializing && userName.trim() !== "";
  const hasVideoTrack = localStream ? localStream.getVideoTracks().length > 0 : false;
  const hasAudioTrack = localStream ? localStream.getAudioTracks().length > 0 : false;

  return (
    <div className="min-h-screen bg-[#222222] flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#FFFFFF] font-header mb-2">회의 준비</h1>
          <p className="text-[#A0A0A5]">카메라와 마이크를 확인하고 회의에 참여하세요</p>
        </div>

        <div className="bg-[#2C2C2E] rounded-2xl p-6 shadow-2xl animate-scale-in">
          {/* 비디오 프리뷰 영역 */}
          <div className="relative w-full h-96 mb-6 bg-[#222222] rounded-xl overflow-hidden">
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#222222]">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-[#FE7A25] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-[#A0A0A5] text-sm">미디어 장치를 확인 중...</p>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all duration-300 transform scale-x-[-1] ${
                isCameraOn && hasVideoTrack && !isInitializing
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-105"
              }`}
            />

            {!isInitializing && (!isCameraOn || !hasVideoTrack || mediaError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#A0A0A5] bg-[#222222]">
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

            {isMicOn && hasAudioTrack && !mediaError && (
              <div className="absolute bottom-3 left-3">
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

          {/* 컨트롤 버튼들 */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={handleToggleCamera}
              disabled={!localStream || isInitializing}
              className={`relative p-3 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                isCameraOn && hasVideoTrack
                  ? "bg-[#FE7A25] hover:bg-[#E06B1F]"
                  : "bg-[#D22016] hover:bg-[#D22016]/80"
              }`}
              aria-label={isCameraOn ? "카메라 끄기" : "카메라 켜기"}
            >
              {isCameraOn && hasVideoTrack ? (
                <VideoCameraIcon className="w-5 h-5 text-[#222222]" />
              ) : (
                <VideoCameraSlashIcon className="w-5 h-5 text-white" />
              )}
              {!hasVideoTrack && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#D22016] rounded-full border-2 border-[#2C2C2E]"></div>
              )}
            </button>

            <button
              onClick={handleToggleMic}
              disabled={!localStream || isInitializing}
              className={`relative p-3 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                isMicOn && hasAudioTrack
                  ? "bg-[#FE7A25] hover:bg-[#E06B1F]"
                  : "bg-[#D22016] hover:bg-[#D22016]/80"
              }`}
              aria-label={isMicOn ? "마이크 끄기" : "마이크 켜기"}
            >
              {isMicOn && hasAudioTrack ? (
                <MicrophoneIcon className="w-5 h-5 text-[#222222]" />
              ) : (
                <SpeakerXMarkIcon className="w-5 h-5 text-white" />
              )}
              {!hasAudioTrack && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#D22016] rounded-full border-2 border-[#2C2C2E]"></div>
              )}
            </button>
          </div>

          {/* 사용자 이름 입력 필드 */}
          <div className="relative mb-6">
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
      </div>
    </div>
  );
};

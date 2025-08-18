// src/widgets/video-conference/AiTestDisplay.tsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HandRaisedIcon,
  FaceSmileIcon,
  SparklesIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";

import { GestureData, EmotionData, AiTestResult, GestureResult, EmotionResult } from "@/shared/types/ai.types";

// 제스처 레이블에 대한 한국어 매핑
const GESTURE_LABELS: { [key: string]: string } = {
  // 정적 제스처
  bad: "👎 따봉 반대",
  good: "👍 따봉",
  gun: "👉 총 모양",
  heart: "🫶 손가락 하트",
  none: "없음",
  ok: "👌 OK",
  promise: "🤙 약속",
  rock: "🤘 락앤롤",
  victory: "✌️ 브이",
  // 동적 제스처
  fire: "🔥 파이어",
  hi: "👋 안녕",
  hit: "💥 히트",
  nono: "🚫 안돼",
  nyan: "🐾 냥냥펀치",
  shot: "💖 샷",
};

// 감정 레이블에 대한 한국어 매핑
const EMOTION_LABELS: { [key: string]: string } = {
  none: "😐 중립",
  laugh: "😄 웃음",
  serious: "😤 진지함",
  surprise: "😲 놀람",
  yawn: "🥱 하품",
  angry: "😠 화남",
  sad: "😢 슬픔",
  happy: "😊 행복",
};

// 이미지 경로 매핑 (frontendAiProcessor와 동일)
const getImagePath = (label: string): string => {
  const basePaths = {
    // Static gestures
    bad: "/images/gestures/static/bad.png",
    good: "/images/gestures/static/good.png",
    gun: "/images/gestures/static/gun.png",
    heart: "/images/gestures/static/heart.png",
    ok: "/images/gestures/static/ok.png",
    promise: "/images/gestures/static/promise.png",
    rock: "/images/gestures/static/rock.png",
    victory: "/images/gestures/static/victory.png",
    // Dynamic gestures
    fire: "/images/gestures/dynamic/fire.png",
    hi: "/images/gestures/dynamic/hi.png",
    hit: "/images/gestures/dynamic/hit.png",
    nono: "/images/gestures/dynamic/nono.png",
    nyan: "/images/gestures/dynamic/nyan.png",
    shot: "/images/gestures/dynamic/shot.png",
    // Emotions
    laugh: "/images/gestures/emotion/laugh.png",
    serious: "/images/gestures/emotion/serious.png",
    surprise: "/images/gestures/emotion/surprise.png",
    yawn: "/images/gestures/emotion/yawn.png",
  };
  return basePaths[label as keyof typeof basePaths] || "";
};

// 쿨다운 프로그레스 바 컴포넌트
const CooldownProgressBar: React.FC<{
  isOnCooldown: boolean;
  progress: number; // 0-1
  timeRemaining: number; // 초 단위
}> = ({ isOnCooldown, progress, timeRemaining }) => {
  if (!isOnCooldown) return null;

  return (
    <div className="flex items-center space-x-2 ml-auto">
      <ClockIcon className="w-3 h-3 text-[#A0A0A5]" />
      <div className="flex items-center space-x-1">
        <div className="w-16 h-1.5 bg-[#424245] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FE7A25] rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${(1 - progress) * 100}%` }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
        </div>
        <span className="text-xs text-[#A0A0A5] min-w-[20px]">
          {Math.ceil(timeRemaining)}s
        </span>
      </div>
    </div>
  );
};

// 그리드 형태의 제스처 카드 컴포넌트
const GestureGridCard: React.FC<{
  label: string;
  name: string;
  imagePath: string;
  isActive: boolean;
  lastDetectedTime?: number;
  onCooldown: boolean;
}> = ({ label, name, imagePath, isActive, lastDetectedTime, onCooldown }) => {
  const [showEffect, setShowEffect] = useState(false);
  
  useEffect(() => {
    if (isActive && lastDetectedTime) {
      setShowEffect(true);
      const timer = setTimeout(() => setShowEffect(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, lastDetectedTime]);

  return (
    <motion.div
      className={`relative rounded-md p-1.5 transition-all duration-300 border min-h-[60px] ${
        onCooldown
          ? "bg-[#636366]/20 border-[#636366]/30 opacity-50"
          : isActive
          ? "bg-[#FE7A25]/20 border-[#FE7A25]/50 shadow-md"
          : "bg-[#424245]/30 border-[#424245]/40 hover:bg-[#424245]/40"
      }`}
      animate={showEffect ? {
        scale: [1, 1.02, 1],
        boxShadow: [
          "0 0 0 0 rgba(254, 122, 37, 0)",
          "0 0 0 2px rgba(254, 122, 37, 0.3)",
          "0 0 0 0 rgba(254, 122, 37, 0)"
        ]
      } : {}}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center flex flex-col items-center justify-center h-full">
        {imagePath ? (
          <div className="flex justify-center mb-0.5">
            <img 
              src={imagePath} 
              alt={name}
              className={`w-4 h-4 object-contain transition-transform duration-300 ${
                showEffect ? "scale-110" : ""
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.textContent = '❓';
                fallback.className = 'text-xs';
                target.parentNode?.appendChild(fallback);
              }}
            />
          </div>
        ) : (
          <div className="text-xs mb-0.5">❓</div>
        )}
        <div className={`text-[10px] font-medium truncate leading-tight max-w-full ${
          onCooldown ? "text-[#636366]" : isActive ? "text-[#FE7A25]" : "text-[#FFFFFF]"
        }`}>
          {name}
        </div>
      </div>
      
      {/* 쿨다운 오버레이 */}
      {onCooldown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
          <ClockIcon className="w-2.5 h-2.5 text-[#636366]" />
        </div>
      )}
    </motion.div>
  );
};

// 그리드 섹션 컴포넌트
const GestureGridSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  gestureLabels: string[];
  labelMap: { [key: string]: string };
  activeGestures: { [key: string]: number }; // label -> timestamp
  cooldownGestures: Set<string>;
}> = ({ title, icon, enabled, gestureLabels, labelMap, activeGestures, cooldownGestures }) => {
  return (
    <div className={`rounded-md transition-all duration-300 ${
      enabled 
        ? "bg-[#FE7A25]/5 border border-[#FE7A25]/20" 
        : "bg-[#424245]/20 border border-[#424245]/30"
    }`}>
      <div className="px-2.5 py-1.5 border-b border-[#424245]/30">
        <div className="flex items-center space-x-1.5">
          <div className={`${enabled ? "text-[#FE7A25]" : "text-[#A0A0A5]"}`}>{icon}</div>
          <span className={`text-xs font-medium ${enabled ? "text-[#FFFFFF]" : "text-[#A0A0A5]"}`}>
            {title}
          </span>
        </div>
      </div>

      <div className="p-2">
        {enabled ? (
          <div className="grid grid-cols-8 gap-1">
            {gestureLabels.map((label) => {
              const name = labelMap[label]?.substring(2) || label;
              const imagePath = getImagePath(label);
              const isActive = activeGestures[label] > 0;
              const onCooldown = cooldownGestures.has(label);
              
              return (
                <GestureGridCard
                  key={label}
                  label={label}
                  name={name}
                  imagePath={imagePath}
                  isActive={isActive}
                  lastDetectedTime={activeGestures[label]}
                  onCooldown={onCooldown}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-[#636366] text-xs">
            기능이 비활성화되어 있습니다
          </div>
        )}
      </div>
    </div>
  );
};

interface AiTestDisplayProps {
  isAiEnabled: boolean;
  isAiPreviewOpen: boolean;
  gestureResults: AiTestResult[];
  emotionResults: AiTestResult[];
  aiState: {
    isStaticGestureDetectionEnabled: boolean;
    isDynamicGestureDetectionEnabled: boolean;
    isEmotionDetectionEnabled: boolean;
    detectedGestures: GestureData[];
    detectedEmotions: EmotionData[];
  };
  localVideoElement: HTMLVideoElement | null;
  aiProcessedVideoElement: HTMLVideoElement | null;
  onLandmarkToggle?: () => void;
  showLandmarks?: boolean;
  latestGestureWithLandmarks?: GestureResult | null;
  latestEmotionWithLandmarks?: EmotionResult | null;
}

export const AiTestDisplay: React.FC<AiTestDisplayProps> = ({
  isAiEnabled,
  isAiPreviewOpen,
  gestureResults,
  emotionResults,
  aiState,
  localVideoElement,
  aiProcessedVideoElement,
  onLandmarkToggle,
  showLandmarks = false,
  latestGestureWithLandmarks,
  latestEmotionWithLandmarks,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 새로운 상태 관리
  const [activeGestures, setActiveGestures] = useState<{ [key: string]: number }>({});
  const [activeEmotions, setActiveEmotions] = useState<{ [key: string]: number }>({});
  const [cooldownGestures, setCooldownGestures] = useState<Set<string>>(new Set());
  const [cooldownEmotions, setCooldownEmotions] = useState<Set<string>>(new Set());
  
  const cooldownTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // 제스처 리스트 정의
  const staticGestureLabels = ["bad", "good", "gun", "heart", "ok", "promise", "rock", "victory"];
  const dynamicGestureLabels = ["fire", "hi", "hit", "nono", "nyan", "shot"];
  const emotionLabels = ["laugh", "serious", "surprise", "yawn"];
  
  // 제스처 감지 처리
  useEffect(() => {
    if (gestureResults.length === 0) return;
    const latestGesture = gestureResults[gestureResults.length - 1];
    if (latestGesture.label === "none") return;
    
    const now = Date.now();
    const label = latestGesture.label;
    
    // 제스처 활성화 및 쿨다운 시작
    setActiveGestures(prev => ({ ...prev, [label]: now }));
    setCooldownGestures(prev => new Set([...prev, label]));
    
    // 5초 후 쿨다운 해제
    if (cooldownTimers.current[label]) {
      clearTimeout(cooldownTimers.current[label]);
    }
    
    cooldownTimers.current[label] = setTimeout(() => {
      setCooldownGestures(prev => {
        const newSet = new Set(prev);
        newSet.delete(label);
        return newSet;
      });
      delete cooldownTimers.current[label];
    }, 5000);
    
    // 1초 후 활성 상태 해제
    setTimeout(() => {
      setActiveGestures(prev => ({ ...prev, [label]: 0 }));
    }, 1000);
  }, [gestureResults]);
  
  // 감정 감지 처리
  useEffect(() => {
    if (emotionResults.length === 0) return;
    const latestEmotion = emotionResults[emotionResults.length - 1];
    if (latestEmotion.label === "none") return;
    
    const now = Date.now();
    const label = latestEmotion.label;
    
    // 감정 활성화 및 쿨다운 시작
    setActiveEmotions(prev => ({ ...prev, [label]: now }));
    setCooldownEmotions(prev => new Set([...prev, label]));
    
    // 8초 후 쿨다운 해제 (감정 인식 빈도를 크게 낮춤)
    if (cooldownTimers.current[`emotion_${label}`]) {
      clearTimeout(cooldownTimers.current[`emotion_${label}`]);
    }
    
    cooldownTimers.current[`emotion_${label}`] = setTimeout(() => {
      setCooldownEmotions(prev => {
        const newSet = new Set(prev);
        newSet.delete(label);
        return newSet;
      });
      delete cooldownTimers.current[`emotion_${label}`];
    }, 8000);
    
    // 1초 후 활성 상태 해제
    setTimeout(() => {
      setActiveEmotions(prev => ({ ...prev, [label]: 0 }));
    }, 1000);
  }, [emotionResults]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      Object.values(cooldownTimers.current).forEach(clearTimeout);
    };
  }, []);

  const drawLandmarks = useCallback((
    context: CanvasRenderingContext2D,
    landmarks: number[][],
    color: string,
    radius: number = 2
  ) => {
    context.fillStyle = color;
    landmarks.forEach(([x, y]) => {
      const canvasX = x * context.canvas.width;
      const canvasY = y * context.canvas.height;
      context.beginPath();
      context.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
      context.fill();
    });
  }, []);

  const drawHandLandmarks = useCallback((
    context: CanvasRenderingContext2D,
    landmarks: number[][],
    color: string
  ) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    context.strokeStyle = color;
    context.lineWidth = 1;
    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        const startX = landmarks[start][0] * context.canvas.width;
        const startY = landmarks[start][1] * context.canvas.height;
        const endX = landmarks[end][0] * context.canvas.width;
        const endY = landmarks[end][1] * context.canvas.height;
        
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
      }
    });

    drawLandmarks(context, landmarks, color, 3);
  }, [drawLandmarks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const sourceVideo =
      aiProcessedVideoElement && isAiEnabled && isAiPreviewOpen
        ? aiProcessedVideoElement
        : localVideoElement;

    if (!sourceVideo || !isAiEnabled || !isAiPreviewOpen || !showLandmarks) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationFrameId: number;

    const renderLoop = () => {
      if (sourceVideo.paused || sourceVideo.ended) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }
      
      const videoWidth = sourceVideo.videoWidth;
      const videoHeight = sourceVideo.videoHeight;
      if (canvas.width !== videoWidth) canvas.width = videoWidth;
      if (canvas.height !== videoHeight) canvas.height = videoHeight;

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (
        (aiState.isStaticGestureDetectionEnabled || aiState.isDynamicGestureDetectionEnabled) &&
        latestGestureWithLandmarks?.landmarks &&
        latestGestureWithLandmarks.landmarks.length > 0
      ) {
        drawHandLandmarks(context, latestGestureWithLandmarks.landmarks, "rgba(254, 122, 37, 0.8)");
      }

      if (
        aiState.isEmotionDetectionEnabled &&
        latestEmotionWithLandmarks?.faceLandmarks &&
        latestEmotionWithLandmarks.faceLandmarks.length > 0
      ) {
        drawLandmarks(context, latestEmotionWithLandmarks.faceLandmarks, "rgba(59, 130, 246, 0.8)", 2);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isAiEnabled,
    isAiPreviewOpen,
    localVideoElement,
    aiProcessedVideoElement,
    showLandmarks,
    latestGestureWithLandmarks,
    latestEmotionWithLandmarks,
    aiState.isStaticGestureDetectionEnabled,
    aiState.isDynamicGestureDetectionEnabled,
    aiState.isEmotionDetectionEnabled,
    drawHandLandmarks,
    drawLandmarks,
  ]);

  if (!isAiEnabled || !isAiPreviewOpen) {
    return (
      <div className="p-3 bg-[#222222]/50 rounded-lg text-center">
        <SparklesIcon className="w-6 h-6 text-[#636366] mx-auto mb-2" />
        <p className="text-[#636366] text-xs">
          AI 미리보기를 활성화하여
          <br />
          제스처와 감정 인식을 테스트해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          transform: "scaleX(-1)",
          display: showLandmarks ? "block" : "none"
        }}
        className="pointer-events-none"
      />
      
      <div className="bg-[#1A1A1A] rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5">
            <SparklesIcon className="w-4 h-4 text-[#FE7A25]" />
            <span className="text-[#FE7A25] text-xs font-medium">AI 기능 테스트</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <GestureGridSection
            title="정적 제스처"
            icon={<HandRaisedIcon className="w-3.5 h-3.5" />}
            enabled={aiState.isStaticGestureDetectionEnabled}
            gestureLabels={staticGestureLabels}
            labelMap={GESTURE_LABELS}
            activeGestures={activeGestures}
            cooldownGestures={cooldownGestures}
          />

          <GestureGridSection
            title="동적 제스처"
            icon={<SparklesIcon className="w-3.5 h-3.5" />}
            enabled={aiState.isDynamicGestureDetectionEnabled}
            gestureLabels={dynamicGestureLabels}
            labelMap={GESTURE_LABELS}
            activeGestures={activeGestures}
            cooldownGestures={cooldownGestures}
          />

          <GestureGridSection
            title="감정 인식"
            icon={<FaceSmileIcon className="w-3.5 h-3.5" />}
            enabled={aiState.isEmotionDetectionEnabled}
            gestureLabels={emotionLabels}
            labelMap={EMOTION_LABELS}
            activeGestures={activeEmotions}
            cooldownGestures={cooldownEmotions}
          />
        </div>

        <div className="text-[10px] text-[#636366] text-center pt-2 mt-3 border-t border-[#424245]">
          💡 다양한 표정과 손 제스처를 시도해보세요
        </div>
      </div>
    </div>
  );
};

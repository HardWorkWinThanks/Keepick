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
} from "@heroicons/react/24/solid";

import { GestureData, EmotionData, AiTestResult, GestureResult, EmotionResult } from "@/shared/types/ai.types";

// 제스처 레이블에 대한 한국어 매핑
const GESTURE_LABELS: { [key: string]: string } = {
  // 정적 제스처
  bad: "👎 따봉 반대",
  fist: "✊ 주먹",
  good: "👍 따봉",
  gun: "👉 총 모양",
  heart: "🫶 손가락 하트",
  none: "없음",
  ok: "👌 OK",
  open_palm: "✋ 손바닥",
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

// 가로 카드 아이템 컴포넌트
const GestureCard: React.FC<{
  result: AiTestResult;
  labelMap: { [key: string]: string };
  isLatest?: boolean;
}> = ({ result, labelMap, isLatest = false }) => {
  const label = labelMap[result.label];
  const emoji = label?.split(" ")[0] || "❓";
  const name = label?.substring(2) || result.label;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex-shrink-0 w-24 h-20 rounded-lg p-2 transition-all ${
        isLatest 
          ? "bg-[#FE7A25]/20 border border-[#FE7A25]/40" 
          : "bg-[#424245]/30"
      }`}
    >
      <div className="text-center">
        <div className="text-lg mb-1">{emoji}</div>
        <div className="text-xs font-medium text-[#FFFFFF] truncate">{name}</div>
        {/* {result.confidence && (
          <div className="text-xs text-[#A0A0A5] mt-1">
            {(result.confidence * 100).toFixed(0)}%
          </div>
        )} */}
      </div>
    </motion.div>
  );
};

// 제스처 타입별 섹션 컴포넌트
const GestureSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  results: AiTestResult[];
  labelMap: { [key: string]: string };
  enabled: boolean;
  gestureType: "static" | "dynamic" | "emotion";
}> = ({ title, icon, results, labelMap, enabled, gestureType }) => {
  // 해당 타입의 제스처만 필터링
  const filteredResults = results.filter((r) => {
    if (gestureType === "static") {
      return ["bad", "fist", "good", "gun", "heart", "ok", "open_palm", "promise", "rock", "victory"].includes(r.label);
    } else if (gestureType === "dynamic") {
      return ["fire", "hi", "hit", "nono", "nyan", "shot"].includes(r.label);
    } else if (gestureType === "emotion") {
      return ["laugh", "serious", "surprise", "yawn", "angry", "sad", "happy"].includes(r.label);
    }
    return false;
  }).slice(-5); // 최대 5개

  return (
    <div className={`rounded-lg transition-all duration-300 ${
      enabled 
        ? "bg-[#FE7A25]/5 border border-[#FE7A25]/20" 
        : "bg-[#424245]/20 border border-[#424245]/30"
    }`}>
      <div className="p-3 border-b border-[#424245]/30">
        <div className="flex items-center space-x-2">
          <div className={`${enabled ? "text-[#FE7A25]" : "text-[#A0A0A5]"}`}>{icon}</div>
          <span className={`text-sm font-medium ${enabled ? "text-[#FFFFFF]" : "text-[#A0A0A5]"}`}>
            {title}
          </span>
        </div>
      </div>

      <div className="p-3">
        {enabled ? (
          filteredResults.length > 0 ? (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {filteredResults.reverse().map((result, index) => (
                <GestureCard
                  key={`${result.type}-${result.label}-${result.timestamp}-${index}`}
                  result={result}
                  labelMap={labelMap}
                  isLatest={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 text-[#A0A0A5] text-sm">
              <EyeIcon className="w-4 h-4 mr-2" />
              감지 대기 중...
            </div>
          )
        ) : (
          <div className="flex items-center justify-center p-4 text-[#636366] text-sm">
            비활성화됨
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
  
  const [filteredGestureResults, setFilteredGestureResults] = useState<AiTestResult[]>([]);
  const [filteredEmotionResults, setFilteredEmotionResults] = useState<AiTestResult[]>([]);
  const lastGestureTimeRef = useRef<number>(0);
  const lastEmotionTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (gestureResults.length === 0) return;
    const latestGesture = gestureResults[gestureResults.length - 1];
    if (latestGesture.label === "none") return;
  
    const now = Date.now();
    if (now - lastGestureTimeRef.current < 1000) { // 1초 쿨다운
      return;
    }
  
    setFilteredGestureResults(prev => [...prev, latestGesture].slice(-5));
    lastGestureTimeRef.current = now;
  }, [gestureResults]);
  
  useEffect(() => {
    if (emotionResults.length === 0) return;
    const latestEmotion = emotionResults[emotionResults.length - 1];
    if (latestEmotion.label === "none") return;
  
    const now = Date.now();
    if (now - lastEmotionTimeRef.current < 2500) { // 2.5초 쿨다운
      return;
    }
  
    setFilteredEmotionResults(prev => [...prev, latestEmotion].slice(-5));
    lastEmotionTimeRef.current = now;
  }, [emotionResults]);

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
      <div className="p-4 bg-[#222222]/50 rounded-lg text-center">
        <SparklesIcon className="w-8 h-8 text-[#636366] mx-auto mb-2" />
        <p className="text-[#636366] text-sm">
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
      
      <div className="bg-[#1A1A1A] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-[#FE7A25]" />
            <span className="text-[#FE7A25] text-sm font-medium">AI 기능 테스트</span>
          </div>
          {/* {onLandmarkToggle && (
            <button
              onClick={onLandmarkToggle}
              className={`px-3 py-1 rounded text-xs transition-all ${
                showLandmarks
                  ? "bg-[#FE7A25] text-white"
                  : "bg-[#424245] text-[#A0A0A5] hover:bg-[#525255]"
              }`}
            >
              랜드마크 {showLandmarks ? "ON" : "OFF"}
            </button>
          )} */}
        </div>

        <div className="space-y-3">
          <GestureSection
            title="정적 제스처"
            icon={<HandRaisedIcon className="w-4 h-4" />}
            results={filteredGestureResults}
            labelMap={GESTURE_LABELS}
            enabled={aiState.isStaticGestureDetectionEnabled}
            gestureType="static"
          />

          <GestureSection
            title="동적 제스처"
            icon={<SparklesIcon className="w-4 h-4" />}
            results={filteredGestureResults}
            labelMap={GESTURE_LABELS}
            enabled={aiState.isDynamicGestureDetectionEnabled}
            gestureType="dynamic"
          />

          <GestureSection
            title="감정 인식"
            icon={<FaceSmileIcon className="w-4 h-4" />}
            results={filteredEmotionResults}
            labelMap={EMOTION_LABELS}
            enabled={aiState.isEmotionDetectionEnabled}
            gestureType="emotion"
          />
        </div>

        <div className="text-xs text-[#636366] text-center pt-3 mt-4 border-t border-[#424245]">
          💡 다양한 표정과 손 제스처를 시도해보세요
        </div>
      </div>
    </div>
  );
};

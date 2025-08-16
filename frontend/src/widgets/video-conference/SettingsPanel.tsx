// src/widgets/video-conference/SettingsPanel.tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import {
  setAiEnabled,
  toggleStaticGestureDetection,
  toggleDynamicGestureDetection,
  toggleEmotionDetection,
  toggleBeautyFilter,
} from "@/entities/video-conference/ai/model/aiSlice";
import { mediasoupManager } from "@/shared/api/mediasoupManager";
import {
  XMarkIcon,
  CogIcon,
  HandRaisedIcon,
  SparklesIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
  FaceSmileIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// 쿨타임 표시 컴포넌트
const CooldownIndicator = ({ 
  isActive, 
  remainingTime, 
  totalCooldown 
}: { 
  isActive: boolean; 
  remainingTime: number; 
  totalCooldown: number; 
}) => {
  if (!isActive) return null;
  
  const progress = (totalCooldown - remainingTime) / totalCooldown;
  const circumference = 2 * Math.PI * 8; // radius 8
  
  return (
    <div className="relative w-6 h-6">
      <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="#424245"
          strokeWidth="2"
          fill="none"
        />
        <motion.circle
          cx="10"
          cy="10"
          r="8"
          stroke="#FE7A25"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-[#FE7A25] font-bold">
          {Math.ceil(remainingTime / 1000)}
        </span>
      </div>
    </div>
  );
};

// 토글 스위치 컴포넌트 (쿨타임 표시 기능 추가)
const ToggleSwitch = ({
  label,
  description,
  isOn,
  onToggle,
  disabled = false,
  icon,
  cooldownInfo,
}: {
  label: string;
  description?: string;
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  cooldownInfo?: {
    isActive: boolean;
    remainingTime: number;
    totalCooldown: number;
  };
}) => (
  <div
    className={`flex items-start justify-between p-4 rounded-lg ${
      disabled ? "opacity-50" : "hover:bg-[#424245]/30"
    } transition-colors`}
  >
    <div className="flex-1">
      <div className="flex items-center space-x-2 mb-1">
        {icon && <div className="text-[#FE7A25]">{icon}</div>}
        <span className="text-[#FFFFFF] font-medium">{label}</span>
        {disabled && (
          <span className="text-xs bg-[#424245] text-[#A0A0A5] px-2 py-1 rounded-full">
            준비 중
          </span>
        )}
        {cooldownInfo && (
          <CooldownIndicator
            isActive={cooldownInfo.isActive}
            remainingTime={cooldownInfo.remainingTime}
            totalCooldown={cooldownInfo.totalCooldown}
          />
        )}
      </div>
      {description && <p className="text-[#A0A0A5] text-sm">{description}</p>}
    </div>
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${isOn ? "bg-[#FE7A25]" : "bg-[#424245]"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const dispatch = useAppDispatch();
  
  // AI 상태
  const aiState = useAppSelector((state) => state.ai);
  const { isCameraOn, isMicOn } = useAppSelector((state) => state.re_media);
  const { isSharing, activeScreenShareCount } = useAppSelector(
    (state) => state.screenShare
  );
  
  // 쿨타임 상태 관리
  const [gestureCooldowns, setGestureCooldowns] = useState<{
    [key: string]: { isActive: boolean; remainingTime: number; totalCooldown: number }
  }>({});
  
  // 쿨타임 시뮬레이션 (실제 제스처 감지 시 호출될 함수)
  const startCooldown = (type: string, duration: number) => {
    setGestureCooldowns(prev => ({
      ...prev,
      [type]: {
        isActive: true,
        remainingTime: duration,
        totalCooldown: duration
      }
    }));
    
    // 100ms마다 쿨타임 업데이트
    const interval = setInterval(() => {
      setGestureCooldowns(prev => {
        const current = prev[type];
        if (!current || current.remainingTime <= 0) {
          clearInterval(interval);
          return {
            ...prev,
            [type]: { ...current, isActive: false }
          };
        }
        return {
          ...prev,
          [type]: {
            ...current,
            remainingTime: current.remainingTime - 100
          }
        };
      });
    }, 100);
  };
  
  // AI 전체 토글 핸들러
  const handleAiToggle = async () => {
    const newState = !aiState.isAiEnabled;
    dispatch(setAiEnabled(newState));
    
    // MediasoupManager를 통해 AI 기능 적용
    try {
      if (newState) {
        await mediasoupManager.startLocalMedia(true, {
          gesture: {
            static: { enabled: aiState.isStaticGestureDetectionEnabled, confidence: 0.75 },
            dynamic: { enabled: aiState.isDynamicGestureDetectionEnabled, confidence: 0.9 }
          },
          emotion: { enabled: aiState.isEmotionDetectionEnabled, confidence: 0.6 },
          beauty: { enabled: aiState.isBeautyFilterEnabled }
        });
      } else {
        await mediasoupManager.startLocalMedia(false);
      }
    } catch (error) {
      console.error('AI 기능 토글 중 오류:', error);
    }
  };
  
  // 개별 기능 토글 핸들러
  const handleFeatureToggle = (feature: 'static' | 'dynamic' | 'emotion' | 'beauty') => {
    switch (feature) {
      case 'static':
        dispatch(toggleStaticGestureDetection());
        if (!aiState.isStaticGestureDetectionEnabled) {
          startCooldown('static', 3000); // 3초 쿨타임
        }
        // AI 설정 즉시 업데이트
        mediasoupManager.updateAIConfig({
          gesture: {
            static: { enabled: !aiState.isStaticGestureDetectionEnabled, confidence: 0.75 },
            dynamic: { enabled: aiState.isDynamicGestureDetectionEnabled, confidence: 0.9 }
          }
        });
        break;
      case 'dynamic':
        dispatch(toggleDynamicGestureDetection());
        if (!aiState.isDynamicGestureDetectionEnabled) {
          startCooldown('dynamic', 3000); // 3초 쿨타임
        }
        // AI 설정 즉시 업데이트
        mediasoupManager.updateAIConfig({
          gesture: {
            static: { enabled: aiState.isStaticGestureDetectionEnabled, confidence: 0.75 },
            dynamic: { enabled: !aiState.isDynamicGestureDetectionEnabled, confidence: 0.9 }
          }
        });
        break;
      case 'emotion':
        dispatch(toggleEmotionDetection());
        if (!aiState.isEmotionDetectionEnabled) {
          startCooldown('emotion', 5000); // 5초 쿨타임
        }
        // AI 설정 즉시 업데이트
        mediasoupManager.updateAIConfig({
          emotion: { enabled: !aiState.isEmotionDetectionEnabled, confidence: 0.6 }
        });
        break;
      case 'beauty':
        dispatch(toggleBeautyFilter());
        // AI 설정 즉시 업데이트
        mediasoupManager.updateAIConfig({
          beauty: { enabled: !aiState.isBeautyFilterEnabled }
        });
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 설정 패널 */}
          <motion.div
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-96 bg-[#2C2C2E] rounded-2xl shadow-2xl z-50 border border-[#424245]"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-[#424245]">
              <div className="flex items-center space-x-2">
                <CogIcon className="w-5 h-5 text-[#FE7A25]" />
                <h3 className="text-[#FFFFFF] font-semibold font-header">
                  설정
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[#424245] transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-[#A0A0A5]" />
              </button>
            </div>

            {/* 설정 목록 */}
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {/* AI 전체 설정 */}
              <div className="mb-6">
                <ToggleSwitch
                  label="AI 기능 전체"
                  description="모든 AI 기능을 활성화/비활성화합니다"
                  isOn={aiState.isAiEnabled}
                  onToggle={handleAiToggle}
                  icon={<StarIcon className="w-4 h-4" />}
                />
              </div>
              
              {/* AI 세부 기능 섹션 (AI가 활성화된 경우에만 표시) */}
              {aiState.isAiEnabled && (
                <div className="mb-6 bg-[#222222]/30 rounded-lg p-4">
                  <h4 className="text-[#A0A0A5] text-sm font-medium mb-3">
                    AI 세부 기능
                  </h4>

                  <ToggleSwitch
                    label="정적 제스처"
                    description="손 모양으로 이모지 표현 (👍, 👌, ✌️ 등)"
                    isOn={aiState.isStaticGestureDetectionEnabled}
                    onToggle={() => handleFeatureToggle('static')}
                    icon={<HandRaisedIcon className="w-4 h-4" />}
                    cooldownInfo={gestureCooldowns.static}
                  />

                  <ToggleSwitch
                    label="동적 제스처"
                    description="손 움직임으로 이모지 표현 (👋, 🔥, 💖 등)"
                    isOn={aiState.isDynamicGestureDetectionEnabled}
                    onToggle={() => handleFeatureToggle('dynamic')}
                    icon={<SparklesIcon className="w-4 h-4" />}
                    cooldownInfo={gestureCooldowns.dynamic}
                  />
                  
                  <ToggleSwitch
                    label="감정 감지"
                    description="실시간 감정 분석 및 캡처 (😊, 😢, 😮 등)"
                    isOn={aiState.isEmotionDetectionEnabled}
                    onToggle={() => handleFeatureToggle('emotion')}
                    icon={<FaceSmileIcon className="w-4 h-4" />}
                    cooldownInfo={gestureCooldowns.emotion}
                  />
                  
                  <ToggleSwitch
                    label="뷰티 필터"
                    description="AI 기반 자동 보정 및 필터 효과"
                    isOn={aiState.isBeautyFilterEnabled}
                    onToggle={() => handleFeatureToggle('beauty')}
                    icon={<SparklesIcon className="w-4 h-4" />}
                  />
                </div>
              )}

              {/* 미디어 설정 섹션 */}
              <div className="mb-6">
                <h4 className="text-[#A0A0A5] text-sm font-medium mb-3 px-4">
                  미디어 설정
                </h4>

                <div className="p-4 rounded-lg bg-[#222222]/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <VideoCameraIcon className="w-4 h-4 text-[#FE7A25]" />
                      <span className="text-[#FFFFFF] text-sm">카메라</span>
                    </div>
                    <span
                      className={`text-sm ${
                        isCameraOn ? "text-[#FE7A25]" : "text-[#D22016]"
                      }`}
                    >
                      {isCameraOn ? "켜짐" : "꺼짐"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MicrophoneIcon className="w-4 h-4 text-[#FE7A25]" />
                      <span className="text-[#FFFFFF] text-sm">마이크</span>
                    </div>
                    <span
                      className={`text-sm ${
                        isMicOn ? "text-[#FE7A25]" : "text-[#D22016]"
                      }`}
                    >
                      {isMicOn ? "켜짐" : "꺼짐"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ComputerDesktopIcon className="w-4 h-4 text-[#FE7A25]" />
                      <span className="text-[#FFFFFF] text-sm">화면 공유</span>
                    </div>
                    <span
                      className={`text-sm ${
                        isSharing ? "text-[#FE7A25]" : "text-[#A0A0A5]"
                      }`}
                    >
                      {isSharing ? "공유 중" : "꺼짐"}
                    </span>
                  </div>

                  {activeScreenShareCount > 0 && (
                    <div className="mt-2 text-xs text-[#A0A0A5]">
                      총 {activeScreenShareCount}개의 화면이 공유 중
                    </div>
                  )}
                </div>
              </div>

              {/* 향후 기능 섹션 */}
              <div className="mb-4">
                <h4 className="text-[#A0A0A5] text-sm font-medium mb-3 px-4">
                  향후 업데이트 예정
                </h4>

                <ToggleSwitch
                  label="배경 제거"
                  description="AI 기반 실시간 배경 블러/제거"
                  isOn={false}
                  onToggle={() => {}}
                  disabled={true}
                  icon={<VideoCameraIcon className="w-4 h-4" />}
                />
                
                <ToggleSwitch
                  label="음성 향상"
                  description="AI 노이즈 제거 및 음성 최적화"
                  isOn={false}
                  onToggle={() => {}}
                  disabled={true}
                  icon={<MicrophoneIcon className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* 푸터 */}
            <div className="p-4 border-t border-[#424245] text-center">
              <p className="text-[#A0A0A5] text-xs">
                더 많은 기능이 곧 추가될 예정입니다
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

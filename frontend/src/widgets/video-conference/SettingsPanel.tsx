// src/widgets/video-conference/SettingsPanel.tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/shared/hooks/redux";
import {
  toggleStaticGesture,
  toggleDynamicGesture,
} from "@/entities/video-conference/gesture/model/slice";
import {
  XMarkIcon,
  CogIcon,
  HandRaisedIcon,
  SparklesIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// 토글 스위치 컴포넌트
const ToggleSwitch = ({
  label,
  description,
  isOn,
  onToggle,
  disabled = false,
  icon,
}: {
  label: string;
  description?: string;
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
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
  const { isStaticGestureOn, isDynamicGestureOn } = useAppSelector(
    (state) => state.gesture
  );
  const { isCameraOn, isMicOn } = useAppSelector((state) => state.media);
  const { isSharing, activeScreenShareCount } = useAppSelector(
    (state) => state.screenShare
  );

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
              {/* AI 제스처 섹션 */}
              <div className="mb-6">
                <h4 className="text-[#A0A0A5] text-sm font-medium mb-3 px-4">
                  AI 제스처 인식
                </h4>

                <ToggleSwitch
                  label="정적 제스처"
                  description="손 모양으로 이모지 표현 (👍, 👌, ✌️ 등)"
                  isOn={isStaticGestureOn}
                  onToggle={() => dispatch(toggleStaticGesture())}
                  icon={<HandRaisedIcon className="w-4 h-4" />}
                />

                <ToggleSwitch
                  label="동적 제스처"
                  description="손 움직임으로 이모지 표현 (👋, 🔥, 💖 등)"
                  isOn={isDynamicGestureOn}
                  onToggle={() => dispatch(toggleDynamicGesture())}
                  icon={<SparklesIcon className="w-4 h-4" />}
                />
              </div>

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
                        isCameraOn ? "text-[#4ade80]" : "text-[#D22016]"
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
                        isMicOn ? "text-[#4ade80]" : "text-[#D22016]"
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
                        isSharing ? "text-[#4ade80]" : "text-[#A0A0A5]"
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

              {/* 미래 기능 섹션 */}
              <div className="mb-4">
                <h4 className="text-[#A0A0A5] text-sm font-medium mb-3 px-4">
                  고급 기능
                </h4>

                <ToggleSwitch
                  label="뷰티 필터"
                  description="AI 기반 자동 보정 및 필터 효과"
                  isOn={false}
                  onToggle={() => {}}
                  disabled={true}
                  icon={<SparklesIcon className="w-4 h-4" />}
                />

                <ToggleSwitch
                  label="배경 제거"
                  description="AI 기반 실시간 배경 블러/제거"
                  isOn={false}
                  onToggle={() => {}}
                  disabled={true}
                  icon={<VideoCameraIcon className="w-4 h-4" />}
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

// src/widgets/video-conference/AiResultsDisplay.tsx
"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/shared/hooks/redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  HandRaisedIcon,
  SparklesIcon,
  FaceSmileIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";

export const AiResultsDisplay = () => {
  const aiState = useAppSelector((state) => state.ai);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // AI가 비활성화되어 있으면 컴포넌트를 렌더링하지 않음
  if (!aiState.isAiEnabled) {
    return null;
  }

  const hasResults = 
    aiState.detectedGestures.length > 0 || 
    aiState.detectedEmotions.length > 0 || 
    aiState.capturedEmotionFrames.length > 0;

  return (
    <motion.div
      className="fixed top-4 right-4 w-80 bg-[#2C2C2E]/95 backdrop-blur-lg rounded-xl shadow-2xl border border-[#424245] z-30"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b border-[#424245]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#FE7A25] rounded-full animate-pulse" />
          <h3 className="text-[#FFFFFF] font-semibold text-sm">AI 활동 로그</h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-4 h-4 text-[#A0A0A5]" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="max-h-96 overflow-y-auto"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!hasResults ? (
              <div className="p-4 text-center">
                <div className="text-[#A0A0A5] text-sm">
                  AI 기능이 활성화되었습니다. 제스처나 표정을 시도해보세요!
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* 최근 감지된 제스처 */}
                {aiState.detectedGestures.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <HandRaisedIcon className="w-4 h-4 text-[#FE7A25]" />
                      <span className="text-[#FFFFFF] text-sm font-medium">최근 제스처</span>
                    </div>
                    <div className="space-y-1">
                      {aiState.detectedGestures.slice(-3).reverse().map((gesture, index) => (
                        <motion.div
                          key={`${gesture.timestamp}-${index}`}
                          className="flex items-center justify-between p-2 bg-[#424245]/30 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{gesture.emoji}</span>
                            <div>
                              <div className="text-[#FFFFFF] text-xs font-medium">
                                {gesture.userName || "나"}
                              </div>
                              <div className="text-[#A0A0A5] text-xs">
                                {gesture.label}
                              </div>
                            </div>
                          </div>
                          <div className="text-[#FE7A25] text-xs">
                            {((gesture.confidence || 0) * 100).toFixed(0)}%
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 최근 감지된 감정 */}
                {aiState.detectedEmotions.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FaceSmileIcon className="w-4 h-4 text-[#FE7A25]" />
                      <span className="text-[#FFFFFF] text-sm font-medium">최근 감정</span>
                    </div>
                    <div className="space-y-1">
                      {aiState.detectedEmotions.slice(-3).reverse().map((emotion, index) => (
                        <motion.div
                          key={`${emotion.timestamp}-${index}`}
                          className="flex items-center justify-between p-2 bg-[#424245]/30 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-[#FE7A25] rounded-full" />
                            <div>
                              <div className="text-[#FFFFFF] text-xs font-medium">
                                {emotion.userName || "나"}
                              </div>
                              <div className="text-[#A0A0A5] text-xs">
                                {emotion.emotion}
                              </div>
                            </div>
                          </div>
                          <div className="text-[#FE7A25] text-xs">
                            {((emotion.confidence || 0) * 100).toFixed(0)}%
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 캡처된 감정 프레임 */}
                {aiState.capturedEmotionFrames.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <PhotoIcon className="w-4 h-4 text-[#FE7A25]" />
                      <span className="text-[#FFFFFF] text-sm font-medium">
                        캡처된 순간 ({aiState.capturedEmotionFrames.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {aiState.capturedEmotionFrames.slice(-6).reverse().map((frame) => (
                        <motion.div
                          key={frame.id}
                          className="relative group cursor-pointer"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={frame.imageDataUrl}
                            alt={`Emotion: ${frame.emotionData.emotion}`}
                            className="w-full aspect-square object-cover rounded-lg border border-[#424245]"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-white text-xs font-medium">
                                {frame.emotionData.emotion}
                              </div>
                              <div className="text-[#FE7A25] text-xs">
                                {((frame.emotionData.confidence || 0) * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 컴팩트 모드에서 활동 표시 */}
      {!isExpanded && hasResults && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              {aiState.detectedGestures.length > 0 && (
                <div className="flex items-center space-x-1 text-[#A0A0A5]">
                  <HandRaisedIcon className="w-3 h-3" />
                  <span>{aiState.detectedGestures.length}</span>
                </div>
              )}
              {aiState.detectedEmotions.length > 0 && (
                <div className="flex items-center space-x-1 text-[#A0A0A5]">
                  <FaceSmileIcon className="w-3 h-3" />
                  <span>{aiState.detectedEmotions.length}</span>
                </div>
              )}
              {aiState.capturedEmotionFrames.length > 0 && (
                <div className="flex items-center space-x-1 text-[#A0A0A5]">
                  <PhotoIcon className="w-3 h-3" />
                  <span>{aiState.capturedEmotionFrames.length}</span>
                </div>
              )}
            </div>
            <div className="text-[#A0A0A5]">클릭하여 자세히 보기</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
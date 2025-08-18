// src/shared/api/ai/index.ts

import { AppDispatch } from '@/shared/config/store';
import { frontendAiProcessor } from './frontendAiProcessor';
import { aiGestureHandler } from './aiGestureHandler';
import { emotionCaptureManager } from './emotionCaptureManager';

/**
 * AI 시스템 전체를 초기화합니다.
 * frontendAiProcessor, aiGestureHandler, emotionCaptureManager를 순차적으로 초기화하고 연결합니다.
 * @param dispatch Redux dispatch 함수
 */
export async function initializeAISystem(dispatch: AppDispatch): Promise<void> {
  // Client-side check
  if (typeof window === 'undefined') {
    console.warn('AI System: Cannot initialize on server side');
    return;
  }

  try {
    console.log('🤖 Initializing AI System (Frontend Mode)...');
    
    // 1. FrontendAiProcessor 초기화 (메인 스레드에서 MediaPipe 처리)
    await frontendAiProcessor.init(dispatch);

    // 2. AIGestureHandler 초기화
    aiGestureHandler.init(dispatch);

    // 3. EmotionCaptureManager 초기화
    emotionCaptureManager.init(dispatch);

    // 4. Frontend AI 프로세서의 결과 콜백을 AI 제스처 핸들러에 연결합니다.
    frontendAiProcessor.setGestureCallback(aiGestureHandler.handleGestureResult.bind(aiGestureHandler));
    frontendAiProcessor.setEmotionCallback(aiGestureHandler.handleEmotionResult.bind(aiGestureHandler));

    console.log('✅ AI System (Frontend Mode) initialized successfully.');
  } catch (error) {
    console.error('❌ AI System initialization failed:', error);
    throw error;
  }
}

/**
 * AI 시스템과 관련된 모든 리소스를 정리합니다.
 */
export function cleanupAISystem(): void {
  frontendAiProcessor.cleanup(); // Frontend AI Processor 정리
  aiGestureHandler.cleanup(); // AI Gesture Handler 정리
  emotionCaptureManager.cleanup(); // Emotion Capture Manager 정리
  console.log('🧹 AI System cleaned up.');
}

// 외부에서 접근할 수 있도록 주요 AI 모듈을 export합니다.
export {
  frontendAiProcessor,
  aiGestureHandler,
  emotionCaptureManager,
};
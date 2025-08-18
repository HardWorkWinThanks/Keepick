// src/shared/types/ai.types.ts

// ============================================================================
// AI 감정 데이터 (클라이언트 내부에서만 사용)
// ============================================================================
export interface EmotionData {
  roomId: string;
  userId: string;
  userName: string;
  emotion: string; // 감정 라벨 (예: "laugh", "surprise", "serious")
  confidence?: number; // 감정 인식 신뢰도 (선택 사항)
  timestamp: number;
  faceLandmarks?: number[][]; // 추가: MediaPipe 얼굴 랜드마크 데이터
}

// ============================================================================
// AI 추론 결과 타입 정의
// ============================================================================
export interface GestureResult {
  type: "gesture";
  static: { label: string; confidence: number };
  dynamic: { label: string; confidence: number };
  landmarks?: number[][]; // 추가: MediaPipe 손 랜드마크 데이터 (정규화된 좌표)
  timestamp: number;
}

export interface EmotionResult {
  type: "emotion";
  label: string;
  confidence: number;
  faceLandmarks?: number[][]; // (선택 사항) MediaPipe 얼굴 랜드마크 데이터
  timestamp: number;
}

// ============================================================================
// AiTestDisplay 컴포넌트에서 기대하는 결과 타입
// AiTestDisplay에 표시될 정보만 간추린 타입
// ============================================================================
export interface AiTestResult {
  type: "gesture" | "emotion";
  label: string;
  confidence?: number;
  timestamp: number;
}

// ============================================================================
// AI 시스템 전체 설정
// ============================================================================
export interface AiSystemConfig {
  gesture: {
    static: { enabled: boolean; confidence: number };
    dynamic: { enabled: boolean; confidence: number };
  };
  emotion: { enabled: boolean; confidence: number };
  beauty: {
    enabled: boolean;
    gamma?: number;
    lipAlpha?: number;
    smoothAmount?: number;
    lipColor?: [number, number, number];
  };
}

// ============================================================================
// 콜백 함수 타입 정의
// ============================================================================
export type GestureCallback = (result: GestureResult) => void;
export type EmotionCallback = (result: EmotionResult) => void;

// ============================================================================
// 캡처된 프레임 타입 (감정 기반 이미지 캡처용)
// ============================================================================
export interface CapturedFrame {
  id: string;
  emotionData: EmotionData;
  imageDataUrl: string; // base64 encoded image
  timestamp: number;
}

// ============================================================================
// aiSlice에서 사용하는 GestureData (socket.types에서 이동 또는 복사)
// 랜드마크를 저장하기 위해 landmarks 속성 추가
// ============================================================================
export interface GestureData {
  roomId: string;
  gestureType: "static" | "dynamic";
  label: string;
  emoji: string;
  confidence?: number;
  timestamp: number;
  userId: string;
  userName: string;
  landmarks?: number[][]; // 추가: MediaPipe 손 랜드마크 데이터
}

export interface GestureEffectData {
  roomId: string;
  effect: string;
  emoji: string;
  timestamp: number;
  userId: string;
  userName: string;
  duration?: number;
}

export interface GestureStatusData {
  roomId: string;
  userName: string;
  staticGestureEnabled: boolean;
  dynamicGestureEnabled: boolean;
}

// ============================================================================
// AiTestDisplay용 데이터 변환 함수
// aiSlice.ts에 저장된 GestureData 및 EmotionData를 AiTestResult 형식으로 변환
// ============================================================================

/**
 * Redux 스토어의 GestureData 배열을 AiTestDisplay에 맞는 AiTestResult 배열로 변환합니다.
 */
export const convertGestureDataToAiTestResults = (
  gestureDataArray: GestureData[]
): AiTestResult[] => {
  return gestureDataArray.map((gesture) => ({
    type: "gesture",
    label: gesture.label,
    confidence: gesture.confidence,
    timestamp: gesture.timestamp,
  }));
};

/**
 * Redux 스토어의 EmotionData 배열을 AiTestDisplay에 맞는 AiTestResult 배열로 변환합니다.
 */
export const convertEmotionDataToAiTestResults = (
  emotionDataArray: EmotionData[]
): AiTestResult[] => {
  return emotionDataArray.map((emotion) => ({
    type: "emotion",
    label: emotion.emotion, // EmotionData의 'emotion' 필드를 AiTestResult의 'label'로 매핑
    confidence: emotion.confidence,
    timestamp: emotion.timestamp,
  }));
};

// ============================================================================
// AI 콜백으로부터 받은 GestureResult, EmotionResult를 aiSlice에 저장하기 위한 변환 함수
// (이 함수들은 aiSlice의 addDetectedGesture/Emotion 액션에 사용될 수 있습니다.)
// ============================================================================

// GestureResult를 aiSlice의 GestureData로 변환하는 함수
export const convertGestureResultToGestureData = (
  result: GestureResult,
  roomId: string,
  userId: string,
  userName: string
): GestureData => {
  // 예시: static 제스처를 우선으로 GestureData를 생성합니다.
  // 실제 로직에 따라 dynamic도 고려하거나 더 복잡한 매핑이 필요할 수 있습니다.
  const selectedLabel =
    result.static.confidence > result.dynamic.confidence
      ? result.static.label
      : result.dynamic.label;
  const selectedConfidence =
    result.static.confidence > result.dynamic.confidence
      ? result.static.confidence
      : result.dynamic.confidence;

  return {
    roomId,
    gestureType: result.static.confidence > result.dynamic.confidence ? "static" : "dynamic",
    label: selectedLabel,
    emoji: "👋", // 적절한 이모지 매핑 로직 필요 (예: GESTURE_LABELS에서 찾아오기)
    confidence: selectedConfidence,
    timestamp: result.timestamp,
    userId,
    userName,
    landmarks: result.landmarks, // 랜드마크 데이터 포함
  };
};

// EmotionResult를 aiSlice의 EmotionData로 변환하는 함수
export const convertEmotionResultToEmotionData = (
  result: EmotionResult,
  roomId: string,
  userId: string,
  userName: string
): EmotionData => {
  return {
    roomId,
    userId,
    userName,
    emotion: result.label,
    confidence: result.confidence,
    timestamp: result.timestamp,
    faceLandmarks: result.faceLandmarks, // 랜드마크 데이터 포함
  };
};

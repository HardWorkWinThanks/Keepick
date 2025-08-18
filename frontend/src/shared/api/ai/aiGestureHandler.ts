// src/shared/api/ai/aiGestureHandler.ts

// Redux 관련 임포트: 실제 프로젝트의 파일 경로를 사용합니다.
import { AppDispatch } from "@/shared/config/store"; // AppDispatch 임포트
// aiSlice.ts에서 액션 크리에이터 임포트
import {
  addDetectedEmotion,
  addDetectedGesture,
} from "@/entities/video-conference/ai/model/aiSlice";
// 이모지 리액션 액션 (aiSlice.ts에 없지만, 별도의 slice에서 올 수 있다고 가정하고 임포트)
import { addReaction } from "@/entities/emoji-reaction/model/slice"; // 이 경로가 맞는지 확인 필요

// AI 및 소켓 관련 타입 임포트
import { GestureResult, EmotionResult, EmotionData } from "@/shared/types/ai.types";
import { GestureData, GestureEffectData } from "@/shared/types/ai.types";

// EmotionCaptureManager 임포트
import { emotionCaptureManager } from "./emotionCaptureManager";

// 전역 window 객체에 gestureHandler를 노출하는 인터페이스 (socket/gestureHandler.ts에서 사용)
declare global {
  interface Window {
    gestureHandler?: {
      broadcastGesture: (data: GestureData | GestureEffectData) => void;
      broadcastGestureEffect: (data: GestureEffectData) => void;
    };
  }
}

class AIGestureHandler {
  private dispatch: AppDispatch | null = null;
  private currentRoomId = "";
  private userId = "";
  private userName = "";
  private gesturesCooldown = new Map<string, number>(); // 키: `type_label` (예: `static_good`), 값: 마지막 전송 시간
  private emotionsCooldown = new Map<string, number>(); // 키: `emotion_label` (예: `emotion_laugh`), 값: 마지막 전송 시간

  private readonly GESTURE_COOLDOWN = 3000; // 제스처 쿨다운 (3초)
  private readonly EMOTION_COOLDOWN = 5000; // 감정 쿨다운 (5초)

  /**
   * AIGestureHandler를 초기화하고 사용자 정보를 설정합니다.
   * @param dispatch Redux dispatch 함수
   */
  public init(dispatch: AppDispatch): void {
    this.dispatch = dispatch;
    this.setupUserInfo();
    console.log("AIGestureHandler initialized.");
  }

  /**
   * 현재 사용자 ID, 사용자 이름, 방 ID를 설정합니다.
   * (로컬 스토리지 또는 다른 사용자 정보 관리 방식에 따라 구현 필요)
   */
  private setupUserInfo(): void {
    this.currentRoomId = this.getCurrentRoomId();
    this.userId = this.getUserId();
    this.userName = this.getUserName();
  }

  /**
   * AI 비디오 프로세서에서 감지된 제스처 결과를 처리합니다.
   * @param result AI 워커로부터 받은 제스처 결과
   */
  public handleGestureResult(result: GestureResult): void {
    if (!this.currentRoomId || !result || !this.dispatch) return;

    const now = Date.now();

    // 정적 제스처 처리
    if (result.static && result.static.label !== "none" && result.static.confidence >= 0.75) {
      const cooldownKey = `static_${result.static.label}`;
      const lastSent = this.gesturesCooldown.get(cooldownKey) || 0;

      if (now - lastSent > this.GESTURE_COOLDOWN) {
        const gestureData: GestureData = {
          roomId: this.currentRoomId,
          userId: this.userId,
          userName: this.userName,
          gestureType: "static",
          label: result.static.label,
          emoji: this.mapStaticGestureToEmoji(result.static.label),
          confidence: result.static.confidence,
          timestamp: now,
        };
        this.sendStaticGesture(gestureData);
        this.gesturesCooldown.set(cooldownKey, now);
        this.dispatch(addDetectedGesture(gestureData));
      }
    }

    // 동적 제스처 처리
    if (result.dynamic && result.dynamic.label !== "none" && result.dynamic.confidence >= 0.9) {
      const cooldownKey = `dynamic_${result.dynamic.label}`;
      const lastSent = this.gesturesCooldown.get(cooldownKey) || 0;

      if (now - lastSent > this.GESTURE_COOLDOWN) {
        const gestureEffectData: GestureEffectData = {
          roomId: this.currentRoomId,
          userId: this.userId,
          userName: this.userName,
          effect: this.mapDynamicGestureToEffect(result.dynamic.label),
          emoji: this.mapDynamicGestureToEffect(result.dynamic.label), // 효과와 이모지 동일하게 설정
          timestamp: now,
          duration: 2000, // 동적 제스처 효과 지속 시간
        };
        this.sendDynamicGesture(gestureEffectData);
        this.gesturesCooldown.set(cooldownKey, now);
        this.dispatch(
          addDetectedGesture({
            ...gestureEffectData,
            gestureType: "dynamic",
            label: result.dynamic.label,
          })
        ); // Redux에 제스처 기록
      }
    }
  }

  /**
   * AI 비디오 프로세서에서 감지된 감정 결과를 처리합니다.
   * @param result AI 워커로부터 받은 감정 결과
   */
  public handleEmotionResult(result: EmotionResult): void {
    if (!this.currentRoomId || !result || result.label === "none" || !this.dispatch) return;

    const now = Date.now();
    const cooldownKey = `emotion_${result.label}`;
    const lastSent = this.emotionsCooldown.get(cooldownKey) || 0;

    if (now - lastSent > this.EMOTION_COOLDOWN && result.confidence >= 0.8) {
      // 감정 인식 신뢰도 임계값 0.80
      const emotionData: EmotionData = {
        roomId: this.currentRoomId,
        userId: this.userId,
        userName: this.userName,
        emotion: result.label,
        confidence: result.confidence,
        timestamp: now,
      };

      // emotionCaptureManager를 통해 프레임 캡처 요청
      emotionCaptureManager
        .captureEmotionFrame(emotionData)
        .catch((error) => console.error("Failed to capture emotion frame:", error));

      this.dispatch(addDetectedEmotion(emotionData)); // 감지된 감정 Redux에 디스패치
      this.dispatch(
        addReaction({
          // 이모지 리액션 디스패치
          id: `${this.userId}_${now}`,
          emoji: this.mapEmotionToEmoji(result.label),
          userId: this.userId,
          userName: this.userName,
          timestamp: now,
          duration: 3000,
        })
      );

      this.emotionsCooldown.set(cooldownKey, now); // 쿨다운 시간 업데이트
      console.log(
        `[AIGestureHandler] Emotion detected locally: ${emotionData.emotion} (${
          emotionData.confidence?.toFixed(2) || "N/A"
        }). Triggering capture.`
      );
    }
  }

  /**
   * 정적 제스처 데이터를 서버로 전송합니다.
   * @param gestureData 전송할 정적 제스처 데이터
   */
  private sendStaticGesture(gestureData: GestureData): void {
    if (window.gestureHandler) {
      window.gestureHandler.broadcastGesture(gestureData);
      console.log(`[AIGestureHandler] Static gesture sent: ${gestureData.label}`);
    } else {
      console.warn(
        "[AIGestureHandler] window.gestureHandler is not available. Static gesture not broadcasted."
      );
    }
  }

  /**
   * 동적 제스처 데이터를 서버로 전송합니다.
   * @param gestureEffectData 전송할 동적 제스처 효과 데이터
   */
  private sendDynamicGesture(gestureEffectData: GestureEffectData): void {
    if (window.gestureHandler) {
      window.gestureHandler.broadcastGestureEffect(gestureEffectData); // broadcastGestureEffect 사용
      console.log(`[AIGestureHandler] Dynamic gesture sent: ${gestureEffectData.effect}`);
    } else {
      console.warn(
        "[AIGestureHandler] window.gestureHandler is not available. Dynamic gesture not broadcasted."
      );
    }
  }

  /**
   * 정적 제스처 라벨을 해당 이모지 문자열로 매핑합니다.
   */
  private mapStaticGestureToEmoji(label: string): string {
    const mapping: Record<string, string> = {
      good: "👍",
      bad: "👎",
      fist: "✊",
      heart: "🫶",
      ok: "👌",
      victory: "✌️",
      promise: "🤙",
      gun: "👉",
    };
    return mapping[label] || "✨";
  }

  /**
   * 동적 제스처 라벨을 시각적 효과 이모지 문자열로 매핑합니다.
   */
  private mapDynamicGestureToEffect(label: string): string {
    const mapping: Record<string, string> = {
      fire: "🔥",
      hi: "👋",
      hit: "💥",
      nono: "🚫",
      nyan: "🐾",
      shot: "💖",
    };
    return mapping[label] || "✨";
  }

  /**
   * 감정 라벨을 해당 이모지 문자열로 매핑합니다.
   */
  private mapEmotionToEmoji(label: string): string {
    const mapping: Record<string, string> = {
      laugh: "😂",
      serious: "😐",
      surprise: "😲",
      yawn: "🥱",
    };
    return mapping[label] || "❓";
  }

  /**
   * 서버로부터 받은 원격 제스처 이벤트를 처리합니다.
   * @param data 수신된 제스처 데이터 (GestureData 또는 GestureEffectData)
   */
  public handleReceivedGesture(data: GestureData | GestureEffectData): void {
    if (!this.dispatch) return;
    if ("userId" in data && data.userId === this.userId) return; // 본인에게서 온 이벤트는 무시

    if ("gestureType" in data) {
      // 정적 또는 동적 제스처 데이터
      console.log(`[AIGestureHandler] Received gesture: ${data.gestureType} from ${data.userName}`);
      this.dispatch(addDetectedGesture(data));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("remoteGestureReceived", { detail: data }));
      }
    } else if ("effect" in data) {
      // 제스처 효과 데이터
      console.log(`[AIGestureHandler] Received effect: ${data.effect} from ${data.userName}`);
      this.dispatch(
        addReaction({
          id: `${data.userId}_${data.timestamp}`,
          emoji: data.emoji,
          userId: data.userId,
          userName: data.userName,
          timestamp: data.timestamp,
          duration: data.duration || 3000,
        })
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("remoteEffectReceived", { detail: data }));
      }
    }
  }

  /**
   * 방 정보가 변경되었을 때 쿨다운 상태를 초기화합니다.
   * @param roomId 새로운 방 ID
   */
  public updateRoomInfo(roomId: string): void {
    this.currentRoomId = roomId;
    this.gesturesCooldown.clear();
    this.emotionsCooldown.clear();
    console.log(`[AIGestureHandler] Room updated to ${roomId}`);
  }

  /**
   * 사용자 정보가 변경되었을 때 업데이트합니다.
   * @param userId 사용자 ID
   * @param userName 사용자 이름
   */
  public updateUserInfo(userId: string, userName: string): void {
    this.userId = userId;
    this.userName = userName;
    console.log(`[AIGestureHandler] User updated: ${userName} (${userId})`);
  }

  /**
   * 현재 URL 경로에서 방 ID를 추출합니다.
   * (실제 구현에 따라 적절히 수정 필요)
   */
  private getCurrentRoomId(): string {
    if (typeof window === "undefined") return "default_room"; // 서버 사이드 렌더링 환경 고려
    const path = window.location.pathname;
    const match = path.match(/\/groupchat\/([^\/\?#]+)/);
    return match ? decodeURIComponent(match[1]) : "default_room";
  }

  /**
   * 로컬 스토리지에서 사용자 ID를 가져옵니다.
   * (실제 구현에 따라 적절히 수정 필요)
   */
  private getUserId(): string {
    if (typeof localStorage === "undefined") return "anonymous_user";
    return localStorage.getItem("userId") || "anonymous_user";
  }

  /**
   * 로컬 스토리지에서 사용자 이름을 가져옵니다.
   * (실제 구현에 따라 적절히 수정 필요)
   */
  private getUserName(): string {
    if (typeof localStorage === "undefined") return "Anonymous User";
    return localStorage.getItem("userName") || "Anonymous User";
  }

  /**
   * AIGestureHandler 인스턴스를 정리합니다.
   */
  public cleanup(): void {
    this.gesturesCooldown.clear();
    this.emotionsCooldown.clear();
    this.dispatch = null;
    console.log("[AIGestureHandler] Cleaned up.");
  }
}

export const aiGestureHandler = new AIGestureHandler();

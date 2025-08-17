// src/shared/api/ai/frontendAiProcessor.ts

import { AppDispatch } from "@/shared/config/store";
import {
  GestureResult,
  EmotionResult,
  AiSystemConfig,
  GestureCallback,
  EmotionCallback,
} from "@/shared/types/ai.types";

import { emotionCaptureManager } from "./emotionCaptureManager";
import { EmotionFaceProcessor } from "./emotionFaceProcessor";
import { BeautyFilterProcessor } from "./beautyFilterProcessor";
import { GestureProcessor } from "./gestureProcessor";
import * as tf from "@tensorflow/tfjs";

// --- AI 모델 경로 상수 정의 ---
// Next.js의 public 폴더는 서버 루트(/)에서 접근 가능합니다.
const MODELS_BASE_PATH = "/models";

// 표정 인식 모델 경로
const EXPRESSION_MODEL_PATH = `${MODELS_BASE_PATH}/expression/model.json`;
const EXPRESSION_SCALER_PATH = `${MODELS_BASE_PATH}/expression/scaler_v3.json`;

// 제스처 인식 모델 경로 (GestureProcessor 내부에서 사용될 경로)
const STATIC_GESTURE_MODEL_PATH = `${MODELS_BASE_PATH}/static-gesture/model.json`;
const DYNAMIC_GESTURE_MODEL_PATH = `${MODELS_BASE_PATH}/dinamic-gesture/model.json`; // 실제 폴더명에 맞춰 수정

// MediaPipe WASM 파일 CDN 경로
const FACE_MESH_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh";
const TASKS_VISION_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

class FrontendAiProcessor {
  private dispatch: AppDispatch | null = null;
  private aiConfig: AiSystemConfig = {
    gesture: {
      static: { enabled: true, confidence: 0.75 },
      dynamic: { enabled: true, confidence: 0.9 },
    },
    emotion: { enabled: false, confidence: 0.6 },
    beauty: { enabled: false, gamma: 1.4, lipAlpha: 0.2, smoothAmount: 30, lipColor: [255, 0, 0] },
  };

  private emotionFaceProcessor: EmotionFaceProcessor | null = null;
  private beautyFilterProcessor: BeautyFilterProcessor | null = null;
  private gestureProcessor: GestureProcessor | null = null;
  private isInitialized = false;

  private onGestureResultCallback: GestureCallback | null = null;
  private onEmotionResultCallback: EmotionCallback | null = null;

  private lastFrameTime = 0;
  private frameInterval = 100;
  
  // 백그라운드 분석용 변수들
  private backgroundVideoElement: HTMLVideoElement | null = null;
  private backgroundAnalysisActive = false;
  private backgroundAnalysisLoop: number | null = null;
  
  // AI 결과 표시 속도 제어
  private lastGestureResultTime = 0;
  private lastEmotionResultTime = 0;
  private readonly GESTURE_RESULT_INTERVAL = 1500; // 제스처 결과 간격 (ms)
  private readonly EMOTION_RESULT_INTERVAL = 1500; // 감정 결과 간격 (ms)

  private activeGestureEmojis: Map<string, any> = new Map();

  private readonly STATIC_GESTURE_DURATION = 1500;
  private readonly DYNAMIC_GESTURE_DURATION = 1500;
  private readonly ANIMATION_FADE_DURATION = 150;

  private activeSourceTrack: MediaStreamTrack | null = null; // 현재 사용 중인 원본 트랙 저장
  private activeProcessedTrack: MediaStreamTrack | null = null; // 생성된 AI 처리 트랙 저장


  public async init(dispatch: AppDispatch): Promise<void> {
    this.dispatch = dispatch;
    emotionCaptureManager.init(dispatch);
    try {
      await tf.setBackend('webgl'); // WebGL 백엔드 설정
      console.log(`TensorFlow.js backend set to: ${tf.getBackend()}`);
    } catch (error) {
      console.warn("❌ Failed to set TensorFlow.js WebGL backend, falling back to CPU:", error);
      // WebGL 실패 시 자동으로 CPU나 WASM으로 폴백될 수 있으나, 명시적으로 설정할 수도 있습니다.
      // await tf.setBackend('cpu'); // 또는 'wasm'
    }

    this.emotionFaceProcessor = new EmotionFaceProcessor(this.aiConfig);
    this.beautyFilterProcessor = new BeautyFilterProcessor(this.aiConfig);
    this.gestureProcessor = new GestureProcessor(this.aiConfig);

    try {
      console.log("🤖 Initializing AI models...");
      console.log(`- Emotion model: ${EXPRESSION_MODEL_PATH}`);
      console.log(`- Emotion scaler: ${EXPRESSION_SCALER_PATH}`);

      await Promise.all([
        // 정의된 경로 변수를 사용하여 초기화
        this.emotionFaceProcessor.init(
          EXPRESSION_MODEL_PATH,
          EXPRESSION_SCALER_PATH,
          FACE_MESH_WASM_PATH
        ),
        this.beautyFilterProcessor.init(FACE_MESH_WASM_PATH),
        this.gestureProcessor.init(TASKS_VISION_WASM_PATH),
      ]);

      console.log(`- Static gesture model: ${STATIC_GESTURE_MODEL_PATH}`);
      console.log(`- Dynamic gesture model: ${DYNAMIC_GESTURE_MODEL_PATH}`);

      this.isInitialized = true;
      console.log("✅ FrontendAiProcessor initialized successfully.");
    } catch (error) {
      console.error("❌ FrontendAiProcessor: Failed to initialize AI models:", error);
      this.isInitialized = false;
    }
  }

  public updateConfig(config: Partial<AiSystemConfig>): Promise<void> {
    return Promise.resolve().then(() => {
      this.aiConfig = {
        ...this.aiConfig,
        ...config,
        gesture: { ...this.aiConfig.gesture, ...config.gesture },
        emotion: { ...this.aiConfig.emotion, ...config.emotion },
        beauty: { ...this.aiConfig.beauty, ...config.beauty },
      };

      this.emotionFaceProcessor?.updateConfig(this.aiConfig);
      this.beautyFilterProcessor?.updateConfig(this.aiConfig);
      this.gestureProcessor?.updateConfig(this.aiConfig);
    });
  }

  public setGestureCallback(callback: GestureCallback): void {
    this.onGestureResultCallback = callback;
  }

  public setEmotionCallback(callback: EmotionCallback): void {
    this.onEmotionResultCallback = callback;
  }

  /**
   * 백그라운드에서 AI 분석을 시작합니다 (트랙 교체 없음)
   * @param originalTrack 원본 비디오 트랙
   */
  public startBackgroundAnalysis(originalTrack: MediaStreamTrack): void {
    if (originalTrack.kind !== "video") {
      console.warn("Only video tracks can be analyzed.");
      return;
    }

    console.log("🤖 Starting background AI analysis...");
    
    // 기존 분석이 있다면 중지
    this.stopBackgroundAnalysis();

    // 백그라운드 비디오 엘리먼트 생성
    this.backgroundVideoElement = document.createElement("video");
    this.backgroundVideoElement.srcObject = new MediaStream([originalTrack]);
    this.backgroundVideoElement.autoplay = true;
    this.backgroundVideoElement.muted = true;
    this.backgroundVideoElement.style.display = "none"; // 화면에 표시하지 않음

    this.backgroundVideoElement.onloadedmetadata = () => {
      this.backgroundAnalysisActive = true;
      this.runBackgroundAnalysisLoop();
      console.log("✅ Background AI analysis started");
      
    };

    // 비디오 재생 시작
    this.backgroundVideoElement.play();
  }

  /**
   * 백그라운드 AI 분석을 중지합니다
   */
  public stopBackgroundAnalysis(): void {
    console.log("🛑 Stopping background AI analysis...");
    
    this.backgroundAnalysisActive = false;
    
    if (this.backgroundAnalysisLoop) {
      cancelAnimationFrame(this.backgroundAnalysisLoop);
      this.backgroundAnalysisLoop = null;
    }

    if (this.backgroundVideoElement) {
      this.backgroundVideoElement.pause();
      this.backgroundVideoElement.srcObject = null;
      this.backgroundVideoElement = null;
    }

    console.log("✅ Background AI analysis stopped");
  }

  /**
   * 백그라운드 분석 루프를 실행합니다
   */
  private runBackgroundAnalysisLoop(): void {
    if (!this.backgroundAnalysisActive || !this.backgroundVideoElement) {
      console.log("⚠️ Background analysis not active or video element missing");
      return;
    }

    console.log("🔄 Starting background analysis loop...");

    const processFrame = async () => {
      if (!this.backgroundAnalysisActive || !this.backgroundVideoElement) {
        console.log("🛑 Background analysis loop stopped");
        return;
      }

      const now = performance.now();
      const needsProcessing = now - this.lastFrameTime >= this.frameInterval;

      if (needsProcessing && this.isInitialized) {
        console.log("🔄 Processing frame in background...");
        this.lastFrameTime = now;
        try {
          await this.runAIProcessors(this.backgroundVideoElement, now);
        } catch (e) {
          console.error("❌ Error in background AI processing:", e);
        }
      }

      this.backgroundAnalysisLoop = requestAnimationFrame(processFrame);
    };

    processFrame();
  }

  public async processVideoTrack(originalTrack: MediaStreamTrack): Promise<MediaStreamTrack> {
    if (originalTrack.kind !== "video") {
      console.warn("Only video tracks can be AI processed.");
      return originalTrack;
    }

    this.stopProcessing();

    this.activeSourceTrack = originalTrack;

    console.log("🎯 Starting AI video track processing...", {
      trackSettings: originalTrack.getSettings(),
      isInitialized: this.isInitialized
    });

    const videoElem = document.createElement("video");
    videoElem.srcObject = new MediaStream([originalTrack]);
    videoElem.autoplay = true;
    videoElem.muted = true;

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = originalTrack.getSettings().width || 640;
    outputCanvas.height = originalTrack.getSettings().height || 480;
    const ctx = outputCanvas.getContext("2d");

    return new Promise<MediaStreamTrack>((resolve, reject) => {
      let isResolved = false;
      
      // 타임아웃 설정
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.error("❌ AI video track processing timeout");
          reject(new Error("AI video track processing timeout"));
        }
      }, 10000); // 10초 타임아웃

      videoElem.onloadedmetadata = () => {
        console.log("📹 Video metadata loaded, starting frame processing...");
        
        const processFrame = async () => {
          if (videoElem.paused || videoElem.ended) return;

          const now = performance.now();
          const needsProcessing = now - this.lastFrameTime >= this.frameInterval;

          if (ctx) {
            ctx.drawImage(videoElem, 0, 0, outputCanvas.width, outputCanvas.height);
            if (this.aiConfig.beauty.enabled && this.beautyFilterProcessor) {
              const imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
              const filteredData = await this.beautyFilterProcessor.applyFilters(imageData);
              ctx.putImageData(filteredData, 0, 0);
            }

            this.renderGestureOverlays(ctx, outputCanvas, now);

            if (
              needsProcessing &&
              this.isInitialized &&
              this.gestureProcessor &&
              this.emotionFaceProcessor
            ) {
              this.lastFrameTime = now;
              try {
                await this.runAIProcessors(videoElem, now);
              } catch (e) {
                console.error("Error processing AI for frame:", e);
              }
            }
          }
          requestAnimationFrame(processFrame);
        };
        
        videoElem.onplaying = () => {
          if (!isResolved) {
            console.log("▶️ Video started playing, returning AI-processed track");
            const processedStream = outputCanvas.captureStream(30); // 30 FPS
            const processedTrack = processedStream.getVideoTracks()[0];
            
            if (processedTrack) {
              isResolved = true;
              clearTimeout(timeout);
              console.log("✅ AI-processed track ready:", {
                trackId: processedTrack.id,
                enabled: processedTrack.enabled,
                readyState: processedTrack.readyState
              });
              this.activeProcessedTrack = processedTrack;
              resolve(processedTrack);
            } else {
              console.error("❌ Failed to get processed track from canvas stream");
              reject(new Error("Failed to get processed track from canvas stream"));
            }
          }
        };
        
        videoElem.play().then(() => {
          processFrame();
        }).catch((error) => {
          console.error("❌ Failed to start video playback:", error);
          reject(error);
        });
      };

      videoElem.onerror = (error) => {
        console.error("❌ Video element error:", error);
        clearTimeout(timeout);
        reject(new Error("Video element error"));
      };
    });
  }

  

  private async runAIProcessors(videoElement: HTMLVideoElement, timestamp: number): Promise<void> {
    if (!this.isInitialized) {
      console.log("⚠️ AI processors not initialized");
      return;
    }
    
    console.log("🤖 Running AI processors...", {
      emotionEnabled: this.aiConfig.emotion.enabled,
      gestureStaticEnabled: this.aiConfig.gesture.static.enabled,
      gestureDynamicEnabled: this.aiConfig.gesture.dynamic.enabled
    });
    
    // 감정 인식 처리 (속도 제어 적용)
    if (this.aiConfig.emotion.enabled && this.emotionFaceProcessor) {
      console.log("😊 Processing emotion...");
      const faceCanvas = document.createElement("canvas");
      faceCanvas.width = videoElement.videoWidth;
      faceCanvas.height = videoElement.videoHeight;
      const ctx = faceCanvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoElement, 0, 0, faceCanvas.width, faceCanvas.height);
      const faceImageData = ctx.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
      const emotionResult = await this.emotionFaceProcessor.detectEmotion(faceImageData, timestamp);
      
      console.log("😊 Emotion result:", emotionResult);
      
      if (emotionResult && this.onEmotionResultCallback) {
        // 감정 결과 표시 간격 제어
        const timeSinceLastEmotion = timestamp - this.lastEmotionResultTime;
        if (timeSinceLastEmotion >= this.EMOTION_RESULT_INTERVAL || emotionResult.label !== "none") {
          console.log("😊 Calling emotion callback...");
          this.onEmotionResultCallback(emotionResult);
          this.lastEmotionResultTime = timestamp;
          // Add emotion overlay
          this.addEmotionOverlay(emotionResult, timestamp);
        }
      }
    }

    // 제스처 인식 처리 (속도 제어 적용)
    if (
      (this.aiConfig.gesture.static.enabled || this.aiConfig.gesture.dynamic.enabled) &&
      this.gestureProcessor
    ) {
      console.log("🤲 Processing gestures...");
      const gestureResult = await this.gestureProcessor.detectGestures(videoElement, timestamp);
      
      console.log("🤲 Gesture result:", gestureResult);
      
      if (gestureResult && this.onGestureResultCallback) {
        // 제스처 결과 표시 간격 제어 (none이 아닌 경우만 즉시 표시)
        const timeSinceLastGesture = timestamp - this.lastGestureResultTime;
        const hasValidGesture = gestureResult.static.label !== "none" || gestureResult.dynamic.label !== "none";
        
        if (timeSinceLastGesture >= this.GESTURE_RESULT_INTERVAL || hasValidGesture) {
          console.log("🤲 Calling gesture callback...");
          this.onGestureResultCallback(gestureResult);
          this.lastGestureResultTime = timestamp;
          // Add gesture overlay
          this.addGestureOverlay(gestureResult, timestamp);
        }
      }
    }
  }

  private renderGestureOverlays(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    now: number
  ): void {
    this.activeGestureEmojis.forEach((item, key) => {
      const elapsed = now - item.timestamp;
      const remaining = item.duration - elapsed;
      if (remaining > 0) {
        this.updateGestureAnimation(item, elapsed);
        const x = item.x * canvas.width;
        const y = item.y * canvas.height;
        ctx.save();
        ctx.globalAlpha = item.opacity;
        ctx.translate(x, y);
        ctx.scale(item.scale, item.scale);
        ctx.translate(-x, -y);
        const fontSize = Math.min(canvas.width, canvas.height) * 0.08;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.emoji, x, y);
        ctx.restore();
      } else {
        this.activeGestureEmojis.delete(key);
      }
    });
  }

  private updateGestureAnimation(item: any, elapsed: number): void {
    if (elapsed < this.ANIMATION_FADE_DURATION) {
      const progress = elapsed / this.ANIMATION_FADE_DURATION;
      item.opacity = progress;
      item.scale = 1.2 + 0.3 * (1 - progress);
      item.animationPhase = "fadeIn";
    } else if (elapsed < item.duration - this.ANIMATION_FADE_DURATION) {
      item.opacity = 1.0;
      item.scale = 1.2;
      item.animationPhase = "display";
    } else {
      const fadeOutProgress =
        (elapsed - (item.duration - this.ANIMATION_FADE_DURATION)) / this.ANIMATION_FADE_DURATION;
      item.opacity = 1.0 - fadeOutProgress;
      item.scale = 1.2 - 0.2 * fadeOutProgress;
      item.animationPhase = "fadeOut";
    }
  }

  private addGestureOverlay(gestureResult: GestureResult, timestamp: number): void {
    // Static gesture overlay
    if (gestureResult.static && gestureResult.static.label !== "none" && gestureResult.static.confidence > 0.7) {
      const emoji = this.getGestureEmoji(gestureResult.static.label);
      const key = `static_${gestureResult.static.label}_${timestamp}`;
      this.activeGestureEmojis.set(key, {
        emoji,
        x: 0.3 + Math.random() * 0.4, // Random position
        y: 0.3 + Math.random() * 0.4,
        timestamp,
        duration: this.STATIC_GESTURE_DURATION,
        opacity: 0,
        scale: 5,
        animationPhase: "fadeIn"
      });
    }

    // Dynamic gesture overlay
    if (gestureResult.dynamic && gestureResult.dynamic.label !== "none" && gestureResult.dynamic.confidence > 0.8) {
      const emoji = this.getGestureEmoji(gestureResult.dynamic.label);
      const key = `dynamic_${gestureResult.dynamic.label}_${timestamp}`;
      this.activeGestureEmojis.set(key, {
        emoji,
        x: 0.2 + Math.random() * 0.6,
        y: 0.2 + Math.random() * 0.6,
        timestamp,
        duration: this.DYNAMIC_GESTURE_DURATION,
        opacity: 0,
        scale: 5,
        animationPhase: "fadeIn"
      });
    }
  }

  private addEmotionOverlay(emotionResult: EmotionResult, timestamp: number): void {
    if (emotionResult.label !== "none" && emotionResult.confidence > 0.6) {
      const emoji = this.getEmotionEmoji(emotionResult.label);
      const key = `emotion_${emotionResult.label}_${timestamp}`;
      this.activeGestureEmojis.set(key, {
        emoji,
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.3, // Top area for emotions
        timestamp,
        duration: 2000, // 2 seconds for emotions
        opacity: 0,
        scale: 3,
        animationPhase: "fadeIn"
      });
    }
  }

  private getGestureEmoji(label: string): string {
    const gestureEmojis: { [key: string]: string } = {
      // Static gestures
      bad: "👎",
      fist: "✊", 
      good: "👍",
      gun: "👉",
      heart: "🫶",
      ok: "👌",
      open_palm: "✋",
      promise: "🤙",
      rock: "🤘",
      victory: "✌️",
      // Dynamic gestures
      fire: "🔥",
      hi: "👋",
      hit: "💥",
      nono: "🚫",
      nyan: "🐾",
      shot: "💖"
    };
    return gestureEmojis[label] || "👌";
  }

  private getEmotionEmoji(label: string): string {
    const emotionEmojis: { [key: string]: string } = {
      laugh: "😄",
      serious: "😤",
      surprise: "😲",
      yawn: "🥱",
      angry: "😠",
      sad: "😢",
      happy: "😊"
    };
    return emotionEmojis[label] || "😐";
  }

    /**
   * 현재 진행 중인 AI 처리를 중지하고 관련 트랙을 정리하는 새로운 메서드
   */
  public stopProcessing(): void {
    if (this.activeSourceTrack) {
      this.activeSourceTrack.stop();
      this.activeSourceTrack = null;
      console.log("🛑 Stopped previous AI source track.");
    }
    if (this.activeProcessedTrack) {
      this.activeProcessedTrack.stop();
      this.activeProcessedTrack = null;
      console.log("🛑 Stopped previous AI processed track.");
    }
    this.stopBackgroundAnalysis(); // 기존 백그라운드 분석 중지 로직도 호출
  }

  public cleanup(): void {
    this.stopProcessing(); 
    // 백그라운드 분석 중지
    this.stopBackgroundAnalysis();
    
    emotionCaptureManager.cleanup();
    this.dispatch = null;
    this.activeGestureEmojis.clear();
    this.onGestureResultCallback = null;
    this.onEmotionResultCallback = null;
    this.isInitialized = false;
    
    // 타이밍 관련 변수 리셋
    this.lastFrameTime = 0;
    this.lastGestureResultTime = 0;
    this.lastEmotionResultTime = 0;
    
    this.emotionFaceProcessor?.cleanup();
    this.emotionFaceProcessor = null;
    this.beautyFilterProcessor?.cleanup();
    this.beautyFilterProcessor = null;
    this.gestureProcessor?.cleanup();
    this.gestureProcessor = null;
    console.log("FrontendAiProcessor cleaned up.");
  }
}

export const frontendAiProcessor = new FrontendAiProcessor();

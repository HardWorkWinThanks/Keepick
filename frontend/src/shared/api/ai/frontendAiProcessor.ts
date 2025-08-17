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
const MODELS_BASE_PATH = "/models";

// 표정 인식 모델 경로
const EXPRESSION_MODEL_PATH = `${MODELS_BASE_PATH}/expression/model.json`;
const EXPRESSION_SCALER_PATH = `${MODELS_BASE_PATH}/expression/scaler_v3.json`;

// 제스처 인식 모델 경로
const STATIC_GESTURE_MODEL_PATH = `${MODELS_BASE_PATH}/static-gesture/model.json`;
const DYNAMIC_GESTURE_MODEL_PATH = `${MODELS_BASE_PATH}/dinamic-gesture/model.json`;

// MediaPipe WASM 파일 CDN 경로
const FACE_MESH_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh";
const TASKS_VISION_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

// ✨ 이미지 오버레이를 위한 경로 상수 추가
const STATIC_IMAGE_BASE_PATH = "/images/gestures/static";
const DYNAMIC_IMAGE_BASE_PATH = "/images/gestures/dynamic";
const EMOTION_IMAGE_BASE_PATH = "/images/gestures/emotion";

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
  private readonly GESTURE_RESULT_INTERVAL = 1500;
  private readonly EMOTION_RESULT_INTERVAL = 5000; // 감정 인식 간격을 5초로 증가

  // ✨ 오버레이 (이미지 포함)
  private activeOverlays: Map<string, {
    image: HTMLImageElement;
    x: number;
    y: number;
    timestamp: number;
    duration: number;
    opacity: number;
    scale: number;
  }> = new Map();

  private readonly STATIC_GESTURE_DURATION = 1500;
  private readonly DYNAMIC_GESTURE_DURATION = 1500;
  private readonly ANIMATION_FADE_DURATION = 150;

  private activeSourceTrack: MediaStreamTrack | null = null;
  private activeProcessedTrack: MediaStreamTrack | null = null;

  // ✨ 로드된 이미지들을 저장할 Map 객체
  private loadedImages: Map<string, HTMLImageElement> = new Map();

  // ✨ 🚨 수정: app.py STATIC_IMG_MAP과 일치하도록 이미지 경로 수정
  private async preloadImages(): Promise<void> {
    const imagePaths: { [key: string]: string } = {
      // Static gestures - app.py STATIC_IMG_MAP과 정확히 일치
      // 🚨 중요: fist와 open_palm 제거 (app.py에서 오버레이되지 않음)
      bad: `${STATIC_IMAGE_BASE_PATH}/bad.png`,
      good: `${STATIC_IMAGE_BASE_PATH}/good.png`,
      gun: `${STATIC_IMAGE_BASE_PATH}/gun.png`,
      heart: `${STATIC_IMAGE_BASE_PATH}/heart.png`,
      ok: `${STATIC_IMAGE_BASE_PATH}/ok.png`,
      promise: `${STATIC_IMAGE_BASE_PATH}/promise.png`,
      rock: `${STATIC_IMAGE_BASE_PATH}/rock.png`,
      victory: `${STATIC_IMAGE_BASE_PATH}/victory.png`,
      
      // Dynamic gestures - app.py DYN_LABELS와 일치
      fire: `${DYNAMIC_IMAGE_BASE_PATH}/fire.png`,
      hi: `${DYNAMIC_IMAGE_BASE_PATH}/hi.png`,
      hit: `${DYNAMIC_IMAGE_BASE_PATH}/hit.png`,
      nono: `${DYNAMIC_IMAGE_BASE_PATH}/nono.png`,
      nyan: `${DYNAMIC_IMAGE_BASE_PATH}/nyan.png`,
      shot: `${DYNAMIC_IMAGE_BASE_PATH}/shot.png`,
      
      // Emotions
      laugh: `${EMOTION_IMAGE_BASE_PATH}/laugh.png`,
      serious: `${EMOTION_IMAGE_BASE_PATH}/serious.png`,
      surprise: `${EMOTION_IMAGE_BASE_PATH}/surprise.png`,
      yawn: `${EMOTION_IMAGE_BASE_PATH}/yawn.png`,
    };

    const promises = Object.entries(imagePaths).map(([key, src]) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          this.loadedImages.set(key, img);
          resolve();
        };
        img.onerror = () => {
          console.error(`❌ Failed to load image: ${src}`);
          resolve(); // 실패해도 계속 진행
        };
      });
    });

    await Promise.all(promises);
    console.log("✅ All overlay images preloaded.");
  }
  
  public async init(dispatch: AppDispatch): Promise<void> {
    this.dispatch = dispatch;
    emotionCaptureManager.init(dispatch);
    
    try {
      await tf.setBackend('webgl');
      console.log(`TensorFlow.js backend set to: ${tf.getBackend()}`);
    } catch (error) {
      console.warn("❌ Failed to set TensorFlow.js WebGL backend, falling back to CPU:", error);
    }

    this.emotionFaceProcessor = new EmotionFaceProcessor(this.aiConfig);
    this.beautyFilterProcessor = new BeautyFilterProcessor(this.aiConfig);
    this.gestureProcessor = new GestureProcessor(this.aiConfig);

    try {
      console.log("🤖 Initializing AI modules and preloading images...");
      console.log(`- Emotion model: ${EXPRESSION_MODEL_PATH}`);
      console.log(`- Emotion scaler: ${EXPRESSION_SCALER_PATH}`);
      
      // ✨ AI 모델 초기화와 동시에 이미지 미리 불러오기 실행
      await Promise.all([
        this.preloadImages(),
        this.emotionFaceProcessor.init(
          EXPRESSION_MODEL_PATH,
          EXPRESSION_SCALER_PATH,
          FACE_MESH_WASM_PATH
        ),
        this.beautyFilterProcessor.init(FACE_MESH_WASM_PATH),
        this.gestureProcessor.init(TASKS_VISION_WASM_PATH),
      ]);

      console.log("🔄 Loading gesture models...");
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

  public startBackgroundAnalysis(originalTrack: MediaStreamTrack): void {
    if (originalTrack.kind !== "video") {
      console.warn("Only video tracks can be analyzed.");
      return;
    }

    console.log("🤖 Starting background AI analysis...");
    this.stopBackgroundAnalysis();

    this.backgroundVideoElement = document.createElement("video");
    this.backgroundVideoElement.srcObject = new MediaStream([originalTrack]);
    this.backgroundVideoElement.autoplay = true;
    this.backgroundVideoElement.muted = true;
    this.backgroundVideoElement.style.display = "none";

    this.backgroundVideoElement.onloadedmetadata = () => {
      this.backgroundAnalysisActive = true;
      this.runBackgroundAnalysisLoop();
      console.log("✅ Background AI analysis started");
    };

    this.backgroundVideoElement.play();
  }

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
      
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.error("❌ AI video track processing timeout");
          reject(new Error("AI video track processing timeout"));
        }
      }, 10000);

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

            // ✨ 오버레이 렌더링
            this.renderOverlays(ctx, outputCanvas, now);

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
            const processedStream = outputCanvas.captureStream(30);
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
    
    // 감정 인식 처리
    if (this.aiConfig.emotion.enabled && this.emotionFaceProcessor) {
      const faceCanvas = document.createElement("canvas");
      faceCanvas.width = videoElement.videoWidth;
      faceCanvas.height = videoElement.videoHeight;
      const ctx = faceCanvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoElement, 0, 0, faceCanvas.width, faceCanvas.height);
      const faceImageData = ctx.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
      const emotionResult = await this.emotionFaceProcessor.detectEmotion(faceImageData, timestamp);
      
      if (emotionResult && this.onEmotionResultCallback) {
        const timeSinceLastEmotion = timestamp - this.lastEmotionResultTime;
        if (timeSinceLastEmotion >= this.EMOTION_RESULT_INTERVAL || emotionResult.label !== "none") {
          this.onEmotionResultCallback(emotionResult);
          this.lastEmotionResultTime = timestamp;
          this.addEmotionOverlay(emotionResult, timestamp);
        }
      }
    }

    // 제스처 인식 처리
    if (
      (this.aiConfig.gesture.static.enabled || this.aiConfig.gesture.dynamic.enabled) &&
      this.gestureProcessor
    ) {
      const gestureResult = await this.gestureProcessor.detectGestures(videoElement, timestamp);
      
      if (gestureResult && this.onGestureResultCallback) {
        const timeSinceLastGesture = timestamp - this.lastGestureResultTime;
        const hasValidGesture = gestureResult.static.label !== "none" || gestureResult.dynamic.label !== "none";
        
        if (timeSinceLastGesture >= this.GESTURE_RESULT_INTERVAL || hasValidGesture) {
          this.onGestureResultCallback(gestureResult);
          this.lastGestureResultTime = timestamp;
          this.addGestureOverlay(gestureResult, timestamp);
        }
      }
    }
  }

  // ✨ 렌더링 함수 수정: drawImage 사용
  private renderOverlays(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    now: number
  ): void {
    this.activeOverlays.forEach((item, key) => {
      const elapsed = now - item.timestamp;
      const remaining = item.duration - elapsed;
      if (remaining > 0) {
        this.updateGestureAnimation(item, elapsed);
        
        const x = item.x * canvas.width;
        const y = item.y * canvas.height;
        
        const baseSize = Math.min(canvas.width, canvas.height) * 0.3;
        const imgWidth = baseSize * item.scale;
        const imgHeight = (baseSize * (item.image.height / item.image.width)) * item.scale;

        ctx.save();
        ctx.globalAlpha = item.opacity;
        
        // ✨ drawImage를 사용하여 이미지 렌더링
        ctx.drawImage(
          item.image,
          x - imgWidth / 2, // 중앙 정렬
          y - imgHeight / 2,
          imgWidth,
          imgHeight
        );
        
        ctx.restore();
      } else {
        this.activeOverlays.delete(key);
      }
    });
  }

  private updateGestureAnimation(item: {
    image: HTMLImageElement;
    x: number;
    y: number;
    timestamp: number;
    duration: number;
    opacity: number;
    scale: number;
  }, elapsed: number): void {
    const fadeInDuration = this.ANIMATION_FADE_DURATION;
    const fadeOutDuration = this.ANIMATION_FADE_DURATION;
    const totalDuration = item.duration;

    if (elapsed < fadeInDuration) {
        // Fade In
        const progress = elapsed / fadeInDuration;
        item.opacity = progress;
        item.scale = 1.0 + 0.5 * (1 - progress); // 시작할 때 크게
    } else if (elapsed < totalDuration - fadeOutDuration) {
        // Display
        item.opacity = 1.0;
        item.scale = 1.0;
    } else {
        // Fade Out
        const fadeOutElapsed = elapsed - (totalDuration - fadeOutDuration);
        const progress = fadeOutElapsed / fadeOutDuration;
        item.opacity = 1.0 - progress;
        item.scale = 1.0 - 0.2 * progress; // 사라지면서 작게
    }
  }

  // ✨ 수정: 실제 손 위치를 사용한 제스처 오버레이
  private addGestureOverlay(gestureResult: GestureResult, timestamp: number): void {
    const processGesture = (
        gesture: { label: string; confidence: number } | null,
        type: 'static' | 'dynamic'
    ) => {
        // shot은 특별히 높은 임계값, 정적 제스처도 조금 높임
        const confidenceThreshold = gesture?.label === 'shot' ? 0.98 : (type === 'static' ? 0.8 : 0.85);
        if (!gesture || gesture.label === "none" || gesture.confidence < confidenceThreshold) return;

        const image = this.getImageForLabel(gesture.label);
        if (!image) return; // 🚨 app.py처럼 이미지 없으면 오버레이 안 함

        // ✨ 실제 손 위치 추출
        let handX = 0.5; // 기본값 (중앙)
        let handY = 0.5; // 기본값 (중앙)
        
        console.log(`🖐️ [${type}] ${gesture.label} - landmarks:`, gestureResult.landmarks?.length || 0);
        
        if (gestureResult.landmarks && gestureResult.landmarks.length > 0) {
          // 첫 번째 손의 손목 좌표 (랜드마크 0번)를 사용
          // landmarks는 [hand1_landmark0, hand1_landmark1, ...] 형태
          // 각 랜드마크는 [x, y, z] 배열
          const wristLandmark = gestureResult.landmarks[0]; // 손목 (landmark 0)
          console.log(`🎯 손목 랜드마크:`, wristLandmark);
          
          if (wristLandmark && wristLandmark.length >= 2) {
            handX = wristLandmark[0]; // 정규화된 x 좌표 (0-1)
            handY = wristLandmark[1]; // 정규화된 y 좌표 (0-1)
            
            console.log(`📍 원본 손 위치: (${handX.toFixed(3)}, ${handY.toFixed(3)})`);
            
            // 손목에서 손 위쪽으로 오버레이 위치 조정 (Y축 위로 이동)
            handY = handY - 0.15; // 손목에서 위로 15% 올리기
            
            // 화면 경계 체크 및 보정 (오버레이가 화면 밖으로 나가지 않도록)
            const margin = 0.1; // 10% 여백
            handX = Math.max(margin, Math.min(1 - margin, handX));
            handY = Math.max(margin, Math.min(1 - margin, handY));
            
            console.log(`🎯 최종 오버레이 위치: (${handX.toFixed(3)}, ${handY.toFixed(3)})`);
          } else {
            console.warn(`⚠️ 손목 랜드마크 데이터 부족:`, wristLandmark);
          }
        } else {
          console.warn(`⚠️ 랜드마크 데이터 없음, 기본값 사용: (${handX}, ${handY})`);
        }

        const key = `${type}_${gesture.label}_${timestamp}`;
        this.activeOverlays.set(key, {
            image,
            x: handX, // 실제 손 위치 사용
            y: handY, // 실제 손 위치 사용
            timestamp,
            duration: type === 'static' ? this.STATIC_GESTURE_DURATION : this.DYNAMIC_GESTURE_DURATION,
            opacity: 0,
            scale: 5,
        });
    };

    if (this.aiConfig.gesture.static.enabled) processGesture(gestureResult.static, 'static');
    if (this.aiConfig.gesture.dynamic.enabled) processGesture(gestureResult.dynamic, 'dynamic');
  }

  private addEmotionOverlay(emotionResult: EmotionResult, timestamp: number): void {
    if (emotionResult.label === "none" || emotionResult.confidence < 0.8) return; // 신뢰도 임계값을 0.8로 상승

    const image = this.getImageForLabel(emotionResult.label);
    if (!image) return;

    // 얼굴 위치 기본값 (화면 중앙 상단)
    let faceX = 0.5; // 화면 중앙
    let faceY = 0.3; // 화면 상단 30% 지점
    
    // 얼굴 랜드마크가 있으면 실제 얼굴 위치 사용
    if (emotionResult.faceLandmarks && emotionResult.faceLandmarks.length > 0) {
      // 얼굴 랜드마크의 중심점 계산
      const landmarks = emotionResult.faceLandmarks;
      const avgX = landmarks.reduce((sum, lm) => sum + lm[0], 0) / landmarks.length;
      const avgY = landmarks.reduce((sum, lm) => sum + lm[1], 0) / landmarks.length;
      
      faceX = avgX;
      faceY = avgY - 0.1; // 얼굴 위쪽에 표시
      
      // 화면 경계 체크
      const margin = 0.1;
      faceX = Math.max(margin, Math.min(1 - margin, faceX));
      faceY = Math.max(margin, Math.min(1 - margin, faceY));
    }

    const key = `emotion_${emotionResult.label}_${timestamp}`;
    this.activeOverlays.set(key, {
        image,
        x: faceX,
        y: faceY,
        timestamp,
        duration: 2000,
        opacity: 0,
        scale: 5,
    });
  }

  // ✨ 🚨 수정: app.py와 동일하게 fist/open_palm은 null 반환
  private getImageForLabel(label: string): HTMLImageElement | null {
    // app.py의 STATIC_IMG_MAP에 없는 제스처들은 오버레이하지 않음
    if (label === 'fist' || label === 'open_palm') {
      console.log(`🚨 ${label} detected but no overlay image (matches app.py behavior)`);
      return null;
    }
    
    return this.loadedImages.get(label) || null;
  }

  public stopProcessing(): void {
    // 🚨 중요: 원본 트랙(activeSourceTrack)은 중단하지 않음!
    // 원본 트랙은 사용자의 카메라 스트림이므로 AI 처리 종료와 무관하게 유지되어야 함
    if (this.activeSourceTrack) {
      console.log("📌 Releasing reference to source track (not stopping):", this.activeSourceTrack.id);
      this.activeSourceTrack = null; // 참조만 해제
    }
    
    // AI 처리된 트랙만 중단
    if (this.activeProcessedTrack) {
      this.activeProcessedTrack.stop();
      this.activeProcessedTrack = null;
      console.log("🛑 Stopped AI processed track.");
    }
    
    this.stopBackgroundAnalysis();
  }

  public cleanup(): void {
    this.stopProcessing(); 
    this.stopBackgroundAnalysis();
    
    emotionCaptureManager.cleanup();
    this.dispatch = null;
    
    this.activeOverlays.clear();
    
    this.onGestureResultCallback = null;
    this.onEmotionResultCallback = null;
    this.isInitialized = false;
    
    this.lastFrameTime = 0;
    this.lastGestureResultTime = 0;
    this.lastEmotionResultTime = 0;
    
    this.emotionFaceProcessor?.cleanup();
    this.emotionFaceProcessor = null;
    this.beautyFilterProcessor?.cleanup();
    this.beautyFilterProcessor = null;
    this.gestureProcessor?.cleanup();
    this.gestureProcessor = null;
    
    this.loadedImages.clear();

    console.log("FrontendAiProcessor cleaned up.");
  }

  // isInitialized 상태를 확인할 수 있는 public getter
  public get initialized(): boolean {
    return this.isInitialized;
  }
}

export const frontendAiProcessor = new FrontendAiProcessor();
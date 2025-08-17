// src/shared/api/ai/emotionFaceProcessor.ts

import * as tf from "@tensorflow/tfjs";
import { EmotionResult, AiSystemConfig } from "@/shared/types/ai.types";

// Dynamic import types
type FaceMeshModule = typeof import("@mediapipe/face_mesh");
type FaceMeshInstance = import("@mediapipe/face_mesh").FaceMesh;
type Results = import("@mediapipe/face_mesh").Results;

// MediaPipe Face Mesh의 Results에서 랜드마크 타입 추출
type FaceMeshLandmark = Results["multiFaceLandmarks"][number][number];

// Face Mesh 랜드마크 인덱스 (app.py의 IDX_FM과 정확히 일치)
const IDX_FM = {
  upper_eye: 159,
  lower_eye: 145,
  eye_left: 33,
  eye_right: 133,
  upper_lip: 13,
  lower_lip: 14,
  mouth_left: 61,
  mouth_right: 291,
  mouth_center: 0,
  brow: 65,
  eye_center: 168,
  nose: 1,
  chin: 152,
  cheek_l: 205,
  cheek_r: 425,
};

// 표정 라벨 및 인덱스 (app.py와 정확히 일치)
const LABELS_FACE = ["laugh", "serious", "surprise", "yawn", "none"];
const IDX_FACE = {
  laugh: 0,
  serious: 1, 
  surprise: 2,
  yawn: 3,
  none: 4
};

// app.py의 메타데이터 임계값들 (정확히 일치)
const MOUTH_H_Q25 = 0.015;
const EYE_OPEN_Q25 = 0.012;
const BROW_LIFT_Q25 = 0.015;
const SMIRK_T = 0.010;
const FROWN_T = 0.018;
const PUFF_T = 0.015;

// 🔥 새로 추가: 이벤트 전송 임계값 (app.py의 SHOW_THRESH 참고)
const EMOTION_THRESHOLDS = {
  laugh: 0.75,     // app.py: 0.90에서 낮춤 (더 민감하게)
  serious: 0.65,   // app.py: 0.60에서 약간 상향
  surprise: 0.80,  // app.py: 0.90에서 낮춤
  yawn: 0.85,      // app.py: 0.90에서 낮춤 (하품 편향 방지)
  none: 0.50       // none은 낮은 임계값
};

// 🔥 새로 추가: 연속 감지 방지를 위한 쿨다운 (초)
const EMOTION_COOLDOWN = {
  laugh: 3.0,
  serious: 5.0,
  surprise: 2.0,
  yawn: 4.0,
  none: 1.0
};

export class EmotionFaceProcessor {
  private faceMesh: FaceMeshInstance | null = null;
  private faceMeshModule: FaceMeshModule | null = null;
  private expressionModel: tf.LayersModel | null = null;
  private expressionScalerMean: number[] | null = null;
  private expressionScalerScale: number[] | null = null;
  private lastExpressionProbs: number[] | null = null; // for smoothing
  private readonly PROBA_ALPHA = 0.3; // app.py와 동일

  // MediaPipe onResults 콜백에서 결과를 Promise로 전달하기 위한 변수
  private _faceMeshResultResolver: ((value: Results) => void) | null = null;

  // 🔥 새로 추가: 디버깅 및 이벤트 제어
  private lastEmotionEventTime: Record<string, number> = {};
  private debugMode = false;
  private emotionHistory: Array<{emotion: string, confidence: number, timestamp: number}> = [];

  // 초기화 시 AI 설정 주입
  private aiConfig: AiSystemConfig;

  constructor(initialConfig: AiSystemConfig) {
    this.aiConfig = initialConfig;
    // 개발 환경에서 디버그 모드 활성화
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * EmotionFaceProcessor를 초기화하고 모델을 로드합니다.
   */
  public async init(modelPath: string, scalerPath: string, wasmPath: string): Promise<void> {
    // Client-side check
    if (typeof window === 'undefined') {
      console.warn("EmotionFaceProcessor: Cannot initialize on server side");
      this.aiConfig.emotion.enabled = false;
      return;
    }

    try {
      // Dynamic import of MediaPipe Face Mesh
      this.faceMeshModule = await import("@mediapipe/face_mesh");
      
      // Face Mesh 초기화 (app.py와 동일한 설정)
      this.faceMesh = new this.faceMeshModule.FaceMesh({
        locateFile: (file) => {
          return `${wasmPath}/${file}`;
        },
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false, // app.py와 동일
        minDetectionConfidence: 0.7, // app.py와 동일
        minTrackingConfidence: 0.7,
      });

      this.faceMesh.onResults((results) => {
        if (this._faceMeshResultResolver) {
          this._faceMeshResultResolver(results);
          this._faceMeshResultResolver = null;
        }
      });
      console.log("EmotionFaceProcessor: Face Mesh initialized.");

      // TensorFlow.js 모델 및 스케일러 로드
      this.expressionModel = await tf.loadLayersModel(modelPath);
      const scalerResponse = await fetch(scalerPath);
      const scalerData = await scalerResponse.json();
      this.expressionScalerMean = scalerData.mean_;
      this.expressionScalerScale = scalerData.scale_;
      console.log("EmotionFaceProcessor: Expression model and scaler loaded.");
      
      // 🔥 디버그: 스케일러 데이터 확인
      if (this.debugMode) {
        console.log("Scaler mean length:", this.expressionScalerMean?.length);
        console.log("Scaler scale length:", this.expressionScalerScale?.length);
        console.log("First few mean values:", this.expressionScalerMean?.slice(0, 5));
        console.log("First few scale values:", this.expressionScalerScale?.slice(0, 5));
      }
    } catch (error) {
      console.error("EmotionFaceProcessor: Failed to load Face Mesh or models:", error);
      this.aiConfig.emotion.enabled = false;
      this.faceMesh = null;
      this.faceMeshModule = null;
    }
  }

  /**
   * AI 설정을 업데이트합니다.
   */
  public updateConfig(config: Partial<AiSystemConfig>): void {
    this.aiConfig = {
      ...this.aiConfig,
      ...config,
      emotion: { ...this.aiConfig.emotion, ...config.emotion },
    };
  }

  /**
   * 🔥 새로 추가: 디버그 모드 토글
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`EmotionFaceProcessor debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * 🔥 새로 추가: 감정 히스토리 조회 (디버깅용)
   */
  public getEmotionHistory(): Array<{emotion: string, confidence: number, timestamp: number}> {
    return this.emotionHistory.slice(-50); // 최근 50개만 반환
  }

  /**
   * 입력 프레임에서 얼굴 표정을 감지합니다.
   */
  public async detectEmotion(
    inputImageData: ImageData,
    timestamp: number
  ): Promise<EmotionResult | null> {
    // Client-side check
    if (typeof window === 'undefined') {
      return null;
    }

    if (
      !this.aiConfig.emotion.enabled ||
      !this.faceMesh ||
      !this.expressionModel ||
      !this.expressionScalerMean ||
      !this.expressionScalerScale
    ) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = inputImageData.width;
    canvas.height = inputImageData.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.putImageData(inputImageData, 0, 0);

    // MediaPipe 결과를 Promise로 기다림
    const resultsPromise = new Promise<Results>((resolve) => {
      this._faceMeshResultResolver = resolve;
    });

    await this.faceMesh.send({ image: canvas });
    const results = await resultsPromise;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const faceLandmarks = results.multiFaceLandmarks[0];

      // 🔥 디버그: 랜드마크 개수 확인
      if (this.debugMode && Math.random() < 0.01) { // 1% 확률로 로그
        console.log('Face landmarks count:', faceLandmarks.length);
        console.log('Sample landmarks:', {
          upper_eye: faceLandmarks[IDX_FM.upper_eye],
          lower_eye: faceLandmarks[IDX_FM.lower_eye],
          mouth_left: faceLandmarks[IDX_FM.mouth_left],
          mouth_right: faceLandmarks[IDX_FM.mouth_right]
        });
      }

      // 특징 추출
      const extractedFeatures = this.extractFeatures12(faceLandmarks);
      if (!extractedFeatures) {
        return null;
      }

      // 🔥 디버그: 특징 값 확인
      if (this.debugMode && Math.random() < 0.02) { // 2% 확률로 로그
        console.log('Raw features:', {
          eyeOpen: extractedFeatures[0],
          mouthH: extractedFeatures[1],
          mouthW: extractedFeatures[2],
          browLift: extractedFeatures[3]
        });
      }

      // 스케일링
      const scaledFeatures = this.scaleFeatures(extractedFeatures);
      const inputTensor = tf.tensor2d([scaledFeatures], [1, scaledFeatures.length]);
      const prediction = this.expressionModel.predict(inputTensor) as tf.Tensor;
      const probs = prediction.dataSync() as Float32Array;
      tf.dispose(inputTensor);

      // 스무딩
      const smoothedProbs = this.smoothProbs(Array.from(probs));
      
      // 후처리
      let topIdx = smoothedProbs.indexOf(Math.max(...smoothedProbs));
      topIdx = this.gateSurprise(extractedFeatures, smoothedProbs, topIdx);
      const [finalIdx, finalConf] = this.promoteSerious(extractedFeatures, smoothedProbs, topIdx);
      
      const label = LABELS_FACE[finalIdx];
      const confidence = finalConf;

      // 🔥 디버그: 확률 분포 로그 (가끔씩)
      if (this.debugMode && Math.random() < 0.05) { // 5% 확률로 로그
        const top3 = smoothedProbs
          .map((prob, idx) => ({ label: LABELS_FACE[idx], prob }))
          .sort((a, b) => b.prob - a.prob)
          .slice(0, 3);
        console.log('Top 3 emotions:', top3);
        console.log('Final result:', { label, confidence: confidence.toFixed(3) });
      }

      // 🔥 감정 히스토리에 추가 (모든 결과 저장)
      this.emotionHistory.push({ emotion: label, confidence, timestamp });
      if (this.emotionHistory.length > 100) {
        this.emotionHistory.shift(); // 오래된 것 제거
      }

      // 🔥 임계값 체크: 일정 수준 이상일 때만 이벤트 전송
      const threshold = EMOTION_THRESHOLDS[label as keyof typeof EMOTION_THRESHOLDS] || 0.8;
      const cooldown = EMOTION_COOLDOWN[label as keyof typeof EMOTION_COOLDOWN] || 3.0;
      const now = Date.now() / 1000;
      const lastEventTime = this.lastEmotionEventTime[label] || 0;

      // 임계값 미달이거나 쿨다운 중이면 null 반환 (이벤트 전송 안함)
      if (confidence < threshold || (now - lastEventTime) < cooldown) {
        if (this.debugMode && confidence >= threshold) {
          console.log(`${label} detected but in cooldown (${(now - lastEventTime).toFixed(1)}s / ${cooldown}s)`);
        }
        return null;
      }

      // 🔥 이벤트 전송 조건 만족: 쿨다운 업데이트
      this.lastEmotionEventTime[label] = now;
      
      if (this.debugMode) {
        console.log(`🎭 EMOTION EVENT: ${label} (${(confidence * 100).toFixed(1)}%) - threshold: ${(threshold * 100).toFixed(0)}%`);
      }

      return {
        type: "emotion",
        label: label,
        confidence: confidence,
        faceLandmarks: faceLandmarks.map((lm) => [lm.x, lm.y, lm.z]),
        timestamp: timestamp,
      };
    }
    return null;
  }

  /**
   * app.py의 extract_features12와 정확히 동일한 로직
   */
  private extractFeatures12(landmarks: FaceMeshLandmark[]): number[] | null {
    try {
      // app.py처럼 3D 배열로 변환 (정규화된 좌표 사용)
      const arr = landmarks.map(lm => [lm.x, lm.y, lm.z || 0]);
      
      // app.py와 동일한 거리 계산 (3D euclidean distance)
      const euclideanDist = (p1: number[], p2: number[]): number => {
        const dx = p1[0] - p2[0];
        const dy = p1[1] - p2[1]; 
        const dz = p1[2] - p2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      };

      // app.py와 정확히 동일한 특징 추출
      const eyeOpen = euclideanDist(arr[IDX_FM.upper_eye], arr[IDX_FM.lower_eye]);
      const mouthH = euclideanDist(arr[IDX_FM.upper_lip], arr[IDX_FM.lower_lip]);
      const mouthW = euclideanDist(arr[IDX_FM.mouth_left], arr[IDX_FM.mouth_right]);
      const browLift = euclideanDist(arr[IDX_FM.brow], arr[IDX_FM.eye_center]);
      const eyeW = euclideanDist(arr[IDX_FM.eye_left], arr[IDX_FM.eye_right]);

      // 비율 계산
      const eyeRatio = eyeOpen > 0 ? eyeW / eyeOpen : 0.0;
      const mouthRatio = mouthH > 0 ? mouthW / mouthH : 0.0;
      const browMouthRatio = mouthH > 0 ? browLift / mouthH : 0.0;

      // 추가 특징들
      const mouthCenterY = arr[IDX_FM.mouth_center][1];
      const leftY = arr[IDX_FM.mouth_left][1];
      const rightY = arr[IDX_FM.mouth_right][1];
      const mouthDroop = (leftY + rightY) / 2.0 - mouthCenterY;
      const mouthAsym = Math.abs(leftY - rightY);

      const cheekAvgZ = (arr[IDX_FM.cheek_l][2] + arr[IDX_FM.cheek_r][2]) / 2.0;
      const noseZ = arr[IDX_FM.nose][2];
      const cheekPuff = noseZ - cheekAvgZ;

      const faceScale = euclideanDist(arr[IDX_FM.nose], arr[IDX_FM.chin]);
      
      // app.py와 동일한 faceScale 체크
      if (faceScale === 0) {
        return Array(12).fill(0);
      }

      const dx = arr[IDX_FM.mouth_right][0] - arr[IDX_FM.mouth_left][0];
      const dy = arr[IDX_FM.mouth_right][1] - arr[IDX_FM.mouth_left][1];
      const mouthTilt = Math.atan2(dy, dx) / (Math.PI / 2);
      const eyeMouthCoupling = (eyeOpen / faceScale) / ((mouthH / faceScale) + 1e-6);

      // app.py와 정확히 동일한 순서의 12개 특징
      const feats = [
        eyeOpen / faceScale,      // 0
        mouthH / faceScale,       // 1
        mouthW / faceScale,       // 2
        browLift / faceScale,     // 3
        eyeRatio,                 // 4
        mouthRatio,               // 5
        browMouthRatio,           // 6
        mouthDroop / faceScale,   // 7
        mouthAsym / faceScale,    // 8
        cheekPuff / faceScale,    // 9
        mouthTilt,                // 10
        eyeMouthCoupling,         // 11
      ];

      // app.py의 np.nan_to_num과 동일
      return feats.map((f) => (isNaN(f) || !isFinite(f) ? 0 : f));
    } catch (e) {
      console.warn("Error extracting facial features:", e);
      return null;
    }
  }

  /**
   * app.py와 정확히 동일한 스케일링
   */
  private scaleFeatures(features: number[]): number[] {
    if (!this.expressionScalerMean || !this.expressionScalerScale) {
      console.warn("Scaler data not loaded for scaling.");
      return features;
    }
    
    // app.py: (feat_raw - self.MEAN) / (self.SCALE + 1e-8)
    return features.map(
      (f, i) => (f - this.expressionScalerMean![i]) / (this.expressionScalerScale![i] + 1e-8)
    );
  }

  /**
   * app.py와 정확히 동일한 스무딩
   */
  private smoothProbs(currentProbs: number[]): number[] {
    if (!this.lastExpressionProbs) {
      this.lastExpressionProbs = [...currentProbs];
    } else {
      // app.py: (1-self.PROBA_ALPHA)*self.proba_smooth + self.PROBA_ALPHA*p
      this.lastExpressionProbs = currentProbs.map(
        (p, i) => (1 - this.PROBA_ALPHA) * this.lastExpressionProbs![i] + this.PROBA_ALPHA * p
      );
    }
    return [...this.lastExpressionProbs];
  }

  /**
   * app.py의 gate_surprise와 정확히 동일
   */
  private gateSurprise(rawFeat: number[], probs: number[], topIdx: number): number {
    if (topIdx !== IDX_FACE.surprise) {
      return topIdx;
    }

    // app.py와 동일한 조건 체크
    if (rawFeat[1] < MOUTH_H_Q25 && rawFeat[0] < EYE_OPEN_Q25 && rawFeat[3] < BROW_LIFT_Q25) {
      // app.py: return int(np.argsort(probs)[-2])  // 두 번째로 높은 확률
      const indices = Array.from({length: probs.length}, (_, i) => i);
      indices.sort((a, b) => probs[b] - probs[a]);
      return indices[1]; // 두 번째로 높은 인덱스
    }
    return topIdx;
  }

  /**
   * app.py의 promote_serious와 정확히 동일
   */
  private promoteSerious(rawFeat: number[], probs: number[], currentIdx: number): [number, number] {
    const seriousP = probs[IDX_FACE.serious];
    
    // app.py와 동일한 특징 인덱스 및 임계값
    const smirk = rawFeat[8] > SMIRK_T;  // mouthAsym > 0.010
    const frown = rawFeat[3] < FROWN_T;  // browLift < 0.018
    const puff = rawFeat[9] > PUFF_T;    // cheekPuff > 0.015

    // app.py와 동일한 로직
    if (seriousP >= 0.60 || ((smirk || frown || puff) && seriousP >= 0.45)) {
      return [IDX_FACE.serious, seriousP];
    }
    return [currentIdx, probs[currentIdx]];
  }

  /**
   * 🔥 새로 추가: 임계값 동적 조정 (필요시 사용)
   */
  public updateEmotionThreshold(emotion: string, threshold: number): void {
    if (emotion in EMOTION_THRESHOLDS) {
      (EMOTION_THRESHOLDS as any)[emotion] = Math.max(0.1, Math.min(0.99, threshold));
      console.log(`Updated ${emotion} threshold to ${threshold}`);
    }
  }

  /**
   * 🔥 새로 추가: 쿨다운 초기화 (테스트용)
   */
  public resetCooldowns(): void {
    this.lastEmotionEventTime = {};
    console.log('Emotion cooldowns reset');
  }

  /**
   * 리소스를 정리합니다.
   */
  public cleanup(): void {
    if (this.faceMesh) {
      this.faceMesh = null;
    }
    if (this.expressionModel) {
      this.expressionModel.dispose();
      this.expressionModel = null;
    }
    this.faceMeshModule = null;
    this.expressionScalerMean = null;
    this.expressionScalerScale = null;
    this.lastExpressionProbs = null;
    this.lastEmotionEventTime = {};
    this.emotionHistory = [];
  }
}
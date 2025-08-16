// src/shared/api/ai/emotionFaceProcessor.ts

import * as tf from "@tensorflow/tfjs";
import { EmotionResult, AiSystemConfig } from "@/shared/types/ai.types";

// Dynamic import types
type FaceMeshModule = typeof import("@mediapipe/face_mesh");
type FaceMeshInstance = import("@mediapipe/face_mesh").FaceMesh;
type Results = import("@mediapipe/face_mesh").Results;

// MediaPipe Face Mesh의 Results에서 랜드마크 타입 추출
// @mediapipe/face_mesh 패키지의 랜드마크는 visibility가 optional일 수 있으므로 이 타입으로 처리합니다.
type FaceMeshLandmark = Results["multiFaceLandmarks"][number][number];

// Face Mesh 랜드마크 인덱스 (app.py의 IDX_FM 참고)
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

// 표정 라벨 (app.py의 LABELS_FACE 참고)
const LABELS_FACE = ["laugh", "serious", "surprise", "yawn", "none"];

// Surprise 게이팅 및 Serious 촉진을 위한 임계값 (app.py 참고)
const MOUTH_H_Q25 = 0.015;
const EYE_OPEN_Q25 = 0.012;
const BROW_LIFT_Q25 = 0.015;
const SMIRK_T = 0.01;
const FROWN_T = 0.018;
const PUFF_T = 0.015;

export class EmotionFaceProcessor {
  private faceMesh: FaceMeshInstance | null = null;
  private faceMeshModule: FaceMeshModule | null = null;
  private expressionModel: tf.LayersModel | null = null;
  private expressionScalerMean: number[] | null = null;
  private expressionScalerScale: number[] | null = null;
  private lastExpressionProbs: number[] | null = null; // for smoothing
  private readonly PROBA_ALPHA = 0.3; // from app.py PROBA_ALPHA

  // MediaPipe onResults 콜백에서 결과를 Promise로 전달하기 위한 변수
  private _faceMeshResultResolver: ((value: Results) => void) | null = null;

  // 초기화 시 AI 설정 주입
  private aiConfig: AiSystemConfig;

  constructor(initialConfig: AiSystemConfig) {
    this.aiConfig = initialConfig;
  }

  /**
   * EmotionFaceProcessor를 초기화하고 모델을 로드합니다.
   * @param modelPath 표정 인식 TensorFlow.js 모델 경로
   * @param scalerPath 스케일러 데이터 JSON 경로
   * @param wasmPath MediaPipe Face Mesh WASM 경로
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
      
      // Face Mesh 초기화
      this.faceMesh = new this.faceMeshModule.FaceMesh({
        locateFile: (file) => {
          return `${wasmPath}/${file}`;
        },
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      // FaceMesh의 onResults 콜백을 등록합니다.
      // 이 콜백은 `faceMesh.send()`가 호출되어 처리가 완료될 때마다 트리거됩니다.
      this.faceMesh.onResults((results) => {
        if (this._faceMeshResultResolver) {
          this._faceMeshResultResolver(results);
          this._faceMeshResultResolver = null; // Promise가 한 번 resolve되면 초기화
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
    } catch (error) {
      console.error("EmotionFaceProcessor: Failed to load Face Mesh or models:", error);
      // 에러 발생 시 표정 인식 기능 비활성화
      this.aiConfig.emotion.enabled = false;
      this.faceMesh = null;
      this.faceMeshModule = null;
    }
  }

  /**
   * AI 설정을 업데이트합니다.
   * @param config 업데이트할 AI 설정
   */
  public updateConfig(config: Partial<AiSystemConfig>): void {
    this.aiConfig = {
      ...this.aiConfig,
      ...config,
      emotion: { ...this.aiConfig.emotion, ...config.emotion },
    };
  }

  /**
   * 입력 프레임에서 얼굴 표정을 감지합니다.
   * @param inputImageData HTMLVideoElement 또는 Canvas에서 얻은 ImageData
   * @param timestamp 현재 타임스탬프
   * @returns 감지된 표정 결과 또는 null
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
    ctx.putImageData(inputImageData, 0, 0); // ImageData를 Canvas에 그림

    // MediaPipe `send()` 호출 결과를 `Promise`로 기다립니다.
    const resultsPromise = new Promise<Results>((resolve) => {
      this._faceMeshResultResolver = resolve;
    });

    // Canvas 엘리먼트를 send()에 전달
    await this.faceMesh.send({ image: canvas });

    // MediaPipe onResults 콜백에서 결과가 올 때까지 기다림
    const results = await resultsPromise;

    // 이제 results 객체는 MediaPipe Results 타입이 됩니다.
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const faceLandmarks = results.multiFaceLandmarks[0];

      const extractedFeatures = this.extractFacialFeatures(
        faceLandmarks,
        inputImageData.width, // `imageData` 대신 `inputImageData` 사용
        inputImageData.height // `imageData` 대신 `inputImageData` 사용
      );
      if (!extractedFeatures) {
        return null;
      }

      const scaledFeatures = this.scaleFeatures(extractedFeatures);
      const inputTensor = tf.tensor2d([scaledFeatures], [1, scaledFeatures.length]);
      const prediction = this.expressionModel.predict(inputTensor) as tf.Tensor;
      const probs = prediction.dataSync() as Float32Array;
      tf.dispose(inputTensor); // 텐서 해제

      const smoothedProbs = this.smoothProbs(Array.from(probs));
      let topIdx = smoothedProbs.indexOf(Math.max(...smoothedProbs));
      let confidence = smoothedProbs[topIdx];
      let label = LABELS_FACE[topIdx];

      // app.py의 gate_surprise, promote_serious 로직 포팅
      topIdx = this.gateSurprise(extractedFeatures, smoothedProbs, topIdx);
      [topIdx, confidence] = this.promoteSerious(extractedFeatures, smoothedProbs, topIdx);
      label = LABELS_FACE[topIdx];

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
   * 얼굴 랜드마크에서 특징을 추출합니다 (app.py의 extract_features12 포팅).
   * @param landmarks MediaPipe Face Mesh 랜드마크 배열
   * @param videoWidth 비디오 프레임 너비
   * @param videoHeight 비디오 프레임 높이
   * @returns 12개의 특징 배열 또는 null
   */
  private extractFacialFeatures(
    landmarks: FaceMeshLandmark[], // `FaceMeshLandmark` 타입 사용
    videoWidth: number,
    videoHeight: number
  ): number[] | null {
    // MediaPipe Face Mesh 랜드마크를 app.py의 float32 numpy 배열처럼 다루기
    // x, y는 0~1 사이의 정규화된 값, z는 상대적인 깊이 값
    const getLm = (idx: number) => {
      const lm = landmarks[idx];
      // visibility가 undefined일 수 있으므로 `lm.visibility || 0` 등으로 처리
      return {
        x: lm.x * videoWidth,
        y: lm.y * videoHeight,
        z: lm.z || 0,
        visibility: lm.visibility || 0,
      };
    };

    try {
      const eyeOpen = Math.hypot(
        getLm(IDX_FM["upper_eye"]).x - getLm(IDX_FM["lower_eye"]).x,
        getLm(IDX_FM["upper_eye"]).y - getLm(IDX_FM["lower_eye"]).y
      );
      const mouthH = Math.hypot(
        getLm(IDX_FM["upper_lip"]).x - getLm(IDX_FM["lower_lip"]).x,
        getLm(IDX_FM["upper_lip"]).y - getLm(IDX_FM["lower_lip"]).y
      );
      const mouthW = Math.hypot(
        getLm(IDX_FM["mouth_left"]).x - getLm(IDX_FM["mouth_right"]).x,
        getLm(IDX_FM["mouth_left"]).y - getLm(IDX_FM["mouth_right"]).y
      );
      const browLift = Math.hypot(
        getLm(IDX_FM["brow"]).x - getLm(IDX_FM["eye_center"]).x,
        getLm(IDX_FM["brow"]).y - getLm(IDX_FM["eye_center"]).y
      );
      const eyeW = Math.hypot(
        getLm(IDX_FM["eye_left"]).x - getLm(IDX_FM["eye_right"]).x,
        getLm(IDX_FM["eye_left"]).y - getLm(IDX_FM["eye_right"]).y
      );

      const eyeRatio = eyeOpen > 0 ? eyeW / eyeOpen : 0.0;
      const mouthRatio = mouthH > 0 ? mouthW / mouthH : 0.0;
      const browMouthRatio = mouthH > 0 ? browLift / mouthH : 0.0;

      const mouthCenterY = getLm(IDX_FM["mouth_center"]).y;
      const leftY = getLm(IDX_FM["mouth_left"]).y;
      const rightY = getLm(IDX_FM["mouth_right"]).y;
      const mouthDroop = (leftY + rightY) / 2.0 - mouthCenterY;
      const mouthAsym = Math.abs(leftY - rightY);

      const cheekAvgZ = (getLm(IDX_FM["cheek_l"]).z + getLm(IDX_FM["cheek_r"]).z) / 2.0;
      const noseZ = getLm(IDX_FM["nose"]).z;
      const cheekPuff = noseZ - cheekAvgZ;

      const faceScale = Math.hypot(
        getLm(IDX_FM["nose"]).x - getLm(IDX_FM["chin"]).x,
        getLm(IDX_FM["nose"]).y - getLm(IDX_FM["chin"]).y
      );

      if (faceScale === 0) {
        return Array(12).fill(0); // np.zeros(12)
      }

      const dx = getLm(IDX_FM["mouth_right"]).x - getLm(IDX_FM["mouth_left"]).x;
      const dy = getLm(IDX_FM["mouth_right"]).y - getLm(IDX_FM["mouth_left"]).y;
      const mouthTilt = Math.atan2(dy, dx) / (Math.PI / 2);

      const eyeMouthCoupling = eyeOpen / faceScale / (mouthH / faceScale + 1e-6);

      const feats = [
        eyeOpen / faceScale,
        mouthH / faceScale,
        mouthW / faceScale,
        browLift / faceScale,
        eyeRatio,
        mouthRatio,
        browMouthRatio,
        mouthDroop / faceScale,
        mouthAsym / faceScale,
        cheekPuff / faceScale,
        mouthTilt,
        eyeMouthCoupling,
      ];

      // NaN 대신 0으로 대체 (np.nan_to_num)
      return feats.map((f) => (isNaN(f) ? 0 : f));
    } catch (e) {
      console.warn("Error extracting facial features:", e);
      return null;
    }
  }

  /**
   * 특징 데이터를 스케일링합니다.
   */
  private scaleFeatures(features: number[]): number[] {
    if (!this.expressionScalerMean || !this.expressionScalerScale) {
      console.warn("Scaler data not loaded for scaling.");
      return features;
    }
    return features.map(
      (f, i) => (f - this.expressionScalerMean![i]) / (this.expressionScalerScale![i] + 1e-8)
    );
  }

  /**
   * 확률을 스무딩합니다.
   */
  private smoothProbs(currentProbs: number[]): number[] {
    if (!this.lastExpressionProbs) {
      this.lastExpressionProbs = currentProbs;
    } else {
      this.lastExpressionProbs = currentProbs.map(
        (p, i) =>
          (1 - this.PROBA_ALPHA) * (this.lastExpressionProbs?.[i] || 0) + this.PROBA_ALPHA * p
      );
    }
    return this.lastExpressionProbs;
  }

  /**
   * surprise 표정 게이팅 (app.py의 gate_surprise 포팅).
   */
  private gateSurprise(rawFeat: number[], probs: number[], topIdx: number): number {
    if (LABELS_FACE[topIdx] !== "surprise") {
      return topIdx;
    }

    if (rawFeat[1] < MOUTH_H_Q25 && rawFeat[0] < EYE_OPEN_Q25 && rawFeat[3] < BROW_LIFT_Q25) {
      // 가장 높은 확률이 surprise여도 조건에 맞지 않으면 두 번째 높은 확률의 인덱스 반환
      const sortedProbs = [...probs].sort((a, b) => b - a);
      const secondHighestProb = sortedProbs[1];
      return probs.indexOf(secondHighestProb);
    }
    return topIdx;
  }

  /**
   * serious 표정 촉진 (app.py의 promote_serious 포팅).
   */
  private promoteSerious(rawFeat: number[], probs: number[], currentIdx: number): [number, number] {
    const seriousProb = probs[LABELS_FACE.indexOf("serious")];

    // app.py의 인덱스를 고려하여 rawFeat 참조 수정 (app.py의 extract_features12에서 반환되는 feats 배열 순서와 일치해야 합니다.)
    // rawFeat[8] -> mouthAsym (app.py)
    // rawFeat[3] -> browLift / faceScale (app.py)
    // rawFeat[4] -> cheekPuff / faceScale (app.py)

    const smirk = rawFeat[5] > SMIRK_T; // mouthAsym
    const frown = rawFeat[3] < FROWN_T; // browLift / faceScale
    const puff = rawFeat[4] > PUFF_T; // cheekPuff / faceScale

    if (seriousProb >= 0.6 || ((smirk || frown || puff) && seriousProb >= 0.45)) {
      return [LABELS_FACE.indexOf("serious"), seriousProb];
    }
    return [currentIdx, probs[currentIdx]];
  }

  /**
   * 리소스를 정리합니다.
   */
  public cleanup(): void {
    if (this.faceMesh) {
      // this.faceMesh.close(); // FaceMesh에 명시적인 close 메서드가 없을 수 있음
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
  }
}

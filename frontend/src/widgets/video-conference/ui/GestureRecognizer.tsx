// src/widgets/video-conference/ui/GestureRecognizer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// --- 설정 상수 ---
const SEQUENCE_LENGTH = 30; // 동적 모델이 사용할 프레임 시퀀스 길이
const CONFIDENCE_THRESHOLD = 0.8; // 동적 모델 예측 신뢰도 임계값

// --- 레이블 정의 ---
// 정적 모델 레이블 (기존)
const STATIC_LABELS = [
  "bad",
  "fist",
  "good",
  "gun",
  "heart",
  "none",
  "ok",
  "open_palm",
  "promise",
  "rock",
  "victory",
];
const KOREAN_STATIC_LABELS: { [key: string]: string } = {
  bad: "👎",
  fist: "주먹",
  good: "👍",
  gun: "총 모양",
  heart: "손가락 하트",
  none: "없음",
  ok: "OK",
  open_palm: "손바닥",
  promise: "약속",
  rock: "락앤롤",
  victory: "브이",
};

// 동적 모델 레이블 (신규)
const DYNAMIC_LABELS = ["fire", "hi", "hit", "none", "nono", "nyan", "shot"];
const KOREAN_DYNAMIC_LABELS: { [key: string]: string } = {
  fire: "🔥 파이어",
  hi: "👋 안녕",
  hit: "💥 히트",
  none: "없음",
  nono: "🚫 안돼",
  nyan: "🐾 냥냥펀치",
  shot: "💖 샷",
};

// 컴포넌트 Props 타입 정의
interface GestureRecognizerProps {
  mediaStream: MediaStream | null;
}

export const GestureRecognizer: React.FC<GestureRecognizerProps> = ({
  mediaStream,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- 모델 및 데이터 Ref ---
  const staticModelRef = useRef<tf.LayersModel | null>(null);
  const dynamicModelRef = useRef<tf.LayersModel | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const sequenceRef = useRef<number[][]>([]); // 동적 인식을 위한 키포인트 시퀀스

  // --- UI 상태 ---
  const [staticGesture, setStaticGesture] =
    useState<string>("정적: 준비 중...");
  const [dynamicGesture, setDynamicGesture] =
    useState<string>("동적: 준비 중...");

  const animationFrameId = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // 1. 초기화 (모델 로딩 및 MediaPipe 설정)
  // 1. 초기화: 두 모델과 MediaPipe를 함께 로드
  useEffect(() => {
    async function setupAllModels() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        handLandmarkerRef.current = handLandmarker;

        // Promise.all을 사용하여 두 모델을 병렬로 로딩
        const [staticModel, dynamicModel] = await Promise.all([
          tf.loadLayersModel("/static_model/model.json"), // 정적 모델 경로 수정
          tf.loadLayersModel("/dynamic_model/model.json"), // 동적 모델 경로 확인
        ]);
        staticModelRef.current = staticModel;
        dynamicModelRef.current = dynamicModel;

        setStaticGesture("정적: 인식 준비 완료");
        setDynamicGesture("동적: 움직임을 보여주세요");
      } catch (error) {
        console.error("AI 모델 초기화 실패:", error);
        setStaticGesture("정적: 모델 로딩 실패");
        setDynamicGesture("동적: 모델 로딩 실패");
      }
    }
    setupAllModels();

    // 컴포넌트 언마운트 시 자원 정리
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      handLandmarkerRef.current?.close();
      staticModelRef.current?.dispose();
      dynamicModelRef.current?.dispose();
    };
  }, []);

  // 2. MediaStream이 변경될 때 비디오 엘리먼트에 연결
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.addEventListener("loadeddata", () => {
        // 비디오 재생이 시작되면 예측 루프를 시작
        startPredictionLoop();
      });
    }

    return () => {
      // 스트림이 바뀌거나 컴포넌트가 사라질 때 예측 루프 중지
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [mediaStream]);

  // 3. 실시간 예측 루프
  const startPredictionLoop = () => {
    const predict = async () => {
      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;
      const staticModel = staticModelRef.current;
      const dynamicModel = dynamicModelRef.current;

      if (
        !video ||
        !handLandmarker ||
        !staticModel ||
        !dynamicModel ||
        video.readyState < 2
      ) {
        animationFrameId.current = requestAnimationFrame(predict);
        return;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const handLandmarkerResult = handLandmarker.detectForVideo(
          video,
          Date.now()
        );

        if (
          handLandmarkerResult.landmarks &&
          handLandmarkerResult.landmarks.length > 0
        ) {
          const landmarks = handLandmarkerResult.landmarks[0];
          drawLandmarks(landmarks);

          // 데이터 전처리 (두 모델이 공통으로 사용)
          const wrist = landmarks[0];
          const keypoints = landmarks.flatMap((lm) => [
            lm.x - wrist.x,
            lm.y - wrist.y,
            lm.z - wrist.z,
          ]);

          // --- 정적 모델 예측 (매 프레임 실행) ---
          tf.tidy(() => {
            const inputTensor = tf.tensor2d([keypoints], [1, 63]);
            const prediction = staticModel.predict(inputTensor) as tf.Tensor;
            const predictedIndex = prediction.argMax(-1).dataSync()[0];
            const label = STATIC_LABELS[predictedIndex];
            setStaticGesture(`정적: ${KOREAN_STATIC_LABELS[label] || label}`);
          });

          // --- 동적 모델 예측 (시퀀스가 찼을 때 실행) ---
          sequenceRef.current.push(keypoints);
          sequenceRef.current = sequenceRef.current.slice(-SEQUENCE_LENGTH);

          if (sequenceRef.current.length === SEQUENCE_LENGTH) {
            tf.tidy(() => {
              const inputTensor = tf.tensor3d(
                [sequenceRef.current],
                [1, SEQUENCE_LENGTH, 63]
              );
              const prediction = dynamicModel.predict(inputTensor) as tf.Tensor;
              const predictionData = prediction.dataSync();
              const confidence = Math.max(...predictionData);

              let label = "none";
              if (confidence >= CONFIDENCE_THRESHOLD) {
                const predictedIndex = prediction.argMax(-1).dataSync()[0];
                label = DYNAMIC_LABELS[predictedIndex];
              }
              setDynamicGesture(
                `동적: ${KOREAN_DYNAMIC_LABELS[label] || label}`
              );

              // TODO: 여기에 'fire', 'nyan' 등 동적 제스처에 따른 시각 효과 로직 추가 가능
            });
          }
        } else {
          clearCanvas();
          sequenceRef.current = []; // 손이 안보이면 시퀀스 초기화
        }
      }
      animationFrameId.current = requestAnimationFrame(predict);
    };
    predict();
  };
  // 랜드마크 그리기 함수
  const drawLandmarks = (landmarks: NormalizedLandmark[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "aqua";
      ctx.fill();
    });
  };

  // 캔버스 클리어 함수
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!mediaStream) {
    return <div>로컬 비디오 스트림을 기다리는 중...</div>;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="360"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "scaleX(-1)",
        }}
      />

      {/* 정적 제스처 결과 (좌측 하단) */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "5px",
          fontSize: "16px",
        }}
      >
        {staticGesture}
      </div>
      {/* 동적 제스처 결과 (우측 하단) */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "5px",
          fontSize: "16px",
        }}
      >
        {dynamicGesture}
      </div>
    </div>
  );
};

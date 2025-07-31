// src/widgets/video-conference/ui/GestureRecognizer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// 컴포넌트 Props 타입 정의
interface GestureRecognizerProps {
  mediaStream: MediaStream | null;
}

const GESTURE_LABELS = [
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

const KOREAN_LABELS: { [key: string]: string } = {
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

export const GestureRecognizer: React.FC<GestureRecognizerProps> = ({
  mediaStream,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gesture, setGesture] = useState<string>("준비 중...");

  // MediaPipe와 TFJS 모델 인스턴스는 리렌더링되어도 유지되도록 ref로 관리
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animationFrameId = useRef<number | null>(null);

  // 1. 초기화 (모델 로딩 및 MediaPipe 설정)
  useEffect(() => {
    async function setupModels() {
      try {
        // MediaPipe HandLandmarker 초기화
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1, // 로컬 유저의 한 손만 인식
        });
        handLandmarkerRef.current = handLandmarker;

        // TensorFlow.js 모델 로딩 (public 폴더 기준 경로)
        const model = await tf.loadLayersModel("/model/model.json");
        modelRef.current = model;

        setGesture("카메라를 향해 손을 보여주세요");
      } catch (error) {
        console.error("AI 모델 초기화 실패:", error);
        setGesture("모델 로딩 실패");
      }
    }
    setupModels();

    // 컴포넌트 언마운트 시 자원 정리
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      handLandmarkerRef.current?.close();
      modelRef.current?.dispose();
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
    const video = videoRef.current;
    if (!video || !handLandmarkerRef.current || !modelRef.current) return;

    const predict = async () => {
      // ▼▼▼▼▼ 수정된 부분 시작 ▼▼▼▼▼

      // ref의 현재 값을 지역 상수에 할당합니다.
      const handLandmarker = handLandmarkerRef.current;
      const model = modelRef.current;

      // predict 루프가 매번 실행될 때마다 모델이 준비되었는지 확인합니다.
      // 이렇게 하면 TypeScript도 이 변수들이 null이 아님을 인지합니다.
      if (!video || !handLandmarker || !model) {
        animationFrameId.current = requestAnimationFrame(predict);
        return;
      }

      if (
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastVideoTimeRef.current = video.currentTime;

        // 이제 안전하게 지역 변수를 사용합니다.
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

          // 1. 손목(landmark 0)을 기준점으로 설정합니다.
          const wrist = landmarks[0];

          // 2. 모든 랜드마크 좌표를 손목 좌표 기준으로 정규화합니다.
          //    Python의 extract_keypoints 로직과 동일합니다.
          const inputData = landmarks.flatMap((lm) => [
            lm.x - wrist.x,
            lm.y - wrist.y,
            lm.z - wrist.z,
          ]);

          // 3. 모델이 기대하는 shape [1, 63]으로 텐서를 생성합니다.
          const inputTensor = tf.tensor2d([inputData], [1, 63]);

          // model도 안전하게 사용합니다.
          const prediction = model.predict(inputTensor) as tf.Tensor;
          const predictionData = await prediction.data();

          const predictedIndex = tf.argMax(predictionData).dataSync()[0];
          // 1. 영어 레이블을 먼저 찾습니다.
          const englishLabel = GESTURE_LABELS[predictedIndex] || "알 수 없음";

          // 2. 영어 레이블을 키로 사용하여 한국어 레이블을 가져옵니다.
          const koreanLabel = KOREAN_LABELS[englishLabel] || englishLabel;

          // 3. UI 상태를 한국어 레이블로 업데이트합니다.
          setGesture(koreanLabel);

          inputTensor.dispose();
          prediction.dispose();
        } else {
          clearCanvas();
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
      {/* 
        실제 비디오 스트림 (좌우 반전으로 거울 모드)
        이 비디오는 MediaPipe에 데이터를 제공하는 소스 역할을 합니다.
      */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
      />
      {/* 
        랜드마크를 그릴 캔버스 (비디오 위에 오버레이)
        비디오와 동일하게 좌우 반전 시켜 좌표를 맞춥니다.
      */}
      <canvas
        ref={canvasRef}
        width="640"
        height="360" // 비디오 해상도에 맞춰 조정
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "scaleX(-1)",
        }}
      />
      {/* 인식된 제스처 표시 */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "5px",
        }}
      >
        {gesture}
      </div>
    </div>
  );
};

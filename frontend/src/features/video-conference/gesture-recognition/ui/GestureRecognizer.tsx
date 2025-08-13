"use client";

import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import * as tf from "@tensorflow/tfjs";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useAppSelector } from "@/shared/hooks/redux";
import { CpuChipIcon, EyeIcon, PowerIcon } from "@heroicons/react/24/solid";

// --- 설정 상수 ---
const SEQUENCE_LENGTH = 30;
const CONFIDENCE_THRESHOLD = 0.92;
const GESTURE_COOLDOWN = 3000;

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
  bad: "👎 따봉 반대",
  fist: "✊ 주먹",
  good: "👍 따봉",
  gun: "👉 총 모양",
  heart: "🫶 손가락 하트",
  none: "없음",
  ok: "👌 OK",
  open_palm: "✋ 손바닥",
  promise: "🤙 약속",
  rock: "🤘 락앤롤",
  victory: "✌️ 브이",
};

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

// --- 타입 및 UI 컴포넌트 ---
type GestureState = { label: string; emoji: string; statusIcon: ReactNode };
interface GestureRecognizerProps {
  children: ReactNode;
  stream: MediaStream;
}

const GestureDisplayCard: React.FC<{
  title: string;
  state: GestureState;
  position: "top-left" | "top-right";
}> = ({ title, state, position }) => {
  const styles: React.CSSProperties = {
    position: "absolute",
    zIndex: 20,
    backgroundColor: "rgba(17, 24, 39, 0.7)",
    backdropFilter: "blur(4px)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    animation: "pop-in 0.3s ease-out forwards",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    top: "10px",
  };
  if (position === "top-left") styles.left = "10px";
  else styles.right = "10px";
  return (
    <div style={styles}>
      <div className="flex-shrink-0 text-teal-400">{state.statusIcon}</div>
      <div>
        <div className="text-xs text-gray-400">{title}</div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{state.emoji}</span>
          <span className="font-semibold">{state.label}</span>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// 로직 모듈화: 커스텀 훅 (Custom Hooks)
// ====================================================================

/** AI 모델들의 생명주기를 관리하고 로딩 상태를 반환하는 훅 */
const useAiModels = () => {
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const staticModelRef = useRef<tf.LayersModel | null>(null);
  const dynamicModelRef = useRef<tf.LayersModel | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupModels = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarkerPromise = HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        const staticModelPromise = tf.loadLayersModel(
          "/static_model/model.json"
        );
        const dynamicModelPromise = tf.loadLayersModel(
          "/dynamic_model/model.json"
        );

        const [handLandmarker, staticModel, dynamicModel] = await Promise.all([
          handLandmarkerPromise,
          staticModelPromise,
          dynamicModelPromise,
        ]);

        handLandmarkerRef.current = handLandmarker;
        staticModelRef.current = staticModel;
        dynamicModelRef.current = dynamicModel;
        setModelsLoaded(true);
      } catch (e) {
        console.error("AI 모델 초기화 실패:", e);
        setError("AI 모델 로딩 실패");
      }
    };
    setupModels();
    return () => {
      handLandmarkerRef.current?.close();
      staticModelRef.current?.dispose();
      dynamicModelRef.current?.dispose();
    };
  }, []);

  return {
    handLandmarker: handLandmarkerRef.current,
    staticModel: staticModelRef.current,
    dynamicModel: dynamicModelRef.current,
    allModelsLoaded: modelsLoaded,
    error,
  };
};

// ====================================================================
// 메인 피처 컴포넌트
// ====================================================================
export const GestureRecognizer: React.FC<GestureRecognizerProps> = ({
  children,
  stream,
}) => {
  // --- Refs and State ---
  const analysisVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const sequenceRef = useRef<number[][]>([]);
  const lastEffectTimeRef = useRef<number>(0);
  const { isStaticGestureOn, isDynamicGestureOn } = useAppSelector(
    (state) => state.gesture
  );
  const [staticGesture, setStaticGesture] = useState<GestureState>({
    label: "모델 로딩 중...",
    emoji: "⌛",
    statusIcon: <CpuChipIcon className="w-5 h-5" />,
  });
  const [dynamicGesture, setDynamicGesture] = useState<GestureState>({
    label: "모델 로딩 중...",
    emoji: "⌛",
    statusIcon: <CpuChipIcon className="w-5 h-5" />,
  });
  const [visualEffect, setVisualEffect] = useState<string | null>(null);

  // --- AI 모델 로딩 ---
  const { handLandmarker, staticModel, dynamicModel, allModelsLoaded, error } =
    useAiModels();

  // --- 예측 로직 ---
  const predictGestures = useCallback(() => {
    const video = analysisVideoRef.current;
    if (!allModelsLoaded || !video || video.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(predictGestures);
      return;
    }

    const handLandmarkerResult = handLandmarker!.detectForVideo(
      video,
      Date.now()
    );

    if (handLandmarkerResult.landmarks?.length > 0) {
      const landmarks = handLandmarkerResult.landmarks[0];
      const wrist = landmarks[0];
      const keypoints = landmarks.flatMap((lm) => [
        lm.x - wrist.x,
        lm.y - wrist.y,
        lm.z - wrist.z,
      ]);

      if (isStaticGestureOn) {
        tf.tidy(() => {
          const prediction = staticModel!.predict(
            tf.tensor2d([keypoints], [1, 63])
          ) as tf.Tensor;
          const label = STATIC_LABELS[prediction.argMax(-1).dataSync()[0]];
          const [emoji, ...text] = (KOREAN_STATIC_LABELS[label] || label).split(
            " "
          );
          setStaticGesture({
            label: text.join(" "),
            emoji,
            statusIcon: <EyeIcon className="w-5 h-5" />,
          });
        });
      }

      if (isDynamicGestureOn) {
        sequenceRef.current.push(keypoints);
        sequenceRef.current = sequenceRef.current.slice(-SEQUENCE_LENGTH);
        if (sequenceRef.current.length === SEQUENCE_LENGTH) {
          tf.tidy(() => {
            const prediction = dynamicModel!.predict(
              tf.tensor3d([sequenceRef.current], [1, SEQUENCE_LENGTH, 63])
            ) as tf.Tensor;
            const confidence = Math.max(...prediction.dataSync());
            let label = "none";
            if (confidence >= CONFIDENCE_THRESHOLD) {
              label = DYNAMIC_LABELS[prediction.argMax(-1).dataSync()[0]];
              const currentTime = Date.now();
              if (
                label !== "none" &&
                label !== "nono" &&
                currentTime - lastEffectTimeRef.current > GESTURE_COOLDOWN
              ) {
                lastEffectTimeRef.current = currentTime;
                const emoji = (KOREAN_DYNAMIC_LABELS[label] || "").split(
                  " "
                )[0];
                setVisualEffect(emoji);
                setTimeout(() => setVisualEffect(null), 2000);
              }
            }
            const [emoji, ...text] = (
              KOREAN_DYNAMIC_LABELS[label] || label
            ).split(" ");
            setDynamicGesture({
              label: text.join(" "),
              emoji,
              statusIcon: <EyeIcon className="w-5 h-5" />,
            });
          });
        }
      }
    } else {
      sequenceRef.current = []; // 손이 안 보이면 시퀀스 초기화
    }

    animationFrameId.current = requestAnimationFrame(predictGestures);
  }, [
    allModelsLoaded,
    handLandmarker,
    staticModel,
    dynamicModel,
    isStaticGestureOn,
    isDynamicGestureOn,
  ]);

  // --- Effects ---
  useEffect(() => {
    // 스트림을 분석용 비디오에 연결
    const video = analysisVideoRef.current;
    if (stream && video) {
      video.srcObject = stream;
      video.play().catch((e) => console.error("분석용 비디오 재생 실패", e));
    }
  }, [stream]);

  useEffect(() => {
    // 모델이 준비되면 예측 루프 시작
    if (allModelsLoaded && stream) {
      predictGestures();
    }
    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [allModelsLoaded, stream, predictGestures]);

  useEffect(() => {
    // 모델 로딩 상태 및 제스처 활성화 여부에 따라 UI 업데이트
    const updateGestureState = (
      isActive: boolean,
      setGesture: (s: GestureState) => void,
      activeLabel: string,
      activeEmoji: string
    ) => {
      if (error)
        setGesture({
          label: "모델 로딩 실패",
          emoji: "💔",
          statusIcon: <CpuChipIcon className="w-5 h-5" />,
        });
      else if (!isActive)
        setGesture({
          label: "꺼짐",
          emoji: "🚫",
          statusIcon: <PowerIcon className="w-5 h-5" />,
        });
      else if (allModelsLoaded)
        setGesture({
          label: activeLabel,
          emoji: activeEmoji,
          statusIcon: <EyeIcon className="w-5 h-5" />,
        });
    };
    updateGestureState(isStaticGestureOn, setStaticGesture, "인식 중", "👀");
    updateGestureState(
      isDynamicGestureOn,
      setDynamicGesture,
      "움직여보세요",
      "🌊"
    );
  }, [isStaticGestureOn, isDynamicGestureOn, allModelsLoaded, error]);

  return (
    <div className="relative w-full h-full">
      {children}
      <video
        ref={analysisVideoRef}
        style={{ display: "none" }}
        muted
        playsInline
      />
      {visualEffect && (
        <div className="visual-effect-corner">{visualEffect}</div>
      )}
      <GestureDisplayCard
        title="정적 제스처"
        state={staticGesture}
        position="top-left"
      />
      <GestureDisplayCard
        title="동적 제스처"
        state={dynamicGesture}
        position="top-right"
      />
      <style>{`@keyframes pop-in{0%{transform:scale(.8);opacity:0}100%{transform:scale(1);opacity:1}}.animate-pop-in{animation:pop-in .3s ease-out forwards}@keyframes fade-in-out-corner{0%,100%{opacity:0;transform:scale(.5)}10%,90%{opacity:1;transform:scale(1)}}.visual-effect-corner{position:absolute;bottom:5%;right:5%;font-size:5rem;text-shadow:0 0 15px rgba(0,0,0,.6);z-index:10;animation:fade-in-out-corner 2s ease-in-out forwards}`}</style>
    </div>
  );
};

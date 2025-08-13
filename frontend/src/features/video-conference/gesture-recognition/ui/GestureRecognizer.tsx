"use client";

import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import * as tf from "@tensorflow/tfjs";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useAppSelector } from "@/shared/hooks/redux";
import { socketApi } from "@/shared/api/socketApi";
import { CpuChipIcon, EyeIcon, PowerIcon } from "@heroicons/react/24/solid";

// --- 설정 상수 ---
const SEQUENCE_LENGTH = 30;
const CONFIDENCE_THRESHOLD = 0.92;
const GESTURE_COOLDOWN = 3000;
const BROADCAST_COOLDOWN = 1000; // 브로드캐스트 쿨다운 (네트워크 부하 방지)

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
  isRemote?: boolean;
  userName?: string;
}> = ({ title, state, position, isRemote = false, userName }) => {
  const styles: React.CSSProperties = {
    position: "absolute",
    zIndex: 20,
    backgroundColor: isRemote
      ? "rgba(34, 197, 94, 0.7)"
      : "rgba(17, 24, 39, 0.7)",
    backdropFilter: "blur(4px)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    animation: "pop-in 0.3s ease-out forwards",
    border: isRemote
      ? "1px solid rgba(34, 197, 94, 0.3)"
      : "1px solid rgba(255, 255, 255, 0.1)",
    top: "10px",
  };
  if (position === "top-left") styles.left = "10px";
  else styles.right = "10px";

  return (
    <div style={styles}>
      <div className="flex-shrink-0 text-teal-400">{state.statusIcon}</div>
      <div>
        <div className="text-xs text-gray-400">
          {title} {isRemote && userName && `(${userName})`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{state.emoji}</span>
          <span className="font-semibold">{state.label}</span>
        </div>
      </div>
    </div>
  );
};

// 원격 제스처 이펙트 표시 컴포넌트
const RemoteGestureEffect: React.FC<{
  effect: string;
  emoji: string;
  userName: string;
  onComplete: () => void;
}> = ({ effect, emoji, userName, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="remote-gesture-effect">
      <div className="text-6xl mb-2">{emoji}</div>
      <div className="text-sm text-white bg-black/50 px-2 py-1 rounded">
        {userName}의 {effect}
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

/** 원격 제스처 수신 및 관리 훅 */
const useRemoteGestures = () => {
  const [remoteGestures, setRemoteGestures] = useState<{
    [userId: string]: {
      static?: GestureState & { userName: string };
      dynamic?: GestureState & { userName: string };
    };
  }>({});
  const [remoteEffects, setRemoteEffects] = useState<
    Array<{
      id: string;
      effect: string;
      emoji: string;
      userName: string;
    }>
  >([]);

  useEffect(() => {
    // 원격 정적 제스처 수신
    const handleRemoteStaticGesture = (event: CustomEvent) => {
      const { userId, userName, label, emoji } = event.detail;
      console.log(
        `🤲 [REMOTE] Static gesture from ${userName}: ${label} ${emoji}`
      );

      setRemoteGestures((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          static: {
            label,
            emoji,
            statusIcon: <EyeIcon className="w-5 h-5" />,
            userName,
          },
        },
      }));

      // 3초 후 자동 제거
      setTimeout(() => {
        setRemoteGestures((prev) => {
          const updated = { ...prev };
          if (updated[userId]) {
            delete updated[userId].static;
            if (!updated[userId].dynamic) {
              delete updated[userId];
            }
          }
          return updated;
        });
      }, 3000);
    };

    // 원격 동적 제스처 수신
    const handleRemoteDynamicGesture = (event: CustomEvent) => {
      const { userId, userName, label, emoji } = event.detail;
      console.log(
        `🌊 [REMOTE] Dynamic gesture from ${userName}: ${label} ${emoji}`
      );

      setRemoteGestures((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          dynamic: {
            label,
            emoji,
            statusIcon: <EyeIcon className="w-5 h-5" />,
            userName,
          },
        },
      }));

      // 3초 후 자동 제거
      setTimeout(() => {
        setRemoteGestures((prev) => {
          const updated = { ...prev };
          if (updated[userId]) {
            delete updated[userId].dynamic;
            if (!updated[userId].static) {
              delete updated[userId];
            }
          }
          return updated;
        });
      }, 3000);
    };

    // 원격 제스처 이펙트 수신
    const handleRemoteGestureEffect = (event: CustomEvent) => {
      const { userId, userName, effect, emoji } = event.detail;
      console.log(`✨ [REMOTE] Effect from ${userName}: ${effect} ${emoji}`);

      const effectId = `${userId}-${Date.now()}`;
      setRemoteEffects((prev) => [
        ...prev,
        {
          id: effectId,
          effect,
          emoji,
          userName,
        },
      ]);
    };

    // 이벤트 리스너 등록
    window.addEventListener(
      "gestureStaticReceived",
      handleRemoteStaticGesture as EventListener
    );
    window.addEventListener(
      "gestureDynamicReceived",
      handleRemoteDynamicGesture as EventListener
    );
    window.addEventListener(
      "gestureEffectReceived",
      handleRemoteGestureEffect as EventListener
    );

    return () => {
      window.removeEventListener(
        "gestureStaticReceived",
        handleRemoteStaticGesture as EventListener
      );
      window.removeEventListener(
        "gestureDynamicReceived",
        handleRemoteDynamicGesture as EventListener
      );
      window.removeEventListener(
        "gestureEffectReceived",
        handleRemoteGestureEffect as EventListener
      );
    };
  }, []);

  const removeEffect = useCallback((effectId: string) => {
    setRemoteEffects((prev) => prev.filter((effect) => effect.id !== effectId));
  }, []);

  return { remoteGestures, remoteEffects, removeEffect };
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
  const lastStaticBroadcastRef = useRef<number>(0);
  const lastDynamicBroadcastRef = useRef<number>(0);

  const { isStaticGestureOn, isDynamicGestureOn } = useAppSelector(
    (state) => state.gesture
  );
  const { roomId, userName } = useAppSelector((state) => state.session);

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

  // --- 원격 제스처 관리 ---
  const { remoteGestures, remoteEffects, removeEffect } = useRemoteGestures();

  // --- 제스처 브로드캐스트 함수 (서버에 맞게 수정) ---
  const broadcastStaticGesture = useCallback(
    (label: string, emoji: string, confidence: number = 1.0) => {
      const now = Date.now();
      if (now - lastStaticBroadcastRef.current < BROADCAST_COOLDOWN) return;

      lastStaticBroadcastRef.current = now;

      if (roomId && userName) {
        console.log(`🤲 [BROADCAST] Static gesture: ${label} ${emoji}`);
        socketApi.broadcastStaticGesture({
          roomId,
          gestureType: "static",
          label,
          emoji,
          confidence,
          timestamp: now,
          userId: socketApi.getSocketId() || "unknown",
          userName,
        });
      }
    },
    [roomId, userName]
  );

  const broadcastDynamicGesture = useCallback(
    (label: string, emoji: string, confidence: number = 1.0) => {
      const now = Date.now();
      if (now - lastDynamicBroadcastRef.current < BROADCAST_COOLDOWN) return;

      lastDynamicBroadcastRef.current = now;

      if (roomId && userName) {
        console.log(`🌊 [BROADCAST] Dynamic gesture: ${label} ${emoji}`);
        socketApi.broadcastDynamicGesture({
          roomId,
          gestureType: "dynamic",
          label,
          emoji,
          confidence,
          timestamp: now,
          userId: socketApi.getSocketId() || "unknown",
          userName,
        });
      }
    },
    [roomId, userName]
  );

  const broadcastGestureEffect = useCallback(
    (effect: string, emoji: string) => {
      if (roomId && userName) {
        console.log(`✨ [BROADCAST] Gesture effect: ${effect} ${emoji}`);
        socketApi.broadcastGestureEffect({
          roomId,
          effect,
          emoji,
          timestamp: Date.now(),
          userId: socketApi.getSocketId() || "unknown",
          userName,
          duration: 2000,
        });
      }
    },
    [roomId, userName]
  );

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
          const labelIndex = prediction.argMax(-1).dataSync()[0];
          const confidence = Math.max(...prediction.dataSync());
          const label = STATIC_LABELS[labelIndex];
          const [emoji, ...text] = (KOREAN_STATIC_LABELS[label] || label).split(
            " "
          );

          setStaticGesture({
            label: text.join(" "),
            emoji,
            statusIcon: <EyeIcon className="w-5 h-5" />,
          });

          // 높은 신뢰도일 때만 브로드캐스트
          if (confidence > 0.8 && label !== "none") {
            broadcastStaticGesture(text.join(" "), emoji, confidence);
          }
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
            const labelIndex = prediction.argMax(-1).dataSync()[0];
            let label = "none";

            if (confidence >= CONFIDENCE_THRESHOLD) {
              label = DYNAMIC_LABELS[labelIndex];
              const currentTime = Date.now();

              if (
                label !== "none" &&
                label !== "nono" &&
                currentTime - lastEffectTimeRef.current > GESTURE_COOLDOWN
              ) {
                lastEffectTimeRef.current = currentTime;
                const [emoji] = (KOREAN_DYNAMIC_LABELS[label] || "").split(" ");

                // 로컬 이펙트 표시
                setVisualEffect(emoji);
                setTimeout(() => setVisualEffect(null), 2000);

                // 원격 참여자들에게 이펙트 브로드캐스트
                broadcastGestureEffect(label, emoji);
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

            // 동적 제스처도 브로드캐스트 (이펙트와 별개)
            if (confidence > 0.7 && label !== "none") {
              broadcastDynamicGesture(text.join(" "), emoji, confidence);
            }
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
    broadcastStaticGesture,
    broadcastDynamicGesture,
    broadcastGestureEffect,
  ]);

  // --- Effects ---
  // 스트림을 분석용 비디오에 연결
  useEffect(() => {
    const video = analysisVideoRef.current;
    if (!stream || !video) return;

    video.srcObject = stream;

    const handleCanPlay = () => {
      video.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.error("분석용 비디오 재생 실패:", err);
        }
      });
    };

    const handlePlay = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      predictGestures();
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [stream, predictGestures]);

  useEffect(() => {
    if (allModelsLoaded && stream) {
      predictGestures();
    }
    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [allModelsLoaded, stream, predictGestures]);

  useEffect(() => {
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

  // 제스처 상태 변경 시 로깅만 (서버에 상태 이벤트가 없음)
  useEffect(() => {
    if (roomId && userName) {
      console.log(
        `⚙️ [INFO] Gesture status changed: static=${isStaticGestureOn}, dynamic=${isDynamicGestureOn}`
      );
      // 서버에 제스처 상태 전송 기능이 없으므로 로컬에서만 관리
    }
  }, [isStaticGestureOn, isDynamicGestureOn, roomId, userName]);

  // 원격 제스처 표시를 위한 렌더링 데이터 준비
  const remoteGesturesList = Object.entries(remoteGestures);

  return (
    <div className="relative w-full h-full">
      {children}

      {/* 분석용 숨겨진 비디오 */}
      <video
        ref={analysisVideoRef}
        style={{ display: "none" }}
        muted
        playsInline
      />

      {/* 로컬 제스처 표시 */}
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

      {/* 원격 제스처 표시 (최대 2개씩) */}
      {remoteGesturesList.slice(0, 2).map(([userId, gestures], index) => (
        <div key={userId}>
          {gestures.static && (
            <GestureDisplayCard
              title="원격 정적"
              state={gestures.static}
              position={index === 0 ? "top-left" : "top-right"}
              isRemote={true}
              userName={gestures.static.userName}
            />
          )}
          {gestures.dynamic && (
            <GestureDisplayCard
              title="원격 동적"
              state={gestures.dynamic}
              position={index === 0 ? "top-left" : "top-right"}
              isRemote={true}
              userName={gestures.dynamic.userName}
            />
          )}
        </div>
      ))}

      {/* 로컬 비주얼 이펙트 */}
      {visualEffect && (
        <div className="visual-effect-corner">{visualEffect}</div>
      )}

      {/* 원격 제스처 이펙트들 */}
      {remoteEffects.map((effect) => (
        <RemoteGestureEffect
          key={effect.id}
          effect={effect.effect}
          emoji={effect.emoji}
          userName={effect.userName}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}

      {/* 스타일 정의 */}
      <style>{`
        @keyframes pop-in {
          0% {
            transform: scale(.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-pop-in {
          animation: pop-in .3s ease-out forwards;
        }
        
        @keyframes fade-in-out-corner {
          0%, 100% {
            opacity: 0;
            transform: scale(.5);
          }
          10%, 90% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .visual-effect-corner {
          position: absolute;
          bottom: 5%;
          right: 5%;
          font-size: 5rem;
          text-shadow: 0 0 15px rgba(0,0,0,.6);
          z-index: 10;
          animation: fade-in-out-corner 2s ease-in-out forwards;
        }

        .remote-gesture-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 15;
          animation: fade-in-out-corner 2s ease-in-out forwards;
          text-shadow: 0 0 15px rgba(0,0,0,.6);
        }
      `}</style>
    </div>
  );
};

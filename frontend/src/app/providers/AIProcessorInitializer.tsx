// src/app/providers/AIProcessorInitializer.tsx

"use client";

import { useEffect, useRef } from "react";
import { initializeAISystem, cleanupAISystem } from "@/shared/api/ai";
import { useAppDispatch } from "@/shared/config/hooks";

// AI 초기화가 한 번만 실행되도록 보장하는 플래그 (Strict Mode 대응)
let aiSystemInitialized = false;

export default function AIProcessorInitializer() {
  const dispatch = useAppDispatch();
  const isMounted = useRef(false);

  useEffect(() => {
    // 개발 환경의 React.StrictMode에서 useEffect가 두 번 실행되는 것을 방지
    // 실제 프로덕션에서는 aiSystemInitialized 플래그만으로도 충분합니다.
    if (!isMounted.current) {
      isMounted.current = true;
      // 첫 마운트 시에만 초기화 로직 실행
      if (aiSystemInitialized) {
        console.log("⚠️ AI System already initialized. Skipping re-initialization.");
        return;
      }

      console.log("🚀 Initializing AI System (via AIProcessorInitializer)...");
      initializeAISystem(dispatch)
        .then(() => {
          aiSystemInitialized = true;
          console.log("✅ AI System initialized successfully from AIProcessorInitializer.");
        })
        .catch((error) => {
          console.error("❌ Failed to initialize AI System from AIProcessorInitializer:", error);
          aiSystemInitialized = false;
        });
    }

    // 컴포넌트 언마운트 시 클린업
    return () => {
      if (aiSystemInitialized) {
        console.log("🧹 Cleaning up AI System from AIProcessorInitializer...");
        cleanupAISystem();
        aiSystemInitialized = false;
      }
    };
  }, [dispatch]);

  return null;
}

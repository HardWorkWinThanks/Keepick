"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/shared/hooks/redux";
import { mediasoupManager } from "@/shared/api/mediasoupManager";

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 앱이 시작될 때 단 한 번만 API 모듈을 초기화합니다.
    console.log("🚀 Initializing API modules...");

    // 새로운 구조에서는 각 페이지에서 개별적으로 초기화
    // 여기서는 기본 설정만 수행
    const initializeApp = async () => {
      try {
        await mediasoupManager.init(dispatch);
        console.log("✅ MediaSoup manager initialized");
      } catch (error) {
        console.error("❌ Failed to initialize MediaSoup:", error);
      }
    };

    initializeApp();

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log("🧹 Cleaning up app...");
    };
  }, [dispatch]);

  return <>{children}</>;
};

"use client";

import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/shared/config/hooks";
import { useRouter } from "next/navigation";
import KeepickMainLanding from "@/widgets/main-landing/ui/KeepickMainLanding";
import { AppLayout } from "@/widgets/layout";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// OAuth 핸들러를 클라이언트 전용으로 로드
const OAuthHandler = dynamic(
  () => import("@/features/auth/model/OAuthHandler"),
  {
    ssr: false,
  }
);

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const { currentUser, isLoading: userLoading } = useAppSelector((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const keepickMainRef = useRef<{ spillPhotos: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSpillPhotos = () => {
    if (keepickMainRef.current?.spillPhotos) {
      keepickMainRef.current.spillPhotos();
    }
  };

  // 로딩 중이거나 클라이언트 마운트 전에는 로딩 화면
  if (!mounted || authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인/비로그인 상관없이 모든 사용자에게 Main 랜딩페이지 표시
  return (
    <>
      {/* 토큰 파싱을 위한 클라이언트 전용 컴포넌트 */}
      <Suspense fallback={null}>
        <OAuthHandler />
      </Suspense>

      {/* AppLayout으로 일관성 있는 구조 */}
      <AppLayout
        backgroundColor="#111111"
        showCenterButton={true}
        onSpillPhotos={handleSpillPhotos}
      >
        {/* Keepick 메인 랜딩 컨텐츠 */}
        <KeepickMainLanding ref={keepickMainRef} />
      </AppLayout>
    </>
  );
}
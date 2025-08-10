"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/shared/config/hooks";

/**
 * 보호된 페이지에서 사용하는 인증 가드 훅
 * 로그인하지 않은 사용자를 메인페이지로 리다이렉트합니다.
 */
export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;
    
    // localStorage에서 토큰 체크 (Redux 상태가 아직 초기화되지 않았을 수 있음)
    const hasToken = typeof window !== "undefined" && 
      Boolean(localStorage.getItem("accessToken"));
    
    // Redux 인증 상태나 localStorage 토큰 둘 다 없으면 리다이렉트
    if (!isAuthenticated && !hasToken) {
      console.log("🔒 인증 필요: 메인페이지로 리다이렉트");
      router.replace("/");
    }
  }, [isAuthenticated, router, isMounted]);

  // 인증 상태와 토큰 존재 여부 반환
  const hasToken = isMounted && typeof window !== "undefined" && 
    Boolean(localStorage.getItem("accessToken"));
  
  return {
    isAuthenticated: isAuthenticated || hasToken,
    isLoading: !isMounted // Hydration 완료까지는 로딩 상태
  };
}
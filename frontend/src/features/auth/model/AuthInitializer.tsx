"use client";

import { useAppDispatch, useAppSelector } from "@/shared/config/hooks";
import { setTokens, clearAuth, setAuthLoading } from "./authSlice";
import { setUser, clearUser, setUserLoading } from "@/entities/user";
import { authApi } from "../api/authApi";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * 애플리케이션의 인증 상태를 초기화하고 관리하는 최상위 컴포넌트입니다.
 * 앱이 로드될 때 localStorage의 토큰을 확인하여 자동으로 로그인 상태를 복원하고,
 * 인증이 필요한 페이지에 비로그인 사용자가 접근하는 것을 막습니다.
 * @param {AuthInitializerProps} props - 자식 컴포넌트를 포함합니다.
 */
export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 플래그 추가
  const [hasRedirected, setHasRedirected] = useState(false); // 리다이렉트 플래그 추가

  const { isAuthenticated, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const { isLoading: userLoading } = useAppSelector((state) => state.user);

  const fetchUserInfo = async () => {
    dispatch(setUserLoading(true));
    dispatch(setAuthLoading(true));

    try {
      const data = await authApi.getCurrentUser();
      dispatch(setUser(data.data));
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      dispatch(clearAuth());
      dispatch(clearUser());
    } finally {
      dispatch(setUserLoading(false));
      dispatch(setAuthLoading(false));
    }
  };

  // 앱 시작 시 한 번만 실행되는 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === "undefined" || isInitialized) {
        return; // 서버사이드이거나 이미 초기화된 경우 건너뛰기
      }

      // OAuth 콜백 처리 중인 경우 초기화 건너뛰기 (중복 방지)
      const currentUrl = window.location.href;
      const isOAuthCallback = currentUrl.includes('token=') || currentUrl.includes('accessToken=') || currentUrl.includes('error=');
      
      if (isOAuthCallback) {
        console.log("💡 OAuth 콜백 처리 중, AuthInitializer 초기화 건너뛰기");
        setIsInitialized(true);
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken) {
        console.log("💡 localStorage에서 토큰 발견, 복원 중...");

        // 토큰이 있으면 즉시 인증 상태로 설정
        dispatch(
          setTokens({
            accessToken,
            refreshToken: refreshToken || undefined,
          })
        );

        // 백그라운드에서 사용자 정보 검증
        await fetchUserInfo();
      } else {
        console.log("💡 localStorage에 토큰 없음, 비로그인 상태 유지");
      }

      setIsInitialized(true); // 초기화 완료 표시
    };

    initializeAuth();
  }, []); // 의존성 없음 - 앱 시작 시 한 번만 실행

  // AuthInitializer는 오직 인증 상태만 초기화하고, 리다이렉트는 하지 않음
  return <>{children}</>;
}

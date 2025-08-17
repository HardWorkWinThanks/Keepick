"use client";

import { useAppDispatch, useAppSelector } from "@/shared/config/hooks";
import { setTokens, clearAuth, setAuthLoading } from "./authSlice";
import { setUser, clearUser, setUserLoading } from "@/entities/user";
import { authApi } from "../api/authApi";
import { userApi, userQueryKeys } from "@/shared/api/userApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 플래그 추가
  const [hasRedirected, setHasRedirected] = useState(false); // 리다이렉트 플래그 추가
  const [shouldFetchUser, setShouldFetchUser] = useState(false); // 사용자 정보 조회 플래그

  const { isAuthenticated, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const { isLoading: userLoading } = useAppSelector((state) => state.user);

  // TanStack Query를 사용한 사용자 정보 조회 (조건부)
  const { data: userData, isLoading: isUserQueryLoading, error: userQueryError } = useQuery({
    queryKey: userQueryKeys.current(),
    queryFn: async () => {
      console.log('🔍 AuthInitializer에서 공통 userApi.getCurrentUser 호출');
      const result = await userApi.getCurrentUser();
      console.log('✅ AuthInitializer 사용자 정보 조회 완료:', result);
      return result;
    },
    enabled: shouldFetchUser, // 토큰이 있을 때만 실행
    staleTime: 1000 * 60 * 60 * 3, // 3시간 캐시
    retry: 2,
  });

  // TanStack Query 결과 처리
  useEffect(() => {
    if (!shouldFetchUser) return;

    if (isUserQueryLoading) {
      dispatch(setUserLoading(true));
      dispatch(setAuthLoading(true));
    } else {
      dispatch(setUserLoading(false));
      dispatch(setAuthLoading(false));

      if (userData) {
        console.log('✅ AuthInitializer: 사용자 정보 Redux 동기화 완료');
        dispatch(setUser(userData));
      } else if (userQueryError) {
        console.error("사용자 정보 조회 실패:", userQueryError);
        dispatch(clearAuth());
        dispatch(clearUser());
      }
    }
  }, [userData, isUserQueryLoading, userQueryError, shouldFetchUser, dispatch]);

  // 앱 시작 시 한 번만 실행되는 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === "undefined" || isInitialized) {
        return; // 서버사이드이거나 이미 초기화된 경우 건너뛰기
      }

      // OAuth 콜백 처리 중인 경우 초기화 건너뛰기 (중복 방지)
      if (sessionStorage.getItem('oauth_in_progress')) {
        console.log("💡 OAuth 콜백 처리 중, AuthInitializer 초기화 건너뛰기");
        return;
      }

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

        // 백그라운드에서 사용자 정보 검증 (TanStack Query 활성화)
        setShouldFetchUser(true);
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

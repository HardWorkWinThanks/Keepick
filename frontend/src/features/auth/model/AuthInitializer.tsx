"use client";

import { useAppDispatch, useAppSelector } from "@/shared/config/hooks";
import { setTokens, clearAuth, setAuthLoading } from "./authSlice";
import { setUser, clearUser, setUserLoading } from "@/entities/user";
import { authApi } from "../api/authApi";
import { useEffect } from "react";
import { usePathname, redirect } from "next/navigation";

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
  const { isAuthenticated, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const { isLoading: userLoading } = useAppSelector((state) => state.user);

  /**
   * 토큰이 유효할 때, 서버로부터 현재 사용자 정보를 가져오는 함수입니다.
   */
  const fetchUserInfo = async () => {
    dispatch(setUserLoading(true));
    dispatch(setAuthLoading(true));

    try {
      const data = await authApi.getCurrentUser();
      // 실제 사용자 데이터는 data.data 안에 있음
      dispatch(setUser(data.data));
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      // 유효하지 않은 토큰으로 간주하고, 모든 인증/사용자 정보를 초기화합니다.
      dispatch(clearAuth());
      dispatch(clearUser());
    } finally {
      dispatch(setUserLoading(false));
      dispatch(setAuthLoading(false));
    }
  };

  // 컴포넌트 마운트 시 또는 인증 상태가 변경될 때 한 번만 실행됩니다.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      // localStorage에 토큰이 있지만, Redux 스토어에 인증 정보가 없는 경우
      // (예: 페이지 새로고침)
      if (accessToken && !isAuthenticated) {
        // Redux 스토어에 토큰을 설정하고, 사용자 정보를 가져옵니다.
        dispatch(
          setTokens({ accessToken, refreshToken: refreshToken || undefined })
        );
        fetchUserInfo();
      }
    }
  }, [isAuthenticated, dispatch]);

  const hasToken = typeof window !== "undefined" && localStorage.getItem("accessToken");
  const isInitializing = authLoading || userLoading; // 인증 또는 유저 정보 로딩 중

  // 인증이 필요한 보호된 경로 목록
  const protectedPaths = ["/profile", "/group", "/chat"];
  const isProtectedPath = pathname
    ? protectedPaths.some((path) => pathname.startsWith(path))
    : false;

  // 보호된 경로에 토큰 없이 접근하려고 하고, 초기화 과정이 끝났다면 로그인 페이지로 리디렉션합니다.
  if (isProtectedPath && !hasToken && !isInitializing) {
    redirect("/login");
  }

  // 자식 컴포넌트를 렌더링합니다.
  return <>{children}</>;
}
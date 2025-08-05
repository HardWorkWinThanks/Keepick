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

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  ); // 인증 로딩 상태 추가
  const { currentUser, isLoading: userLoading } = useAppSelector(
    (state) => state.user
  ); // 사용자 로딩 상태 추가

  // 유저 정보 가져오는 함수
  const fetchUserInfo = async () => {
    dispatch(setUserLoading(true));
    dispatch(setAuthLoading(true));

    try {
      const data = await authApi.getCurrentUser();
      dispatch(setUser(data.user));
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      dispatch(clearAuth());
      dispatch(clearUser());
    } finally {
      dispatch(setUserLoading(false));
      dispatch(setAuthLoading(false));
    }
  };

  useEffect(() => {
    // localStorage에서 토큰 복원
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken && !isAuthenticated) {
        // 토큰이 있으면 로그아웃 상태일 수 없음 → 세션스토리지 정리
        sessionStorage.removeItem("isLoggedOut");

        dispatch(setTokens({ accessToken, refreshToken: refreshToken || undefined }));
        fetchUserInfo();
      }
    }
  }, [isAuthenticated, dispatch]);

  // 리다이렉트는 토큰이 없고 명시적으로 로그아웃한 경우만
  const isLoggedOut = typeof window !== "undefined" &&
    sessionStorage.getItem("isLoggedOut") === "true";
  const hasToken = typeof window !== "undefined" &&
    localStorage.getItem("accessToken");

  if (pathname !== "/login" && isLoggedOut && !hasToken) {
    sessionStorage.removeItem("isLoggedOut");
    redirect("/login");
  }

  return <>{children}</>;
}

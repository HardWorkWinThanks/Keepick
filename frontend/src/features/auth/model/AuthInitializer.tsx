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
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentUser } = useAppSelector((state) => state.user);

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
        // 토큰을 Redux에 복원
        dispatch(
          setTokens({ accessToken, refreshToken: refreshToken || undefined })
        );
        // 사용자 정보 가져오기
        fetchUserInfo();
      }
    }
  }, [isAuthenticated, dispatch]);

  // 인증이 필요한 페이지에서만 체크
  if (pathname !== "/login" && !currentUser && !isAuthenticated) {
    redirect("/login");
  }

  return <>{children}</>;
}

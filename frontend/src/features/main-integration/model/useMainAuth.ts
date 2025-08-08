'use client';

import { useAppSelector } from "@/shared/config/hooks";

/**
 * 메인 랜딩페이지의 인증 상태를 Keepick의 실제 Redux 상태와 연결하는 훅
 */
export const useMainAuth = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentUser } = useAppSelector((state) => state.user);

  return {
    // 메인페이지의 isLoggedIn을 실제 인증 상태로 연결
    isLoggedIn: isAuthenticated,
    user: currentUser ? {
      name: currentUser.nickname || "사용자",
      imageUrl: currentUser.profileUrl || "/basic_profile.webp",
    } : null,
  };
};
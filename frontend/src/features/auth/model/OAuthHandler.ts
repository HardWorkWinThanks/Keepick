"use client";

import { useOAuthCallback } from "@/features/auth/model/useOAuthCallback";

/**
 * 소셜 로그인 후, 인증 서버로부터 리디렉션되는 경로에서 사용되는 컴포넌트입니다.
 * 이 컴포넌트는 UI를 렌더링하지 않고, URL에서 인증 코드를 파싱하여
 * 실제 로그인 처리를 하는 `useOAuthCallback` 훅을 호출하는 역할만 합니다.
 */
export default function OAuthHandler() {
  useOAuthCallback(); // 실제 로직은 이 훅에 위임합니다.
  return null; // UI는 렌더링하지 않습니다.
}

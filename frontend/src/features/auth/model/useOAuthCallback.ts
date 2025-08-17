// features/auth/hooks/useOAuthCallback.ts
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/shared/config/hooks";
import { setTokens, setAuthLoading } from "./authSlice";
import { setUser, setUserLoading } from "@/entities/user";
import { authApi } from "../api/authApi";
import { userApi } from "@/shared/api/userApi";

// OAuth2 콜백 처리를 위한 커스텀 훅
export const useOAuthCallback = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isProcessing = useRef(false); // 중복 실행 방지

  // 시연용 하드코딩 제거됨 

  useEffect(() => {
    const run = async () => {
      // 이미 처리 중인 경우 중복 실행 방지
      if (isProcessing.current) {
        return;
      }

      // URL에서 토큰들과 에러 추출
      const accessToken =
        searchParams?.get("token") || searchParams?.get("accessToken");
      const refreshToken = searchParams?.get("refreshToken");
      const error = searchParams?.get("error");

      // OAuth 관련 파라미터가 없으면 처리하지 않음
      if (!accessToken && !error) {
        return;
      }

      isProcessing.current = true; // 처리 시작

      try {
        if (error) {
          console.error("OAuth2 Error:", error);
          // 조건부 리다이렉트: 이미 메인페이지라면 파라미터만 변경
          if (window.location.pathname === '/') {
            const errorUrl = `${window.location.origin}/?error=${encodeURIComponent(error)}`;
            window.history.replaceState({}, '', errorUrl);
            console.log("🔄 OAuth 에러: URL 파라미터만 변경 (페이지 재로드 없음)");
          } else {
            router.replace(`/?error=${encodeURIComponent(error)}`);
            console.log("🔄 OAuth 에러: 메인페이지로 리다이렉트");
          }
          return;
        }

        if (accessToken) {
          console.log("✅ OAuth 로그인 성공, 토큰 처리 시작");
          
          // OAuth 처리 시작 표시
          sessionStorage.setItem('oauth_processing', 'true');
          
          // 1. 토큰을 localStorage에 저장 (동기적으로)
          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }

          // 2. Redux 상태 업데이트
          dispatch(
            setTokens({
              accessToken,
              refreshToken: refreshToken || undefined,
            })
          );

          // 3. 사용자 정보 가져오기
          await fetchUserInfo();

          // 4. 성공 후 URL 파라미터만 정리 (페이지 리다이렉트 제거)
          console.log("✅ OAuth 로그인 완료, URL 파라미터 정리");
          // URL 파라미터를 모두 제거하여 OAuthHandler가 다시 실행되지 않도록 함
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
          console.log("📦 OAuth 처리 완료, 페이지 재로드 없이 완료");
          // router.replace('/') 제거 - 불필요한 페이지 재로드 방지
        }
      } catch (error) {
        console.error("OAuth 처리 중 오류:", error);
        // 조건부 리다이렉트: 이미 메인페이지라면 파라미터만 변경
        if (window.location.pathname === '/') {
          const errorUrl = `${window.location.origin}/?error=oauth_process_failed`;
          window.history.replaceState({}, '', errorUrl);
          console.log("🔄 OAuth 처리 실패: URL 파라미터만 변경 (페이지 재로드 없음)");
        } else {
          router.replace('/?error=oauth_process_failed');
          console.log("🔄 OAuth 처리 실패: 메인페이지로 리다이렉트");
        }
      } finally {
        isProcessing.current = false; // 처리 완료
        sessionStorage.removeItem('oauth_in_progress');
        sessionStorage.removeItem('oauth_processing');
        sessionStorage.setItem('oauth_completed', Date.now().toString());
        console.log("🏁 OAuth 콜백 처리 완전 종료");
      }
    };

    // OAuth 관련 파라미터가 있을 때만 실행
    if (searchParams?.has("token") || searchParams?.has("accessToken") || searchParams?.has("error")) {
      run();
    }
  }, [searchParams, router, dispatch]);

  // 사용자 정보를 API에서 가져와서 Redux에 저장
  const fetchUserInfo = async () => {
    // 로딩 상태 시작
    dispatch(setUserLoading(true));
    dispatch(setAuthLoading(true));

    try {
      // /api/members/me 호출하여 사용자 정보 조회 (공통 API 사용)
      const userData = await userApi.getCurrentUser();
      // entities/user에 사용자 정보 저장
      dispatch(setUser(userData));
    } catch (error) {
      console.error("User info fetch error:", error);
      // 조건부 리다이렉트: 이미 메인페이지라면 파라미터만 변경
      if (window.location.pathname === '/') {
        const errorUrl = `${window.location.origin}/?error=user_info_failed`;
        window.history.replaceState({}, '', errorUrl);
        console.log("🔄 사용자 정보 조회 실패: URL 파라미터만 변경 (페이지 재로드 없음)");
      } else {
        router.replace('/?error=user_info_failed');
        console.log("🔄 사용자 정보 조회 실패: 메인페이지로 리다이렉트");
      }
    } finally {
      // 로딩 상태 종료
      dispatch(setUserLoading(false));
      dispatch(setAuthLoading(false));
    }
  };
};

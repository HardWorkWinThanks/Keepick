// features/auth/hooks/useOAuthCallback.ts
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/shared/config/hooks";
import { setTokens, setAuthLoading } from "./authSlice";
import { setUser, setUserLoading } from "@/entities/user";
import { authApi } from "../api/authApi";

// OAuth2 콜백 처리를 위한 커스텀 훅
export const useOAuthCallback = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isProcessing = useRef(false); // 중복 실행 방지

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
          // URL 파라미터 정리 후 에러와 함께 홈으로 이동
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
          router.replace("/?error=" + encodeURIComponent(error));
          return;
        }

        if (accessToken) {
          console.log("✅ OAuth 로그인 성공, 토큰 처리 시작");
          
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

          // 4. 성공 후 URL 파라미터 정리하고 홈으로 이동
          console.log("✅ OAuth 로그인 완료, 홈으로 이동");
          // URL 파라미터를 모두 제거하여 OAuthHandler가 다시 실행되지 않도록 함
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch (error) {
        console.error("OAuth 처리 중 오류:", error);
        // URL 파라미터 정리 후 에러와 함께 홈으로 이동
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      } finally {
        isProcessing.current = false; // 처리 완료
        sessionStorage.removeItem('oauth_in_progress');
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
      // /api/members/me 호출하여 사용자 정보 조회
      const data = await authApi.getCurrentUser();
      // entities/user에 사용자 정보 저장 (실제 데이터는 data.data 안에 있음)
      dispatch(setUser(data.data));
    } catch (error) {
      console.error("User info fetch error:", error);
      // URL 파라미터 정리 후 사용자 정보 가져오기 실패 시 에러 페이지로
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } finally {
      // 로딩 상태 종료
      dispatch(setUserLoading(false));
      dispatch(setAuthLoading(false));
    }
  };
};

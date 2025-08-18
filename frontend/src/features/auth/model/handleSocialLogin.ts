import { SocialProvider } from "../types";

/**
 * 사용자가 소셜 로그인 버튼을 클릭했을 때 호출되는 함수입니다.
 * 백엔드 서버의 소셜 로그인 시작 URL로 브라우저를 리디렉션시킵니다.
 * @param provider - 어떤 소셜 로그인(google, kakao, naver)을 시작할지 결정하는 값
 */
export const handleSocialLogin = async (provider: SocialProvider) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    // 백엔드 서버의 소셜 로그인 인증 시작 엔드포인트로 페이지를 이동시킵니다.
    // 예: https://api.example.com/api/oauth2/authorization/google
    window.location.href = `${baseUrl}/api/oauth2/authorization/${provider}`;
  } catch (error) {
    console.error(`${provider} 로그인 요청 중 오류:`, error);
  }
};
  import { SocialProvider } from "../model/types";
  import { apiClient } from "@/shared/api/http";
  import { OAuthUrlResponse } from "@/shared/types/api";

  export const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      // 타입을 명시적으로 지정
      const response = await apiClient.get<OAuthUrlResponse>(`/api/oauth2/authorization/${provider}`);
      const { authUrl } = response.data;

      window.location.href = authUrl;
    } catch (error) {
      console.error(`${provider} 로그인 요청 중 오류:`, error);
    }
  };
 // features/auth/hooks/useOAuthCallback.ts
  import { useSearchParams, useRouter } from 'next/navigation';
  import { useEffect } from 'react';
  import { useAppDispatch } from '@/shared/config/hooks';
  import { setTokens, setAuthLoading } from './authSlice';
  import { setUser, setUserLoading } from '@/entities/user';
  import { authApi } from '../api/authApi';

  // OAuth2 콜백 처리를 위한 커스텀 훅
  export const useOAuthCallback = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();

    useEffect(() => {
      // URL에서 토큰들과 에러 추출
      const accessToken = searchParams?.get('token') || searchParams?.get('accessToken');
      const refreshToken = searchParams?.get('refreshToken');
      const error = searchParams?.get('error');

      // 에러가 있으면 로그인 페이지로 리다이렉트
      if (error) {
        console.error('OAuth2 Error:', error);
        router.replace('/login?error=' + encodeURIComponent(error));
        return;
      }

      // accessToken이 있으면 로그인 처리
      if (accessToken) {
        // 1. 토큰들을 Redux + localStorage에 저장
        dispatch(setTokens({
          accessToken,
          refreshToken: refreshToken || undefined
        }));

        // 2. 사용자 정보 가져오기
        fetchUserInfo();

        // 3. URL에서 토큰들 제거 (보안상 중요)
        router.replace('/');
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
        // entities/user에 사용자 정보 저장
        dispatch(setUser(data.user));
      } catch (error) {
        console.error('User info fetch error:', error);
        // 사용자 정보 가져오기 실패 시 에러 페이지로
        router.replace('/login?error=fetch_failed');
      } finally {
        // 로딩 상태 종료
        dispatch(setUserLoading(false));
        dispatch(setAuthLoading(false));
      }
    };
  };
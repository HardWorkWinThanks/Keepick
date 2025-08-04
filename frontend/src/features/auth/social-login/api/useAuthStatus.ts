  import { useQuery } from "@tanstack/react-query";
  import { useEffect } from "react";
  import { useAppDispatch } from "@/shared/config/hooks";
  import { setAuth, clearAuth } from "@/shared/store/features/auth/authSlice";
  import { apiClient } from "@/shared/api/http";
  import { AuthResponse } from "@/shared/types/api";

  const checkAuthStatus = async (): Promise<AuthResponse> => {
    // 타입 명시적 지정
    const response = await apiClient.get<AuthResponse>("/api/auth/me");
    return response.data;
  };

  export const useAuthStatus = () => {
    const dispatch = useAppDispatch();

    // v5 방식: data, error, isLoading 반환값 사용
    const { data, error, isLoading } = useQuery({
      queryKey: ["auth", "status"],
      queryFn: checkAuthStatus,
      staleTime: 5 * 60 * 1000,
      retry: false,
    });

    // v5에서는 useEffect로 side effect 처리
    useEffect(() => {
      if (data) {
        dispatch(setAuth({ user: data.user }));
      }
    }, [data, dispatch]);

    useEffect(() => {
      if (error) {
        dispatch(clearAuth());
      }
    }, [error, dispatch]);

    return { data, error, isLoading };
  };
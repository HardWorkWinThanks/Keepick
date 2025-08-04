import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/shared/config/hooks";
import { clearAuth } from "@/shared/store/features/auth/authSlice";
import { apiClient } from "@/shared/api/http";
import { clearJwtCookie } from "@/shared/lib/cookies";

const logoutApi = async (): Promise<void> => {
  // void 타입 명시
  await apiClient.post<void>("/api/auth/logout");
};

export const useLogout = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  // v5 방식: mutation 객체에서 상태 추출
  const mutation = useMutation({
    mutationFn: logoutApi,
  });

  // v5에서는 별도 함수로 성공/실패 처리
  const logout = async () => {
    try {
      await mutation.mutateAsync();

      // 성공시 처리
      dispatch(clearAuth());
      clearJwtCookie();
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      // 에러가 나도 로컬 상태는 정리
      dispatch(clearAuth());
      clearJwtCookie();
      router.push("/login");
    }
  };

  return {
    logout,
    isLoading: mutation.isPending, // v5에서는 isPending 사용
    error: mutation.error,
  };
};

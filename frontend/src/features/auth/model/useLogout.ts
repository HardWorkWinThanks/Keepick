import { useAppDispatch } from "@/shared/config/hooks";
import { clearAuth } from "./authSlice";
import { clearUser } from "@/entities/user";
import { useRouter } from "next/navigation";

/**
 * 로그아웃 로직을 수행하는 커스텀 훅입니다.
 * 로그아웃 시 필요한 모든 상태 초기화와 페이지 이동을 한번에 처리합니다.
 * @returns 로그아웃을 실행하는 함수를 반환합니다.
 */
export const useLogout = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  /**
   * 로그아웃을 실행하는 함수입니다.
   */
  const logout = () => {
    // 1. Redux 스토어와 localStorage에서 인증 토큰 정보를 제거합니다.
    dispatch(clearAuth());
    // 2. Redux 스토어에서 사용자 정보를 제거합니다.
    dispatch(clearUser());
    // 3. 사용자를 메인 페이지로 리디렉션합니다.
    router.push("/");
  };

  return logout;
};
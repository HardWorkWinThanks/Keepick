"use client";

import { useState } from "react";
import { UserProfile } from "./types";
import { NaverIcon, KakaoIcon, GoogleIcon } from "@/shared/assets";

/**
 * 프로필 수정 페이지의 상태와 비즈니스 로직을 관리하는 커스텀 훅입니다.
 * @param initialProfile - 컴포넌트가 처음 렌더링될 때 사용할 초기 프로필 데이터
 * @returns 프로필 데이터 상태와 수정을 위한 핸들러 함수들을 반환합니다.
 */
export function useProfileEdit(initialProfile: UserProfile) {
  // 전체 프로필 정보를 관리하는 상태
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  // 닉네임 입력 필드만을 위한 별도의 상태 (중복 체크 등 중간 과정 때문)
  const [nicknameInput, setNicknameInput] = useState(initialProfile.nickname);

  /**
   * 닉네임 중복 여부를 비동기적으로 확인하는 함수입니다.
   * @param nickname - 중복 확인할 닉네임
   * @returns 사용 가능하면 true, 아니면 false를 반환하는 Promise
   * @todo 실제 서버 API와 연동해야 합니다.
   */
  const handleNicknameCheck = async (nickname: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // 임시로 1초 후 항상 true를 반환하도록 설정 (API 연동 필요)
        resolve(true);
      }, 1000);
    });
  };

  /**
   * '적용하기' 버튼을 눌렀을 때, 입력된 닉네임을 실제 프로필 데이터에 반영합니다.
   */
  const handleNicknameApply = () => {
    setUserProfile({
      ...userProfile,
      nickname: nicknameInput,
    });
    alert("닉네임이 변경되었습니다.");
  };

  /**
   * 프로필 사진 변경 버튼 클릭 시 호출되는 핸들러입니다.
   * @todo 실제 파일 업로드 및 이미지 변경 로직을 구현해야 합니다.
   */
  const handleProfileUrlChange = () => {
    alert("프로필 사진 변경 기능");
  };

  /**
   * AI 프로필 사진 변경 버튼 클릭 시 호출되는 핸들러입니다.
   * @todo 실제 파일 업로드 및 이미지 변경 로직을 구현해야 합니다.
   */
  const handleIdentificationUrlChange = () => {
    alert("AI 프로필 사진 변경 기능");
  };

  /**
   * 소셜 로그인 타입에 따라 아이콘으로 반환
   * @param type - 'naver', 'kakao', 'google' 등
   * @returns '네이버', '카카오', '구글' 등 한글 문자열
   */
  // 소셜 타입에 따라 아이콘 동적 선택
  const getProviderIcon = (provider: string) => {
    const baseClasses = "w-4 h-4 rounded flex items-center justify-center";

    switch (provider) {
      case "naver":
        return (
          <div className={`${baseClasses} bg-[#03C75A]`}>
            <NaverIcon />
          </div>
        );
      case "kakao":
        return (
          <div className={`${baseClasses} bg-[#FEE500]`}>
            <KakaoIcon />
          </div>
        );
      case "google":
        return (
          <div className={`${baseClasses} bg-white border border-gray-300`}>
            <GoogleIcon />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-[#03C75A]`}>
            <NaverIcon />
          </div>
        );
    }
  };

  return {
    userProfile,
    nicknameInput,
    setNicknameInput,
    handleNicknameCheck,
    handleNicknameApply,
    handleProfileUrlChange,
    handleIdentificationUrlChange,
    getProviderIcon,
  };
}

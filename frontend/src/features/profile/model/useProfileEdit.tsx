"use client";

import { useState } from "react";
import { NaverIcon, KakaoIcon, GoogleIcon } from "@/shared/assets";
import { profileApi } from "../api/profileApi";
import { useAppDispatch, useAppSelector } from "@/shared/config/hooks";
import { updateUser } from "@/entities/user/model/userSlice";
import { useEffect } from "react";
import { uploadImage } from "@/features/image-upload/api/imageUploadApi";

// 프로필 수정 페이지의 상태와 비즈니스 로직을 관리하는 커스텀 훅입니다.
export function useProfileEdit() {
  const dispatch = useAppDispatch();
  // ✅ Redux에서 직접 사용자 정보 가져오기 (단일 진실의 원천)
  const { currentUser } = useAppSelector((state) => state.user);

  // ✅ 로컬 상태는 최소한만 사용 (임시 입력값과 로딩 상태만)
  const [nicknameInput, setNicknameInput] = useState(
    currentUser?.nickname || ""
  );
  const [isNicknameLoading, setIsNicknameLoading] = useState(false);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false);
  const [isIdentificationImageLoading, setIsIdentificationImageLoading] =
    useState(false);

  // 닉네임 중복 여부를 비동기적으로 확인하는 함수입니다.
  const handleNicknameCheck = async (nickname: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // 임시로 1초 후 항상 true를 반환하도록 설정 (API 연동 필요)
        resolve(true);
      }, 1000);
    });
  };

  // ✅ currentUser가 변경될 때마다 nicknameInput 동기화
  useEffect(() => {
    if (currentUser?.nickname) {
      setNicknameInput(currentUser.nickname);
    }
  }, [currentUser?.nickname]);

  /**
   * '적용하기' 버튼을 눌렀을 때, 입력된 닉네임을 실제 프로필 데이터에 반영합니다.
   */
  const handleNicknameApply = async (): Promise<void> => {
    try {
      setIsNicknameLoading(true);

      const updatedUser = await profileApi.updateUserInfo({
        nickname: nicknameInput,
      });
      // ✅ Redux만 업데이트 (단일 상태 관리)
      dispatch(updateUser(updatedUser));

      console.log("닉네임 변경 완료!");
    } catch (error) {
      console.error("닉네임 변경 실패:", error);
    } finally {
      setIsNicknameLoading(false);
    }
  };

  /**
   * 범용 이미지 업로드 함수
   * @param imageType - 'profile' | 'identification'
   * @param setLoading - 해당 로딩 상태 setter
   */
  const handleImageUpload = async (
    imageType: "profile" | "identification",
    setLoading: (loading: boolean) => void
  ): Promise<void> => {
    try {
      // 파일 탐색기 열기
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";

      input.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          console.log("파일이 선택되지 않았습니다.");
          return;
        }

        console.log(
          `선택된 ${imageType} 파일:`,
          file.name,
          file.size,
          file.type
        );

        try {
          setLoading(true);

          const { publicUrl } = await uploadImage(file)

          const updateData =
            imageType === "profile"
              ? { profileUrl: publicUrl }
              : { identificationUrl: publicUrl };

          const updatedUser = await profileApi.updateUserInfo(updateData);

          // Redux 상태 업데이트
          dispatch(updateUser(updatedUser));

          console.log(`${imageType} 이미지 변경 완료!`);
        } catch (error) {
          console.error(`${imageType} 이미지 업로드 실패:`, error);
          alert("이미지 업로드에 실패했습니다.");
        } finally {
          setLoading(false);
          document.body.removeChild(input);
        }
      };

      document.body.appendChild(input);
      input.click();
    } catch (error) {
      console.error("파일 선택 오류:", error);
    }
  };

  /**
   * 프로필 이미지 변경
   */
  const handleProfileUrlChange = async (): Promise<void> => {
    await handleImageUpload("profile", setIsProfileImageLoading);
  };

  /**
   * AI 인식 이미지 변경
   */
  const handleIdentificationUrlChange = async (): Promise<void> => {
    await handleImageUpload("identification", setIsIdentificationImageLoading);
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
    userProfile: currentUser,
    nicknameInput,
    setNicknameInput,
    handleNicknameCheck,
    handleNicknameApply,
    handleProfileUrlChange,
    handleIdentificationUrlChange,
    getProviderIcon,
    isNicknameLoading,
    isProfileImageLoading,
    isIdentificationImageLoading,
  };
}

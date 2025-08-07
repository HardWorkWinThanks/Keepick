"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/shared/ui/shadcn";
import { VersatileInput } from "@/shared/ui";
import { useProfileEdit } from "../model/useProfileEdit";
import { useAppSelector } from "@/shared/config/hooks";
import Image from "next/image";

/**
 * 사용자 프로필 정보를 표시하고 수정하는 UI를 제공하는 폼 컴포넌트입니다.
 */

export function ProfileForm() {
  // Redux 스토어에서 현재 로그인된 사용자 정보를 가져옵니다.
  const { currentUser } = useAppSelector((state) => state.user);

  // 프로필 수정과 관련된 상태와 핸들러 함수들을 커스텀 훅에서 가져옵니다.
  // ✅ 훅에서 핸들러 함수들만 가져오기
  const {
    nicknameInput,
    setNicknameInput,
    getProviderIcon,
    handleNicknameCheck,
    handleNicknameApply,
    handleProfileUrlChange,
    handleIdentificationUrlChange,
    isNicknameLoading,
    isProfileImageLoading,
    isIdentificationImageLoading,
  } = useProfileEdit();

  // ✅ 안전한 이미지 URL 처리 (Redux 상태에서 직접)
  const safeProfileUrl =
    currentUser?.profileUrl && currentUser.profileUrl.trim() !== ""
      ? currentUser.profileUrl
      : "/basic_profile.webp";

  const safeIdentificationUrl =
    currentUser?.identificationUrl &&
    currentUser.identificationUrl.trim() !== ""
      ? currentUser.identificationUrl
      : "/dummy/dummy2.jpg";

  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">나의 프로필</h1>

      {/* 기본 프로필 섹션 */}
      <Card className="mb-6 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">기본 프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start space-x-6">
            {/* 프로필 이미지 표시 및 변경 버튼 */}
            <div className="flex flex-col items-center space-y-3">
              <Image
                src={safeProfileUrl}
                alt="프로필 사진"
                width={256}
                height={256}
                className="w-32 h-32 rounded-full object-cover"
                quality={90}
              />
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                onClick={handleProfileUrlChange}
              >
                {isProfileImageLoading ? "업로드 중..." : "프로필 사진 변경"}
              </Button>
            </div>
            <div className="flex-1 space-y-4">
              {/* 이메일 (읽기 전용) */}
              <VersatileInput
                label="이메일"
                labelIcon={getProviderIcon(currentUser?.provider || 'kakao')} // 소셜 로그인 아이콘 표시
                value={currentUser?.email || 'user@example.com'}
                readOnly={true}
              />
              {/* 닉네임 (중복 체크 및 적용 기능 포함) */}
              <VersatileInput
                label="닉네임"
                value={nicknameInput}
                onChange={setNicknameInput}
                placeholder="닉네임을 입력하세요"
                showActionButton={true}
                actionButtonText="중복체크"
                actionButtonLoadingText="확인중..."
                onActionClick={handleNicknameCheck}
                successMessage="사용 가능한 닉네임입니다."
                errorMessage="이미 사용중인 닉네임입니다."
                showApplyButton={true}
                applyButtonText="적용하기"
                onApplyClick={handleNicknameApply}
                disabled={isNicknameLoading} // ✅ 로딩 상태 추가
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 인식 프로필 섹션 */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">AI 인식 프로필</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            <div className="flex flex-col items-center space-y-3">
              <Image
                src={safeIdentificationUrl}
                alt="AI 인식 프로필"
                width={256}
                height={256}
                className="w-32 h-32 rounded-full object-cover"
                quality={90}
              />
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                onClick={handleIdentificationUrlChange}
                disabled={isIdentificationImageLoading}
              >
                {isIdentificationImageLoading ? "업로드 중..." : "AI 프로필 변경"}
              </Button>
            </div>
            <div className="flex-1">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <p className="text-sm text-pink-800">
                  AI 인식 프로필은 얼굴 프로필 사진 인식을 위한 사진입니다
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-3 bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
              >
                적절한 사진입니다!
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

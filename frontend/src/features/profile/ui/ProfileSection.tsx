"use client"

import { useState } from "react"
import Image from "next/image"
import { User, Camera, Upload } from "lucide-react"
import { getProfilePlaceholder, DUMMY_IMAGES } from "@/shared/constants/placeholders"
import { Input } from "@/shared/ui/shadcn/input"
import { Label } from "@/shared/ui/shadcn/label"
import { InteractiveHoverButton } from "@/shared/ui/composite/InteractiveHoverButton"
import { useProfile } from "../model/useProfile"

export function ProfileSection() {
  const {
    currentUser,
    isUserDataLoading,
    userDataError,
    nicknameInput,
    setNicknameInput,
    updateNickname,
    uploadProfileImage,
    getProviderIcon,
    checkNicknameAvailability,
    nicknameCheckResult,
    isNicknameLoading,
    isProfileImageLoading,
    isIdentificationImageLoading,
  } = useProfile()

  const [nicknameError, setNicknameError] = useState<string>("")
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)

  // 닉네임 중복 확인 핸들러
  const handleNicknameCheck = async () => {
    if (!nicknameInput.trim() || nicknameInput === currentUser?.nickname) {
      setNicknameError("새로운 닉네임을 입력해주세요.")
      return
    }

    try {
      setIsCheckingNickname(true)
      setNicknameError("")
      await checkNicknameAvailability(nicknameInput)
    } catch (error) {
      setNicknameError("닉네임 중복 확인에 실패했습니다.")
    } finally {
      setIsCheckingNickname(false)
    }
  }

  // 닉네임 업데이트 핸들러
  const handleNicknameUpdate = async () => {
    try {
      setNicknameError("")
      await updateNickname()
    } catch (error: any) {
      setNicknameError(error.message || "닉네임 변경에 실패했습니다.")
    }
  }

  // 안전한 이미지 URL
  const safeProfileUrl = getProfilePlaceholder(currentUser?.profileUrl)
  const safeIdentificationUrl = currentUser?.identificationUrl?.trim() 
    ? currentUser.identificationUrl 
    : DUMMY_IMAGES.PROFILE_ID

  // 로딩 중일 때 스켈레톤 UI 표시
  if (isUserDataLoading) {
    return (
      <div className="space-y-8">
        {/* 기본 프로필 스켈레톤 */}
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
          <div className="h-6 bg-gray-700 rounded w-24 mb-6 animate-pulse"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-30 h-30 bg-gray-700 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI 인식 프로필 스켈레톤 */}
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
          <div className="h-6 bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-30 h-30 bg-gray-700 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-16 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 에러 발생 시 에러 메시지 표시
  if (userDataError) {
    return (
      <div className="space-y-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-red-400 font-medium mb-2">데이터 로드 실패</h3>
          <p className="text-red-300/80 text-sm">
            사용자 정보를 불러오는데 실패했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 기본 프로필 */}
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
        <h3 className="font-keepick-heavy text-lg text-white mb-6">기본 프로필</h3>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Image
                src={safeProfileUrl}
                alt="프로필 사진"
                width={120}
                height={120}
                className="w-30 h-30 rounded-full object-cover border-2 border-gray-700 transition-all duration-300 group-hover:brightness-75"
                quality={90}
              />
              
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <Camera size={20} className="text-white" />
                  <span className="text-white text-xs font-keepick-primary">변경</span>
                </div>
              </div>
              
              {/* 클릭 영역 */}
              <button
                onClick={() => uploadProfileImage("profile")}
                disabled={isProfileImageLoading}
                className="absolute inset-0 rounded-full disabled:cursor-not-allowed"
                aria-label="프로필 사진 변경"
              />
              
              {/* 로딩 오버레이 */}
              {isProfileImageLoading && (
                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white text-xs font-keepick-primary">업로드 중</span>
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-400 text-center font-keepick-primary">
              프로필 사진
            </span>
          </div>

          {/* 프로필 정보 */}
          <div className="flex-1 space-y-4">
            {/* 이메일 (읽기 전용) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-white">이메일</Label>
                {currentUser?.provider && getProviderIcon(currentUser.provider)}
              </div>
              <Input
                value={currentUser?.email || "user@example.com"}
                readOnly
                className="bg-gray-800/50 border-gray-700 text-gray-300 cursor-not-allowed"
              />
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label className="text-white">닉네임</Label>
              <div className="flex gap-2">
                <Input
                  value={nicknameInput}
                  onChange={(e) => {
                    setNicknameInput(e.target.value)
                    setNicknameError("")
                  }}
                  placeholder="닉네임을 입력하세요"
                  className={`flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 ${
                    nicknameCheckResult.checked 
                      ? nicknameCheckResult.available 
                        ? 'border-green-500' 
                        : 'border-red-500'
                      : ''
                  }`}
                  disabled={isNicknameLoading || isCheckingNickname}
                />
                
                {/* 중복 확인 버튼 */}
                <button
                  onClick={handleNicknameCheck}
                  disabled={isCheckingNickname || !nicknameInput.trim() || nicknameInput === currentUser?.nickname}
                  className="group relative px-4 py-2 text-white hover:text-[#FE7A25] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span className="font-keepick-primary text-sm tracking-wide">
                    {isCheckingNickname ? "확인 중..." : "중복 확인"}
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FE7A25] transition-all duration-300 group-hover:w-full group-disabled:w-0"></div>
                </button>

                {/* 저장 버튼 */}
                <button
                  onClick={handleNicknameUpdate}
                  disabled={isNicknameLoading || !nicknameCheckResult.checked || !nicknameCheckResult.available}
                  className="group relative px-4 py-2 text-white hover:text-green-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-keepick-primary text-sm tracking-wide">
                    {isNicknameLoading ? "저장 중..." : "저장"}
                  </span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-full group-disabled:w-0"></div>
                </button>
              </div>
              
              {/* 중복 확인 결과 메시지 */}
              {nicknameCheckResult.checked && (
                <p className={`text-sm ${nicknameCheckResult.available ? 'text-green-400' : 'text-red-400'}`}>
                  {nicknameCheckResult.available 
                    ? '✓ 사용 가능한 닉네임입니다.' 
                    : '✗ 이미 사용 중인 닉네임입니다.'}
                </p>
              )}
              
              {/* 에러 메시지 */}
              {nicknameError && (
                <p className="text-red-400 text-sm">{nicknameError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI 인식 프로필 */}
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
        <h3 className="font-keepick-heavy text-lg text-white mb-6">AI 인식 프로필</h3>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* AI 인식 이미지 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Image
                src={safeIdentificationUrl}
                alt="AI 인식 프로필"
                width={120}
                height={120}
                className="w-30 h-30 rounded-full object-cover border-2 border-gray-700 transition-all duration-300 group-hover:brightness-75"
                quality={90}
              />
              
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <Upload size={20} className="text-white" />
                  <span className="text-white text-xs font-keepick-primary">변경</span>
                </div>
              </div>
              
              {/* 클릭 영역 */}
              <button
                onClick={() => uploadProfileImage("identification")}
                disabled={isIdentificationImageLoading}
                className="absolute inset-0 rounded-full disabled:cursor-not-allowed"
                aria-label="AI 인식 프로필 변경"
              />
              
              {/* 로딩 오버레이 */}
              {isIdentificationImageLoading && (
                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white text-xs font-keepick-primary">업로드 중</span>
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-400 text-center font-keepick-primary">
              AI 인식용 사진
            </span>
          </div>

          {/* AI 프로필 설명 */}
          <div className="flex-1">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-orange-300 font-medium mb-2">AI 인식 프로필이란?</h4>
                  <p className="text-orange-200/80 text-sm leading-relaxed">
                    화상통화 중 얼굴 인식을 위한 기준 사진입니다. 
                    정면을 바라보는 선명한 얼굴 사진을 업로드하면 
                    더 정확한 감정 분석이 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
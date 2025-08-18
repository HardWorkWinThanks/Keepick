"use client"

import { useState } from "react"
import Image from "next/image"
import { User, Camera, Upload, Edit, Check, X } from "lucide-react"
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
    updateNicknameMutation,
    uploadProfileImage,
    uploadImageFile,
    getProviderIcon,
    checkNicknameAvailability,
    nicknameCheckResult,
    setNicknameCheckResult,
    isNicknameLoading,
    isProfileImageLoading,
    isIdentificationImageLoading,
  } = useProfile()

  const [nicknameError, setNicknameError] = useState<string>("")
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [tempNickname, setTempNickname] = useState("")
  const [aiAnalysisMessage, setAiAnalysisMessage] = useState<string>("")
  const [isAiAnalysisPositive, setIsAiAnalysisPositive] = useState<boolean>(true)

  // 닉네임 중복 확인 핸들러
  const handleNicknameCheck = async () => {
    if (!tempNickname.trim() || tempNickname === currentUser?.nickname) {
      setNicknameError("새로운 닉네임을 입력해주세요.")
      return
    }

    try {
      setIsCheckingNickname(true)
      setNicknameError("")
      await checkNicknameAvailability(tempNickname)
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

  // 편집 모드 시작 (닉네임만)
  const handleEditStart = () => {
    setIsEditMode(true)
    setTempNickname(currentUser?.nickname || "")
    setNicknameError("")
  }

  // 편집 완료 (저장) - 닉네임만 처리
  const handleEditComplete = async () => {
    const hasNicknameChange = tempNickname.trim() && tempNickname !== currentUser?.nickname

    // 변경사항이 없으면 편집 모드만 종료
    if (!hasNicknameChange) {
      setIsEditMode(false)
      return
    }

    // 닉네임 변경이 있는 경우 중복 확인 검증
    if (!nicknameCheckResult.checked || !nicknameCheckResult.available) {
      setNicknameError("닉네임 중복 확인을 먼저 해주세요.")
      return
    }

    try {
      setNicknameError("")
      
      // 닉네임 변경 처리 (TanStack Query가 자동으로 캐시 업데이트)
      setNicknameInput(tempNickname)
      await updateNicknameMutation.mutateAsync(tempNickname)

      // 편집 모드 종료 및 상태 초기화
      setIsEditMode(false)
      setNicknameCheckResult({ available: false, checked: false })
      
    } catch (error: any) {
      setNicknameError(error.message || "닉네임 변경에 실패했습니다.")
    }
  }

  // 편집 취소 (닉네임만)
  const handleEditCancel = () => {
    setIsEditMode(false)
    setTempNickname("")
    setNicknameError("")
    setNicknameCheckResult({ available: false, checked: false })
  }

  // 프로필 이미지 업로드 핸들러 (즉시 업로드)
  const handleProfileImageUpload = async () => {
    try {
      const result = await uploadProfileImage("profile")
      // 성공시 TanStack Query가 자동으로 캐시 업데이트
      console.log("프로필 이미지 업로드 완료:", result)
    } catch (error: any) {
      console.error("프로필 이미지 업로드 실패:", error)
      // 에러 처리 (필요시 토스트나 알림 추가)
    }
  }

  // AI 인식 이미지 업로드 핸들러 (즉시 업로드)
  const handleAiImageUpload = async () => {
    try {
      const result = await uploadProfileImage("identification")
      
      // 서버 응답에서 AI 분석 메시지 처리
      if (result && result.message) {
        setAiAnalysisMessage(result.message)
        // 메시지 내용에 따라 적합/부적합 판단 (키워드 기반)
        const positiveKeywords = ["적합", "성공", "승인", "완료", "정상", "좋습니다", "가능합니다"]
        const isPositive = positiveKeywords.some(keyword => result.message.includes(keyword))
        setIsAiAnalysisPositive(isPositive)
      } else {
        // 메시지가 없는 경우 기본 성공 메시지
        setAiAnalysisMessage("이미지가 성공적으로 업로드되었습니다.")
        setIsAiAnalysisPositive(true)
      }
    } catch (error: any) {
      console.error("AI 인식 이미지 업로드 실패:", error)
      // 에러 메시지 설정
      const errorMessage = error.response?.data?.message || error.message || "이미지 업로드에 실패했습니다. 다시 시도해주세요."
      setAiAnalysisMessage(errorMessage)
      setIsAiAnalysisPositive(false)
    }
  }

  // 안전한 이미지 URL (현재 이미지만 사용)
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
      <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800 relative">
        <h3 className="font-keepick-heavy text-lg text-white mb-6">기본 프로필</h3>
        
        {/* 편집 버튼들 - 카드 우측 상단 바깥쪽 */}
        <div className="absolute -top-14 right-0 flex gap-6 z-50">
          {!isEditMode ? (
            <button
              onClick={handleEditStart}
              className="group relative px-3 py-2 text-white hover:text-[#FE7A25] transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <Edit size={20} />
                <span className="font-keepick-primary text-base tracking-wide">수정</span>
              </div>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FE7A25] group-hover:w-full transition-all duration-300"></div>
            </button>
          ) : (
            <>
              <button
                onClick={handleEditComplete}
                disabled={(() => {
                  const hasNicknameChange = tempNickname.trim() && tempNickname !== currentUser?.nickname
                  
                  // 닉네임 변경사항이 없으면 비활성화
                  if (!hasNicknameChange) return true
                  
                  // 닉네임 변경이 있는데 중복 확인이 안 되었으면 비활성화
                  if (!nicknameCheckResult.checked || !nicknameCheckResult.available) return true
                  
                  return false
                })()}
                className="group relative px-3 py-2 text-white hover:text-green-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Check size={20} />
                  <span className="font-keepick-primary text-base tracking-wide">완료</span>
                </div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300 group-disabled:w-0"></div>
              </button>
              <button
                onClick={handleEditCancel}
                className="group relative px-3 py-2 text-white hover:text-red-400 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <X size={20} />
                  <span className="font-keepick-primary text-base tracking-wide">취소</span>
                </div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-400 group-hover:w-full transition-all duration-300"></div>
              </button>
            </>
          )}
        </div>
        
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
              
              {/* 호버 오버레이 - 항상 표시 */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <Camera size={20} className="text-white" />
                  <span className="text-white text-xs font-keepick-primary">변경</span>
                </div>
              </div>
              
              {/* 클릭 영역 - 언제든 활성화 */}
              <button
                onClick={handleProfileImageUpload}
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
              {!isEditMode ? (
                /* 읽기 모드 */
                <Input
                  value={currentUser?.nickname || "닉네임 없음"}
                  readOnly
                  className="bg-gray-800/50 border-gray-700 text-gray-300 cursor-not-allowed"
                />
              ) : (
                /* 편집 모드 - 중복 확인 버튼이 포함된 입력창 */
                <div className="relative">
                  <Input
                    value={tempNickname}
                    onChange={(e) => {
                      setTempNickname(e.target.value)
                      setNicknameError("")
                      // 입력이 변경되면 중복 확인 상태 초기화
                      setNicknameCheckResult({ available: false, checked: false })
                    }}
                    placeholder="닉네임을 입력하세요"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FE7A25] pr-20"
                  />
                  <button
                    onClick={handleNicknameCheck}
                    disabled={isCheckingNickname || !tempNickname.trim() || tempNickname === currentUser?.nickname}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs px-2 py-1 rounded bg-[#FE7A25] text-white hover:bg-[#FE7A25]/80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCheckingNickname ? "확인 중..." : "중복 확인"}
                  </button>
                </div>
              )}
              
              {/* 중복 확인 결과 메시지 */}
              {isEditMode && nicknameCheckResult.checked && (
                <p className={`text-sm ${nicknameCheckResult.available ? "text-green-400" : "text-red-400"}`}>
                  {nicknameCheckResult.available ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다."}
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
              
              {/* 호버 오버레이 - 항상 표시 */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <Upload size={20} className="text-white" />
                  <span className="text-white text-xs font-keepick-primary">변경</span>
                </div>
              </div>
              
              {/* 클릭 영역 - 언제든 활성화 */}
              <button
                onClick={handleAiImageUpload}
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
          <div className="flex-1 space-y-4">
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
            
            {/* AI 분석 결과 메시지 */}
            {aiAnalysisMessage && (
              <div className={`rounded-lg p-4 border ${
                isAiAnalysisPositive 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    isAiAnalysisPositive ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <h4 className={`font-medium mb-1 ${
                      isAiAnalysisPositive ? 'text-green-300' : 'text-red-300'
                    }`}>
                      AI 분석 결과
                    </h4>
                    <p className={`text-sm leading-relaxed ${
                      isAiAnalysisPositive ? 'text-green-200/80' : 'text-red-200/80'
                    }`}>
                      {aiAnalysisMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
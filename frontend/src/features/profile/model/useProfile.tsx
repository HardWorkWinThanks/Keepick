"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppDispatch } from "@/shared/config/hooks"
import { updateUser } from "@/entities/user/model/userSlice"
import { profileApi } from "../api/profileApi"
import { userApi, userQueryKeys } from "@/shared/api/userApi"
import { uploadImage } from "@/features/image-upload"
import { NaverIcon, KakaoIcon, GoogleIcon } from "@/shared/assets"

// Tanstack Query 기반 프로필 관리 훅
export function useProfile() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  
  // 사용자 데이터 쿼리 (공통 API 사용, 조건부 요청)
  const { 
    data: currentUser, 
    isLoading: isUserDataLoading, 
    error: userDataError,
    refetch: refetchUserData 
  } = useQuery({
    queryKey: userQueryKeys.current(),
    queryFn: async () => {
      console.log('🔍 Profile 페이지: 공통 userApi.getCurrentUser 호출 시작');
      const result = await userApi.getCurrentUser();
      console.log('✅ Profile 페이지: 공통 userApi.getCurrentUser 응답:', result);
      return result;
    },
    staleTime: 1000 * 60 * 60 * 3, // 3시간간 신선함 유지
    retry: 2,
    // 중복 요청 방지: 이미 캐시에 데이터가 있고 신선하면 요청하지 않음
    enabled: typeof window !== 'undefined', // 클라이언트에서만 실행
  })
  
  // 로컬 상태 (임시 입력값과 개별 로딩 상태)
  const [nicknameInput, setNicknameInput] = useState("")
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false)
  const [isIdentificationImageLoading, setIsIdentificationImageLoading] = useState(false)
  const [nicknameCheckResult, setNicknameCheckResult] = useState<{ available: boolean; checked: boolean }>({ available: false, checked: false })

  // 현재 사용자 변경 시 닉네임 입력값 동기화 및 Redux 업데이트
  useEffect(() => {
    if (currentUser?.nickname) {
      setNicknameInput(currentUser.nickname)
      setNicknameCheckResult({ available: false, checked: false })
      // Redux도 동기화 (인증 상태 등에서 사용)
      dispatch(updateUser(currentUser))
    }
  }, [currentUser, dispatch])

  // 닉네임 중복 확인
  const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
    if (!nickname.trim() || nickname === currentUser?.nickname) {
      setNicknameCheckResult({ available: false, checked: false })
      return false
    }

    try {
      const result = await profileApi.checkNicknameAvailability(nickname.trim())
      setNicknameCheckResult({ available: result.available, checked: true })
      return result.available
    } catch (error) {
      console.error("닉네임 중복 확인 실패:", error)
      setNicknameCheckResult({ available: false, checked: false })
      return false
    }
  }

  // 닉네임 업데이트 뮤테이션
  const updateNicknameMutation = useMutation({
    mutationFn: (nickname: string) => profileApi.updateUserInfo({ nickname }),
    onMutate: async (nickname) => {
      // 기존 데이터 백업 (롤백용)
      const previousUser = queryClient.getQueryData(userQueryKeys.current())
      
      // 낙관적 업데이트: 서버 응답 전에 UI 먼저 업데이트
      queryClient.setQueryData(userQueryKeys.current(), (old: any) => ({
        ...old,
        nickname
      }))
      
      console.log('🚀 낙관적 업데이트: 닉네임을', nickname, '으로 즉시 변경');
      return { previousUser }
    },
    onSuccess: (updatedUser, variables) => {
      console.log('✅ 닉네임 업데이트 서버 확인 완료, 응답 검증 중:', updatedUser);
      
      // 응답 데이터 검증: 요청한 닉네임과 응답 닉네임이 일치하는지 확인
      const isResponseValid = variables === updatedUser.nickname
      
      if (isResponseValid) {
        console.log('✅ 응답 데이터 유효, 바로 적용');
        queryClient.setQueryData(userQueryKeys.current(), updatedUser)
      } else {
        console.warn('⚠️ 응답 데이터 불일치 감지, GET 요청으로 실제 데이터 재확인');
        console.warn('요청한 닉네임:', variables, '/ 응답 닉네임:', updatedUser.nickname);
        // 응답이 예상과 다르면 GET 요청으로 재확인
        queryClient.invalidateQueries({ queryKey: userQueryKeys.current() })
      }
      
      setNicknameCheckResult({ available: false, checked: false })
    },
    onError: (error, variables, context) => {
      console.error("❌ 닉네임 변경 실패, 이전 상태로 롤백:", error)
      // 실패 시 이전 상태로 롤백
      if (context?.previousUser) {
        queryClient.setQueryData(userQueryKeys.current(), context.previousUser)
      }
    }
  })

  // 닉네임 업데이트 헬퍼 함수
  const updateNickname = async (): Promise<void> => {
    if (!nicknameInput.trim() || nicknameInput === currentUser?.nickname) return
    
    // 중복 확인이 되지 않았거나 사용 불가능한 닉네임인 경우
    if (!nicknameCheckResult.checked || !nicknameCheckResult.available) {
      throw new Error("닉네임 중복 확인을 먼저 해주세요.")
    }
    
    await updateNicknameMutation.mutateAsync(nicknameInput)
  }

  // 이미지 업로드 뮤테이션
  const uploadImageMutation = useMutation({
    mutationFn: async ({ imageType, publicUrl }: { imageType: "profile" | "identification", publicUrl: string }) => {
      const updateData = imageType === "profile" 
        ? { profileUrl: publicUrl } 
        : { identificationUrl: publicUrl }
      console.log(`🖼️ ${imageType} 이미지 업로드 시작:`, updateData);
      return profileApi.updateUserInfo(updateData)
    },
    onMutate: async ({ imageType, publicUrl }) => {
      // 기존 데이터 백업 (롤백용)
      const previousUser = queryClient.getQueryData(userQueryKeys.current())
      
      // 낙관적 업데이트: 서버 응답 전에 UI 먼저 업데이트
      queryClient.setQueryData(userQueryKeys.current(), (old: any) => ({
        ...old,
        [imageType === "profile" ? "profileUrl" : "identificationUrl"]: publicUrl
      }))
      
      console.log(`🚀 낙관적 업데이트: ${imageType} 이미지를 즉시 변경`);
      return { previousUser }
    },
    onSuccess: (updatedUser, variables) => {
      console.log('✅ 이미지 업로드 서버 확인 완료, 응답 검증 중:', updatedUser);
      
      // 응답 데이터 검증: 요청한 이미지 URL과 응답 URL이 일치하는지 확인
      const expectedField = variables.imageType === "profile" ? "profileUrl" : "identificationUrl"
      const isResponseValid = variables.publicUrl === updatedUser[expectedField as keyof typeof updatedUser]
      
      if (isResponseValid) {
        console.log('✅ 응답 데이터 유효, 바로 적용');
        queryClient.setQueryData(userQueryKeys.current(), updatedUser)
      } else {
        console.warn('⚠️ 응답 데이터 불일치 감지, GET 요청으로 실제 데이터 재확인');
        console.warn('요청한 URL:', variables.publicUrl, '/ 응답 URL:', updatedUser[expectedField as keyof typeof updatedUser]);
        // 응답이 예상과 다르면 GET 요청으로 재확인
        queryClient.invalidateQueries({ queryKey: userQueryKeys.current() })
      }
    },
    onError: (error, variables, context) => {
      console.error("❌ 이미지 업로드 실패, 이전 상태로 롤백:", error)
      // 실패 시 이전 상태로 롤백
      if (context?.previousUser) {
        queryClient.setQueryData(userQueryKeys.current(), context.previousUser)
      }
    }
  })

  // 이미지 업로드 처리
  const uploadProfileImage = async (imageType: "profile" | "identification"): Promise<void> => {
    const setLoading = imageType === "profile" ? setIsProfileImageLoading : setIsIdentificationImageLoading
    
    try {
      // 파일 선택
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      
      const file = await new Promise<File | null>((resolve) => {
        input.onchange = (event) => {
          const target = event.target as HTMLInputElement
          resolve(target.files?.[0] || null)
        }
        input.click()
      })

      if (!file) return

      setLoading(true)

      // 이미지 업로드
      const { publicUrl } = await uploadImage(file)

      // 프로필 업데이트 (뮤테이션 사용)
      await uploadImageMutation.mutateAsync({ imageType, publicUrl })

    } catch (error) {
      console.error(`${imageType} 이미지 업로드 실패:`, error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // 소셜 제공자 아이콘 반환
  const getProviderIcon = (provider: string) => {
    const baseClasses = "w-4 h-4 rounded flex items-center justify-center"

    switch (provider) {
      case "naver":
        return (
          <div className={`${baseClasses} bg-[#03C75A]`}>
            <NaverIcon />
          </div>
        )
      case "kakao":
        return (
          <div className={`${baseClasses} bg-[#FEE500]`}>
            <KakaoIcon />
          </div>
        )
      case "google":
        return (
          <div className={`${baseClasses} bg-white border border-gray-300`}>
            <GoogleIcon />
          </div>
        )
      default:
        return (
          <div className={`${baseClasses} bg-[#03C75A]`}>
            <NaverIcon />
          </div>
        )
    }
  }

  return {
    currentUser,
    isUserDataLoading,
    userDataError,
    refetchUserData,
    nicknameInput,
    setNicknameInput,
    updateNickname,
    uploadProfileImage,
    getProviderIcon,
    checkNicknameAvailability,
    nicknameCheckResult,
    isNicknameLoading: updateNicknameMutation.isPending,
    isProfileImageLoading,
    isIdentificationImageLoading,
  }
}
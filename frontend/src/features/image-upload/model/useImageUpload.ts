"use client"

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { uploadImage, ImageUploadResult } from '../api/imageUploadApi'

/**
 * 이미지 업로드를 위한 훅
 * - 파일 업로드 상태 관리
 * - S3 업로드 프로세스 처리
 * - 에러 핸들링
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadImage(file),
    onMutate: () => {
      setIsUploading(true)
      setError(null)
    },
    onSuccess: () => {
      setIsUploading(false)
    },
    onError: (error) => {
      setIsUploading(false)
      const errorMessage = error instanceof Error 
        ? error.message 
        : '이미지 업로드에 실패했습니다.'
      setError(errorMessage)
    }
  })

  const uploadImageAsync = async (file: File): Promise<ImageUploadResult> => {
    try {
      // 파일 검증
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드할 수 있습니다.')
      }

      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기는 5MB 이하여야 합니다.')
      }

      return await uploadMutation.mutateAsync(file)
    } catch (error) {
      throw error
    }
  }

  const resetError = () => {
    setError(null)
  }

  return {
    uploadImage: uploadImageAsync,
    isUploading: isUploading || uploadMutation.isPending,
    error,
    resetError
  }
}
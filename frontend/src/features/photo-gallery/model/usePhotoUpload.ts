"use client"

import { useState } from "react";
import { uploadImages } from "@/features/image-upload/api/imageUploadApi";

interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);

  const updateFileProgress = (fileName: string, updates: Partial<UploadProgress>) => {
    setUploadProgress(prev => 
      prev.map(item => 
        item.fileName === fileName 
          ? { ...item, ...updates }
          : item
      )
    );
  };

  const calculateTotalProgress = (progress: UploadProgress[]) => {
    if (progress.length === 0) return 0;
    const total = progress.reduce((acc, item) => acc + item.progress, 0);
    return Math.round(total / progress.length);
  };

  const uploadPhotos = async (groupId: number, files: File[]): Promise<void> => {
    if (files.length === 0) return;

    setIsUploading(true);
    
    // 초기 progress 상태 설정
    const initialProgress = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploadProgress(initialProgress);
    setTotalProgress(0);

    try {
      // 업로드 상태 변경
      initialProgress.forEach(item => {
        updateFileProgress(item.fileName, { status: 'uploading', progress: 20 });
      });
      
      // uploadImages 함수를 사용하여 전체 업로드 처리
      console.log('이미지 업로드 시작...');
      
      // 진행률 업데이트를 위한 개별 처리
      const uploadPromises = files.map(async (file) => {
        const fileName = file.name;
        
        try {
          updateFileProgress(fileName, { progress: 50 });
          
          // 단일 파일을 배열로 감싸서 uploadImages 호출
          const [result] = await uploadImages(groupId, [file]);
          
          updateFileProgress(fileName, { 
            status: 'completed', 
            progress: 100 
          });
          
          console.log(`${fileName} 업로드 완료`);
          return result;
        } catch (error) {
          console.error(`${fileName} 업로드 실패:`, error);
          updateFileProgress(fileName, { 
            status: 'error', 
            error: '업로드에 실패했습니다.',
            progress: 0 
          });
          throw error;
        }
      });

      // 모든 업로드 완료 대기
      await Promise.allSettled(uploadPromises);
      
      // 전체 progress 업데이트
      setUploadProgress(prev => {
        const newProgress = calculateTotalProgress(prev);
        setTotalProgress(newProgress);
        return prev;
      });

      console.log('모든 파일 업로드 처리 완료');
      
    } catch (error) {
      console.error('업로드 과정에서 오류 발생:', error);
      
      // 모든 파일을 에러 상태로 설정
      setUploadProgress(prev =>
        prev.map(item => ({
          ...item,
          status: 'error' as const,
          error: '업로드 중 오류가 발생했습니다.',
          progress: 0,
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetProgress = () => {
    setUploadProgress([]);
    setTotalProgress(0);
  };

  return {
    isUploading,
    uploadProgress,
    totalProgress,
    uploadPhotos,
    resetProgress,
  };
}
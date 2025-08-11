"use client"

import { useState } from "react";
import { photoGalleryApi } from "../api/photoGalleryApi";
import { extractMultipleImageMetadata } from "@/shared/lib/imageMetadata";

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
      // 1단계: 모든 파일의 메타데이터 추출
      console.log('메타데이터 추출 시작...');
      initialProgress.forEach(item => {
        updateFileProgress(item.fileName, { status: 'uploading', progress: 10 });
      });
      
      const metadataList = await extractMultipleImageMetadata(files);
      
      // 메타데이터 추출 완료
      initialProgress.forEach(item => {
        updateFileProgress(item.fileName, { progress: 30 });
      });
      
      // 2단계: Presigned URL 요청
      console.log('Presigned URL 요청...');
      const uploadResponse = await photoGalleryApi.imagesUpload(groupId, {
        files: metadataList
      });
      
      // Presigned URL 받기 완료
      initialProgress.forEach(item => {
        updateFileProgress(item.fileName, { progress: 50 });
      });

      // 3단계: S3에 파일들을 병렬로 업로드
      console.log('S3 업로드 시작...');
      const uploadPromises = files.map(async (file, index) => {
        const fileName = file.name;
        const presignedData = uploadResponse[index];
        
        if (!presignedData) {
          updateFileProgress(fileName, { 
            status: 'error', 
            error: 'Presigned URL을 받지 못했습니다.',
            progress: 0 
          });
          return;
        }

        try {
          updateFileProgress(fileName, { progress: 70 });
          
          await photoGalleryApi.uploadToS3(presignedData.presignedUrl, file);
          
          updateFileProgress(fileName, { 
            status: 'completed', 
            progress: 100 
          });
          
          console.log(`${fileName} 업로드 완료`);
        } catch (error) {
          console.error(`${fileName} 업로드 실패:`, error);
          updateFileProgress(fileName, { 
            status: 'error', 
            error: '업로드에 실패했습니다.',
            progress: 0 
          });
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
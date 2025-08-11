"use client"

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { usePhotoUpload } from "../model/usePhotoUpload";

interface PhotoUploadModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export function PhotoUploadModal({
  groupId,
  isOpen,
  onClose,
  onUploadComplete,
}: PhotoUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isUploading,
    uploadProgress,
    totalProgress,
    uploadPhotos,
    resetProgress,
  } = usePhotoUpload();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    await uploadPhotos(groupId, selectedFiles);
    
    // 업로드 완료 후 콜백 호출
    onUploadComplete?.();
  };

  const handleClose = () => {
    if (isUploading) return; // 업로드 중에는 닫기 불가
    
    setSelectedFiles([]);
    resetProgress();
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-400" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1a1a1a] rounded-lg border border-gray-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">사진 업로드</h2>
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* 드래그 앤 드롭 영역 */}
              {selectedFiles.length === 0 && (
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                    dragOver
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg mb-2">
                    사진을 드래그하여 업로드하세요
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    또는 클릭하여 파일을 선택하세요
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    파일 선택
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              )}

              {/* 선택된 파일 목록 */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      선택된 파일 ({selectedFiles.length}개)
                    </h3>
                    {!isUploading && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        더 추가
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, index) => {
                      const progress = uploadProgress.find(p => p.fileName === file.name);
                      
                      return (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg"
                        >
                          <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{file.name}</p>
                            <p className="text-gray-400 text-xs">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                            
                            {progress && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-400">
                                    {progress.status === 'pending' && '대기 중'}
                                    {progress.status === 'uploading' && '업로드 중'}
                                    {progress.status === 'completed' && '완료'}
                                    {progress.status === 'error' && progress.error}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {progress.progress}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      progress.status === 'error' 
                                        ? 'bg-red-500' 
                                        : progress.status === 'completed'
                                        ? 'bg-green-500'
                                        : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${progress.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {progress && getStatusIcon(progress.status)}
                            
                            {!isUploading && (
                              <button
                                onClick={() => removeFile(index)}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 전체 진행률 */}
                  {isUploading && (
                    <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm">전체 진행률</span>
                        <span className="text-white text-sm">{totalProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${totalProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                업로드
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
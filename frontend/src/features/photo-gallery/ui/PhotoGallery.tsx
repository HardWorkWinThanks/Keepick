"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, SlidersHorizontal, Check, Trash2, X, ChevronUp, ChevronDown, Upload, Loader2 } from "lucide-react"
import { usePhotoGallery, useMasonryLayout, useDragScroll } from "../model/usePhotoGallery"
import { PhotoModal, usePhotoModal } from "@/features/photos-viewing"
import AiMagicButton from "./AiMagicButton"
import AiServiceModal from "./AiServiceModal"
import { uploadGalleryImages } from "../api/galleryUploadApi"
import { requestAiAnalysis, createAnalysisStatusSSE, AnalysisStatusMessage } from "../api/aiAnalysisApi"
import { getGroupPhotos, getGroupOverview, getPhotoTags, parseTagsString, parseMemberNicknamesString, convertToGalleryPhoto, deleteGroupPhotos } from "../api/galleryPhotosApi"

interface PhotoGalleryProps {
  groupId: string
  onBack?: () => void
}

export default function PhotoGallery({ groupId, onBack }: PhotoGalleryProps) {
  const {
    filteredPhotos,
    selectedPhotoData,
    allTags,
    selectedTags,
    loading,
    hasMore,
    columnCount,
    isSelectionMode,
    selectedPhotos,
    isPhotosExpanded,
    toggleTag,
    clearAllTags,
    enterSelectionMode,
    exitSelectionMode,
    togglePhotoSelection,
    deleteSelectedPhotos: deleteSelectedPhotosBase,
    createTimelineAlbum,
    createTierAlbum,
    loadMorePhotos,
    setIsPhotosExpanded,
    setGalleryData,
  } = usePhotoGallery()

  const columns = useMasonryLayout(filteredPhotos, columnCount)
  const smallPreviewDrag = useDragScroll()
  const expandedPreviewDrag = useDragScroll()
  
  // 사진 모달을 위한 상태 관리
  const { photo: selectedPhoto, isOpen: isPhotoModalOpen, openModal: openPhotoModal, closeModal: closePhotoModal } = usePhotoModal()
  
  // AI 서비스 모달 상태 관리
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  
  // 파일 업로드를 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // SSE 연결 관리
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null)
  
  // 사진 태그 정보 캐시
  const [photoTagsCache, setPhotoTagsCache] = useState<Record<number, { tags: string[], members: string[] }>>({})
  
  // 실시간 태그 목록 (API에서 수집)
  const [realTimeTags, setRealTimeTags] = useState<string[]>([])
  
  // 업로드 상태 관리
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean
    currentStep: 'selecting' | 'uploading' | 'processing' | 'completed'
    progress: number
    totalFiles: number
    uploadedFiles: number
    message: string
  }>({
    isUploading: false,
    currentStep: 'selecting',
    progress: 0,
    totalFiles: 0,
    uploadedFiles: 0,
    message: ''
  })
  
  // 초기 갤러리 데이터 로딩 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('갤러리 초기 데이터 로딩 시작...')
        const overview = await getGroupOverview(parseInt(groupId))
        
        // 전체 사진을 갤러리 형식으로 변환
        const galleryPhotos = overview.allPhotos.list.map(convertToGalleryPhoto)
        
        // 갤러리 데이터 설정
        setGalleryData(galleryPhotos)
        
        console.log('갤러리 초기 데이터 로딩 완료:', {
          allPhotos: overview.allPhotos.list.length,
          blurredPhotos: overview.blurredPhotos.list.length,
          similarClusters: overview.similarPhotos.list.length
        })
        
      } catch (error) {
        console.error('갤러리 초기 데이터 로딩 실패:', error)
      }
    }
    
    loadInitialData()
  }, [groupId])

  // SSE 연결 정리 (컴포넌트 언마운트 시)
  useEffect(() => {
    return () => {
      if (sseConnection) {
        console.log('SSE 연결 정리')
        sseConnection.close()
      }
    }
  }, [sseConnection])
  
  // AI 버튼 클릭 핸들러
  const handleAiServiceClick = () => {
    setIsAiModalOpen(true)
  }
  
  // 유사한 사진 분류 핸들러 (임시)
  const handleSimilarPhotosSort = () => {
    console.log("유사한 사진 분류 실행")
    setIsAiModalOpen(false)
    // TODO: 실제 API 연결
  }
  
  // SSE 연결 시작
  const startSSEConnection = (groupId: number, jobId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 기존 연결이 있으면 종료
      if (sseConnection) {
        sseConnection.close()
      }
      
      const eventSource = createAnalysisStatusSSE(
        groupId,
        jobId,
        // onMessage: SSE 메시지 수신 시
        (data: AnalysisStatusMessage) => {
          console.log('SSE 메시지 수신:', data)
          
          // 진행률 계산 (completedJob / totalJob * 100)
          const progress = data.totalJob > 0 ? (data.completedJob / data.totalJob) * 100 : 0
          
          // 업로드 상태 업데이트
          setUploadState(prev => ({
            ...prev,
            progress,
            message: data.message
          }))
          
          // 상태에 따른 처리
          if (data.jobStatus === 'COMPLETED') {
            console.log('AI 분석 완료')
            eventSource.close()
            resolve()
          } else if (data.jobStatus === 'FAILED') {
            console.error('AI 분석 실패')
            eventSource.close()
            reject(new Error(`AI 분석 실패: ${data.message}`))
          }
          // STARTED, PROCESSING 상태는 계속 대기
        },
        // onError: SSE 연결 오류 시
        (error: Event) => {
          console.error('SSE 연결 오류:', error)
          setSseConnection(null)
          reject(new Error('SSE 연결 오류'))
        },
        // onClose: SSE 연결 종료 시
        () => {
          console.log('SSE 연결 종료')
          setSseConnection(null)
        }
      )
      
      setSseConnection(eventSource)
    })
  }
  
  // 사진 태그 정보 로드
  const loadPhotoTags = async (photoId: number): Promise<void> => {
    // 이미 캐시되어 있으면 스킵
    if (photoTagsCache[photoId]) return
    
    try {
      const photoTags = await getPhotoTags(parseInt(groupId), photoId)
      const tags = parseTagsString(photoTags.tags)
      const members = parseMemberNicknamesString(photoTags.memberNicknames)
      
      // 캐시 업데이트
      setPhotoTagsCache(prev => ({
        ...prev,
        [photoId]: { tags, members }
      }))
      
      // 실시간 태그 목록 업데이트 (중복 제거)
      setRealTimeTags(prev => {
        const newTags = [...prev, ...tags]
        return Array.from(new Set(newTags)).sort()
      })
      
    } catch (error) {
      console.error(`사진 ${photoId} 태그 로드 실패:`, error)
    }
  }

  // 갤러리 새로고침
  const refreshGallery = async (): Promise<void> => {
    try {
      console.log('갤러리 새로고침 중...')
      const overview = await getGroupOverview(parseInt(groupId))
      
      // 전체 사진을 갤러리 형식으로 변환
      const galleryPhotos = overview.allPhotos.list.map(convertToGalleryPhoto)
      
      // 갤러리 데이터 설정
      setGalleryData(galleryPhotos)
      
      console.log('갤러리 새로고침 완료:', galleryPhotos.length + '장')
      
    } catch (error) {
      console.error('갤러리 새로고침 실패:', error)
    }
  }

  // 선택된 사진들 삭제 (실제 API 사용)
  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return
    
    try {
      console.log('사진 삭제 요청:', selectedPhotos)
      
      // API로 사진 삭제 요청
      const deleteResult = await deleteGroupPhotos(parseInt(groupId), selectedPhotos)
      
      console.log('삭제 결과:', deleteResult)
      
      // 성공적으로 삭제된 사진들만 UI에서 제거
      if (deleteResult.deletedPhotoIds.length > 0) {
        // 로컬 상태 업데이트 (삭제된 사진만 제거)
        deleteSelectedPhotosBase() // 기존 로직 사용하여 UI 업데이트
        
        console.log(`${deleteResult.deletedPhotoIds.length}장 삭제 완료`)
      }
      
      // 삭제되지 않은 사진이 있으면 알림
      if (deleteResult.unDeletedPhotoIds.length > 0) {
        alert(`${deleteResult.unDeletedPhotoIds.length}장의 사진을 삭제할 수 없습니다.`)
      }
      
    } catch (error) {
      console.error('사진 삭제 실패:', error)
      alert('사진 삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 파일 업로드 핸들러
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }
  
  // 파일 선택 핸들러
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length === 0) {
      alert('이미지 파일을 선택해주세요.')
      event.target.value = ''
      return
    }
    
    // 업로드 시작
    setUploadState({
      isUploading: true,
      currentStep: 'uploading',
      progress: 0,
      totalFiles: imageFiles.length,
      uploadedFiles: 0,
      message: `${imageFiles.length}개 파일을 업로드합니다.`
    })
    
    try {
      // S3 업로드 실행
      const uploadResults = await uploadGalleryImages(parseInt(groupId), imageFiles)
      
      // 업로드 완료
      setUploadState(prev => ({
        ...prev,
        currentStep: 'uploading',
        progress: 100,
        uploadedFiles: imageFiles.length,
        message: '파일 업로드가 완료되었습니다.'
      }))
      
      console.log('업로드 완료:', uploadResults)
      
      // AI 처리 요청 단계로 이동
      const photoIds = uploadResults.map(result => result.imageId)
      
      setUploadState(prev => ({
        ...prev,
        currentStep: 'processing',
        progress: 100,
        message: 'AI 분석을 요청하고 있습니다.'
      }))
      
      // AI 분석 요청
      const aiResult = await requestAiAnalysis(parseInt(groupId), photoIds)
      console.log('AI 분석 요청 완료:', aiResult)
      
      // jobId 확인
      if (!aiResult.jobId) {
        throw new Error('AI 분석 요청 응답에서 jobId를 받지 못했습니다.')
      }
      
      // SSE 연결 시작
      await startSSEConnection(parseInt(groupId), aiResult.jobId)
      
      // 갤러리 새로고침
      await refreshGallery()
      
      // 완료 상태로 설정
      setUploadState(prev => ({
        ...prev,
        currentStep: 'completed',
        message: '모든 작업이 완료되었습니다.'
      }))
      
      // 3초 후 상태 초기화 (사용자가 결과를 볼 시간 제공)
      setTimeout(() => {
        setUploadState({
          isUploading: false,
          currentStep: 'selecting',
          progress: 0,
          totalFiles: 0,
          uploadedFiles: 0,
          message: ''
        })
      }, 3000)
      
    } catch (error) {
      console.error('업로드 실패:', error)
      setUploadState({
        isUploading: false,
        currentStep: 'selecting',
        progress: 0,
        totalFiles: 0,
        uploadedFiles: 0,
        message: ''
      })
      alert('업로드에 실패했습니다. 다시 시도해주세요.')
    }
    
    // input 초기화
    event.target.value = ''
  }
  

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Main Content */}
      <main className="px-4 md:px-8" style={{ paddingBottom: isSelectionMode ? "100px" : "0" }}>
        {/* Controls Section */}
        <div className="max-w-7xl mx-auto py-8">
          <div className="flex items-start justify-between gap-8">
            {/* Left: Tag Filters */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-keepick-primary text-sm text-gray-400 tracking-wider">
                  태그별 분류
                  {realTimeTags.length > 0 && (
                    <span className="ml-2 text-xs text-[#FE7A25]">
                      +{realTimeTags.length}개 AI 태그
                    </span>
                  )}
                </h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearAllTags}
                    className="text-xs text-[#FE7A25] hover:text-orange-400 transition-colors font-keepick-primary"
                  >
                    전체 해제
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {/* 기존 태그와 실시간 태그 결합 */}
                {Array.from(new Set([...allTags, ...realTimeTags])).sort().map((tag) => {
                  const isRealTimeTag = realTimeTags.includes(tag)
                  return (
                    <motion.button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 text-xs font-keepick-primary tracking-wide transition-all duration-300 relative ${ 
                        selectedTags.includes(tag)
                          ? "bg-white text-black shadow-lg"
                          : isRealTimeTag
                          ? "bg-[#FE7A25]/20 text-[#FE7A25] border border-[#FE7A25]/50 hover:bg-[#FE7A25]/30"
                          : "bg-gray-900 text-gray-300 border border-gray-700 hover:border-gray-500 hover:text-white"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tag}
                      {/* 실시간 태그 표시 */}
                      {isRealTimeTag && !selectedTags.includes(tag) && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FE7A25] rounded-full"></span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {selectedTags.length > 0 && (
                <p className="text-xs text-gray-500 mt-3 font-keepick-primary">
                  {selectedTags.length}개 태그 선택됨 • {filteredPhotos.length}장의 사진
                </p>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex flex-col items-end gap-3 w-32">
              {/* Selection Mode Button - Fixed height container */}
              <div className="h-10 flex items-center">
                <AnimatePresence mode="wait">
                  {!isSelectionMode ? (
                    <motion.button
                      key="keep-button"
                      onClick={enterSelectionMode}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="px-6 py-2 bg-transparent border-2 border-[#FE7A25] text-white font-keepick-heavy text-sm tracking-wider transition-all duration-300 hover:bg-[#FE7A25]/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      앨범 만들기
                    </motion.button>
                  ) : (
                    <motion.button
                      key="exit-button"
                      onClick={exitSelectionMode}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-keepick-primary text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Button */}
              {/* <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-keepick-primary">정렬</span>
                <button className="p-2 border border-gray-700 hover:border-gray-500 transition-colors">
                  <SlidersHorizontal size={16} className="text-gray-400" />
                </button>
              </div> */}

              {/* AI & Upload Buttons Row */}
              <div className="flex items-start gap-3">
                {/* AI Magic Button */}
                <AiMagicButton onAiServiceClick={handleAiServiceClick} />

                {/* Upload Button */}
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={handleUploadClick}
                    className="px-6 py-2 bg-transparent border-2 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 font-keepick-primary text-sm tracking-wider transition-all duration-300 flex items-center justify-center"
                  >
                    <Upload size={16} />
                  </button>
                  <span className="text-xs text-gray-400 font-keepick-primary">업로드</span>
                  {/* 숨겨진 파일 input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Delete Button (Selection Mode Only) - Fixed position */}
              <div className="h-10 flex items-center">
                <AnimatePresence>
                  {isSelectionMode && selectedPhotos.length > 0 && (
                    <motion.button
                      onClick={deleteSelectedPhotos}
                      className="p-2 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="max-w-7xl mx-auto">
          {/* 빈 갤러리 상태 */}
          {filteredPhotos.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                  <Upload size={40} className="text-gray-500" />
                </div>
                <h3 className="text-2xl font-keepick-heavy text-gray-300 mb-3">
                  갤러리가 비었습니다
                </h3>
                <p className="text-gray-500 font-keepick-primary text-lg mb-8">
                  이미지를 업로드해주세요
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-[#FE7A25] text-white font-keepick-primary rounded hover:bg-[#e66a20] transition-colors"
                >
                  첫 번째 사진 업로드하기
                </button>
              </div>
            </motion.div>
          )}

          {/* 사진이 있을 때만 표시 */}
          {filteredPhotos.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTags.join(",")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex gap-4 items-start"
              >
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex-1 flex flex-col gap-4">
                    {column.map((photo, photoIndex) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: (columnIndex * column.length + photoIndex) * 0.05,
                        ease: "easeOut",
                      }}
                      className="relative overflow-hidden cursor-pointer group"
                      style={{
                        aspectRatio: photo.aspectRatio,
                        position: 'relative',
                      }}
                      onMouseEnter={() => {
                        // 마우스 호버 시 태그 정보 미리 로드
                        loadPhotoTags(photo.id)
                      }}
                      onClick={() => {
                        if (isSelectionMode) {
                          togglePhotoSelection(photo.id)
                        } else {
                          // 선택 모드가 아닐 때는 사진 모달 열기
                          openPhotoModal({ id: photo.id, src: photo.src || "/placeholder.svg", name: photo.title })
                        }
                      }}
                    >
                      <Image
                        src={photo.src || "/placeholder.svg"}
                        alt={photo.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        className={`object-cover transition-all duration-500 ${
                          isSelectionMode ? "group-hover:scale-105" : "group-hover:scale-110"
                        } ${selectedPhotos.includes(photo.id) ? "brightness-75" : ""}`}
                        quality={85}
                        priority={photoIndex < 8}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        draggable={false}
                      />

                      {/* Selection Overlay */}
                      {isSelectionMode && (
                        <div
                          className={`absolute inset-0 border-4 transition-all duration-300 ${
                            selectedPhotos.includes(photo.id)
                              ? "border-[#FE7A25] bg-[#FE7A25]/20"
                              : "border-transparent hover:border-[#FE7A25]/50"
                          }`}
                        >
                          {selectedPhotos.includes(photo.id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#FE7A25] rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info Overlay (Non-Selection Mode) */}
                      {!isSelectionMode && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300">
                          <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="mb-3">
                              <p className="font-keepick-primary text-white text-sm font-medium">{photo.date}</p>
                              {/* 멤버 닉네임 표시 */}
                              {photoTagsCache[photo.id]?.members.length > 0 && (
                                <p className="font-keepick-primary text-gray-300 text-xs mt-1">
                                  👥 {photoTagsCache[photo.id].members.join(', ')}
                                </p>
                              )}
                            </div>
                            {/* API에서 받은 태그와 기존 태그 결합 표시 */}
                            <div className="flex flex-wrap gap-1">
                              {/* API 태그 (우선 표시) */}
                              {photoTagsCache[photo.id]?.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={`api-${index}`}
                                  className="px-2 py-1 bg-[#FE7A25]/80 backdrop-blur-sm text-white text-xs font-keepick-primary rounded-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                              {/* 기존 태그 (남은 공간에 표시) */}
                              {photo.tags.slice(0, Math.max(0, 4 - (photoTagsCache[photo.id]?.tags.length || 0))).map((tag, index) => (
                                <span
                                  key={`legacy-${index}`}
                                  className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-keepick-primary rounded-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                              {/* 더 많은 태그가 있을 때 */}
                              {((photoTagsCache[photo.id]?.tags.length || 0) + photo.tags.length) > 4 && (
                                <span className="px-2 py-1 bg-white/10 backdrop-blur-sm text-gray-300 text-xs font-keepick-primary rounded-sm">
                                  +{((photoTagsCache[photo.id]?.tags.length || 0) + photo.tags.length) - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
          )}

          {/* Load More Button - 사진이 있을 때만 표시 */}
          {hasMore && filteredPhotos.length > 0 && !isSelectionMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mt-16 mb-8"
            >
              <button
                onClick={loadMorePhotos}
                disabled={loading}
                className="border border-white/30 px-12 py-4 font-keepick-primary text-sm tracking-wider hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "로딩 중..." : "더 보기"}
              </button>
            </motion.div>
          )}

          {/* No Results - 태그 필터링 결과가 없을 때만 표시 */}
          {filteredPhotos.length === 0 && selectedTags.length > 0 && allPhotos.length > 0 && (
            <div className="text-center py-16">
              <p className="font-keepick-primary text-gray-400 text-lg mb-4">선택한 태그에 해당하는 사진이 없습니다</p>
              <button
                onClick={clearAllTags}
                className="font-keepick-primary text-[#FE7A25] hover:text-orange-400 transition-colors underline underline-offset-4"
              >
                모든 사진 보기
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 업로드 진행 상태 헤더 */}
      <AnimatePresence>
        {uploadState.isUploading && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#FE7A25]"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
              <div className="flex items-center justify-between">
                {/* 왼쪽: 상태 정보 */}
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-[#FE7A25]" size={18} />
                  <div>
                    <p className="text-white font-keepick-primary text-sm">
                      {uploadState.currentStep === 'uploading' && '파일 업로드 중'}
                      {uploadState.currentStep === 'processing' && 'AI 분석 중'}
                      {uploadState.currentStep === 'completed' && '업로드 완료!'}
                    </p>
                    <p className="text-gray-400 font-keepick-primary text-xs">
                      {uploadState.message}
                    </p>
                  </div>
                </div>

                {/* 가운데: 진행률 바 */}
                <div className="flex-1 max-w-md mx-6">
                  <div className="flex justify-between text-xs font-keepick-primary text-gray-400 mb-1">
                    <span>
                      {uploadState.currentStep === 'uploading' && `${uploadState.uploadedFiles}/${uploadState.totalFiles} 파일`}
                      {uploadState.currentStep === 'processing' && 'AI 분석 진행 중'}
                      {uploadState.currentStep === 'completed' && '완료'}
                    </span>
                    <span>{Math.round(uploadState.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <motion.div
                      className="bg-[#FE7A25] h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadState.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* 오른쪽: 닫기 버튼 (완료 시에만) */}
                {uploadState.currentStep === 'completed' && (
                  <button
                    onClick={() => setUploadState(prev => ({ ...prev, isUploading: false }))}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Drawer */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 200,
                delay: 0.2,
              },
            }}
            exit={{
              y: "100%",
              opacity: 0,
              transition: {
                duration: 0.4,
                ease: "easeInOut",
              },
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#FE7A25]/20 to-[#1a1a1a]/98 backdrop-blur-lg border-t-4 border-[#FE7A25] shadow-2xl shadow-[#FE7A25]/30"
          >
            <div className="max-w-7xl mx-auto px-8">
              {/* Expanded Photos Section */}
              <AnimatePresence>
                {isPhotosExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "50vh",
                      opacity: 1,
                      transition: { duration: 0.4, ease: "easeInOut" },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: { duration: 0.4, ease: "easeInOut" },
                    }}
                    className="overflow-hidden border-b border-[#FE7A25]/20"
                  >
                    <div className="py-4 h-full">
                      <p className="font-keepick-primary text-xm text-gray-400 mb-3">
                        선택한 사진들로 앨범을 생성할 수 있습니다. 
                      </p>

                      <div
                        className="h-[calc(100%-2rem)] overflow-y-auto scrollbar-hide"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {selectedPhotos.length > 0 ? (
                          <div className="grid grid-cols-8 gap-3 pb-4">
                            {selectedPhotoData.map((photo, index) => (
                              <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="relative overflow-hidden rounded cursor-pointer group aspect-square"
                              >
                                <Image
                                  src={photo.src || "/placeholder.svg"}
                                  alt={photo.title}
                                  fill
                                  sizes="12.5vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  quality={75}
                                  placeholder="blur"
                                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                                  draggable={false}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={() => togglePhotoSelection(photo.id)}
                                    className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                                  >
                                    <X size={12} className="text-white" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500 font-keepick-primary text-sm">
                            선택된 사진이 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Control Bar */}
              <div className="py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 flex-shrink-0">
                      <span className="font-keepick-primary text-sm text-gray-300 whitespace-nowrap">
                        {selectedPhotos.length}장 선택됨
                      </span>
                    </div>

                    <div
                      ref={smallPreviewDrag.ref}
                      className="flex gap-2 overflow-x-auto scrollbar-hide cursor-grab select-none"
                      style={{
                        maxWidth: "300px",
                        cursor: smallPreviewDrag.isDragging ? "grabbing" : "grab",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                      onMouseDown={smallPreviewDrag.handleMouseDown}
                      onMouseMove={smallPreviewDrag.handleMouseMove}
                      onMouseUp={smallPreviewDrag.handleMouseUp}
                      onMouseLeave={smallPreviewDrag.handleMouseLeave}
                    >
                      {selectedPhotos.slice(0, 8).map((photoId) => {
                        const photo = selectedPhotoData.find((p) => p.id === photoId)
                        if (!photo) return null
                        return (
                          <div key={photoId} className="w-10 h-10 flex-shrink-0 rounded overflow-hidden relative">
                            <Image
                              src={photo.src || "/placeholder.svg"}
                              alt={photo.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                              quality={60}
                              placeholder="blur"
                              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                              draggable={false}
                            />
                          </div>
                        )
                      })}
                      {selectedPhotos.length > 8 && (
                        <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-700 flex items-center justify-center">
                          <span className="text-xs text-gray-300">+{selectedPhotos.length - 8}</span>
                        </div>
                      )}
                      {selectedPhotos.length === 0 && (
                        <div className="text-gray-500 font-keepick-primary text-sm">선택된 사진이 없습니다</div>
                      )}
                    </div>

                    {(selectedPhotos.length > 0 || isPhotosExpanded) && (
                      <button
                        onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors font-keepick-primary whitespace-nowrap flex-shrink-0"
                      >
                        {isPhotosExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        <span>{isPhotosExpanded ? "접기" : "크게보기"}</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={createTimelineAlbum}
                      disabled={selectedPhotos.length === 0}
                      className={`px-4 py-3 bg-transparent border-2 border-[#FE7A25] font-keepick-heavy text-sm tracking-wide transition-all duration-300 whitespace-nowrap ${
                        selectedPhotos.length === 0
                          ? "text-gray-500 border-gray-600 cursor-not-allowed"
                          : "text-white hover:bg-[#FE7A25]/20 hover:border-[#FE7A25] hover:shadow-lg hover:shadow-[#FE7A25]/20"
                      }`}
                      whileHover={selectedPhotos.length > 0 ? { scale: 1.05 } : {}}
                      whileTap={selectedPhotos.length > 0 ? { scale: 0.95 } : {}}
                    >
                      타임라인 앨범
                    </motion.button>
                    <motion.button
                      onClick={createTierAlbum}
                      disabled={selectedPhotos.length === 0}
                      className={`px-4 py-3 bg-transparent border-2 border-[#FE7A25] font-keepick-heavy text-sm tracking-wide transition-all duration-300 whitespace-nowrap ${
                        selectedPhotos.length === 0
                          ? "text-gray-500 border-gray-600 cursor-not-allowed"
                          : "text-white hover:bg-[#FE7A25]/20 hover:border-[#FE7A25] hover:shadow-lg hover:shadow-[#FE7A25]/20"
                      }`}
                      whileHover={selectedPhotos.length > 0 ? { scale: 1.05 } : {}}
                      whileTap={selectedPhotos.length > 0 ? { scale: 0.95 } : {}}
                    >
                      티어 앨범
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 사진 상세보기 모달 */}
      <PhotoModal 
        photo={selectedPhoto}
        isOpen={isPhotoModalOpen}
        onClose={closePhotoModal}
      />

      {/* AI 서비스 소개 모달 */}
      <AiServiceModal 
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSimilarPhotosSort={handleSimilarPhotosSort}
      />
    </div>
  )
}
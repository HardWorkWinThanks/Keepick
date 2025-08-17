"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import { getPhotoPlaceholder } from "@/shared/constants/placeholders"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, SlidersHorizontal, Check, Trash2, X, ChevronUp, ChevronDown, Upload, Loader2 } from "lucide-react"
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePhotoGallery, useMasonryLayout, useDragScroll } from "../model/usePhotoGallery"
import { PhotoModal, usePhotoModal } from "@/features/photos-viewing"
import AiMagicButton from "./AiMagicButton"
import AiServiceModal from "./AiServiceModal"
import { uploadGalleryImages } from "../api/galleryUploadApi"
import { requestAiAnalysis, requestSimilarPhotosAnalysis, createAnalysisStatusSSE, AnalysisStatusMessage } from "../api/aiAnalysisApi"
import { getGroupPhotos, getGroupOverview, getPhotoTags, convertToGalleryPhoto, deleteGroupPhotos } from "../api/galleryPhotosApi"
import { useBlurredPhotosFlat, useSimilarPhotosFlat, useAllPhotosFlat, useAllTags, useFilteredPhotosFlat } from "../api/queries"
import { translateTag, translateTags, translateTagOrIgnore, translateTagsAndFilter } from "@/shared/lib/tagTranslation"
import { useInfiniteScroll } from "@/shared/lib"
import { addPhotosToTimelineAlbum } from "@/features/timeline-album/api/timelineAlbumPhotos"
import { addPhotosToTierAlbum } from "@/features/tier-album/api/tierAlbumPhotos"
import { DuplicatePhotoModal } from "@/shared/ui/composite"

interface PhotoGalleryProps {
  groupId: string
  onBack?: () => void
  autoEnterAlbumMode?: boolean // 자동으로 앨범 모드에 진입
}

export default function PhotoGallery({ groupId, onBack, autoEnterAlbumMode = false }: PhotoGalleryProps) {
  // autoEnterAlbumMode를 로컬 상태로 관리하여 사용자 액션 후 해제 가능하게 함
  const [showAlbumGuide, setShowAlbumGuide] = useState(autoEnterAlbumMode)
  // TanStack Query 클라이언트
  const queryClient = useQueryClient()
  // 라우터
  const router = useRouter()
  
  // URL 파라미터 감지 (썸네일 선택 모드, 앨범 추가 모드)
  const searchParams = useSearchParams()
  const isThumbnailSelectionMode = searchParams.get('mode') === 'thumbnail'
  const isAddToAlbumParam = searchParams.get('mode') === 'add'
  const targetAlbumType = searchParams.get('target') // 'timeline' or 'tier'
  const targetAlbumId = searchParams.get('albumId')
  
  const {
    allPhotos,
    filteredPhotos,
    selectedPhotoData,
    selectedTags,
    selectedMemberNames,
    loading,
    hasMore,
    columnCount,
    isSelectionMode: baseSelectionMode,
    selectedPhotos,
    isPhotosExpanded,
    toggleTag,
    clearAllTags,
    toggleMemberName,
    clearAllMemberNames,
    clearAllFilters,
    enterSelectionMode: enterBaseSelectionMode,
    exitSelectionMode: exitBaseSelectionMode,
    togglePhotoSelection,
    deleteSelectedPhotos: deleteSelectedPhotosBase,
    createTimelineAlbum,
    createTierAlbum,
    loadMorePhotos: loadMorePhotosBase,
    setIsPhotosExpanded,
    setGalleryData,
  } = usePhotoGallery(groupId)

  // 선택 모드 타입 상태 (앨범 생성, 사진 삭제, 앨범에 추가)
  const [selectionType, setSelectionType] = useState<'album' | 'delete' | 'add_to_album' | null>(null)
  // usePhotoGallery의 baseSelectionMode를 기본 선택 모드 상태로 사용
  const isSelectionMode = baseSelectionMode
  const isAlbumMode = selectionType === 'album' && baseSelectionMode
  const isDeleteMode = selectionType === 'delete' && baseSelectionMode
  const isAddToAlbumMode = selectionType === 'add_to_album' && baseSelectionMode

  // 갤러리 뷰 모드 (전체/흐린사진/유사사진)
  const [viewMode, setViewMode] = useState<'all' | 'blurred' | 'similar'>('all')
  
  // TanStack Query를 사용한 전체사진, 흐린사진, 유사사진, 태그 데이터
  const allPhotosQuery = useAllPhotosFlat(groupId, viewMode)
  const blurredQuery = useBlurredPhotosFlat(groupId, viewMode)
  const similarQuery = useSimilarPhotosFlat(groupId, viewMode)
  const allTagsQuery = useAllTags(groupId)
  // 서버 사이드 필터링을 위한 쿼리 (딕셔너리에 있는 태그만 전송)
  const filteredTagsForServer = selectedTags.filter(tag => translateTagOrIgnore(tag) !== null)
  
  // 디버깅: 태그 상태 확인
  // console.log('🔍 태그 상태 디버깅:', {
  //   selectedTags,
  //   filteredTagsForServer,
  //   hasSelectedTags: selectedTags.length > 0
  // })
  
  const filteredQuery = useFilteredPhotosFlat(groupId, filteredTagsForServer)

  // 쿼리에서 데이터와 로딩 상태 추출
  const allQueryPhotos = allPhotosQuery.photos
  const allPhotosLoading = allPhotosQuery.isLoading || allPhotosQuery.isFetchingNextPage
  const blurredPhotos = blurredQuery.photos
  const blurredPhotosLoading = blurredQuery.isLoading || blurredQuery.isFetchingNextPage
  const similarPhotoClusters = similarQuery.clusters
  const similarPhotosLoading = similarQuery.isLoading || similarQuery.isFetchingNextPage
  const filteredPhotosLoading = filteredQuery.isLoading || filteredQuery.isFetchingNextPage

  const smallPreviewDrag = useDragScroll()
  const expandedPreviewDrag = useDragScroll()
  
  // 사진 모달을 위한 상태 관리
  const { photo: selectedPhoto, isOpen: isPhotoModalOpen, openModal: openPhotoModal, closeModal: closePhotoModal } = usePhotoModal()
  
  // AI 서비스 모달 상태 관리
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  
  // 삭제 경고 모달 상태 관리
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  // 중복 사진 에러 모달 상태 관리
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [duplicateErrorInfo, setDuplicateErrorInfo] = useState<{
    duplicateCount?: number;
    totalCount?: number;
  }>({});
  
  // 파일 업로드를 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // SSE 연결 관리 (ref로 변경하여 리렌더링 방지)
  const sseConnectionRef = useRef<EventSource | null>(null)
  
  // 사진 태그 정보 캐시
  const [photoTagsCache, setPhotoTagsCache] = useState<Record<number, { tags: string[], members: string[] }>>({})
  
  // 뷰 모드에 따른 표시할 사진 결정 (useMemo로 메모이제이션)
  const displayPhotos = useMemo(() => {
    switch (viewMode) {
      case 'blurred':
        return blurredPhotos
      case 'similar':
        // 유사사진은 클러스터별로 처리하므로 빈 배열 반환
        return []
      default:
        // 전체 모드에서는 클라이언트 사이드 필터링 적용
        let basePhotos = allQueryPhotos.length > 0 ? allQueryPhotos : allPhotos
        
        // 서버 사이드 태그 필터링이 있는 경우 우선 사용
        if (selectedTags.length > 0 && filteredQuery.photos.length > 0) {
          basePhotos = filteredQuery.photos
        }
        
        // 사람 필터링 적용 (클라이언트 사이드)
        if (selectedMemberNames.length > 0) {
          basePhotos = basePhotos.filter((photo) => {
            // photoTagsCache에서 멤버 정보 확인
            const photoMembers = photoTagsCache[photo.id]?.members || []
            return selectedMemberNames.some(selectedMember => photoMembers.includes(selectedMember))
          })
        }
        
        return basePhotos
    }
  }, [viewMode, blurredPhotos, selectedTags, selectedMemberNames, filteredQuery.photos, allQueryPhotos, allPhotos, photoTagsCache])
  
  // Masonry layout 계산
  const columns = useMasonryLayout(displayPhotos, columnCount)
  
  // 실시간 태그 목록 (API에서 수집)
  const [realTimeTags, setRealTimeTags] = useState<string[]>([])
  
  // API에서 가져온 전체 태그
  const apiTags = allTagsQuery.data || []
  
  // 현재 사진들로부터 실시간 태그 계산 (보조 태그 목록)
  const calculatedTags = useMemo(() => {
    const currentPhotos = selectedTags.length > 0 ? filteredQuery.photos : 
                         (allQueryPhotos.length > 0 ? allQueryPhotos : allPhotos)
    
    // photoTagsCache에서 태그 수집
    const tagsFromCache = [...new Set(currentPhotos.flatMap(photo => 
      photoTagsCache[photo.id]?.tags || []
    ))]
    
    return tagsFromCache
  }, [allQueryPhotos, allPhotos, filteredQuery.photos, selectedTags, photoTagsCache])

  // 현재 사진들로부터 사람 태그(memberNicknames) 계산
  const calculatedMemberNicknames = useMemo(() => {
    // 필터링되지 않은 전체 사진에서 멤버 닉네임 수집 (필터링 옵션 표시용)
    const currentPhotos = allQueryPhotos.length > 0 ? allQueryPhotos : allPhotos
    
    // photoTagsCache에서 멤버 닉네임 수집
    const membersFromCache = [...new Set(currentPhotos.flatMap(photo => 
      photoTagsCache[photo.id]?.members || []
    ))]
    
    return membersFromCache
  }, [allQueryPhotos, allPhotos, photoTagsCache])
  
  // 최종 표시할 태그 목록 (API 태그 우선, 없으면 계산된 태그 사용)
  const displayTags = useMemo(() => {
    // API 태그가 있으면 우선 사용, 없거나 빈 배열이면 계산된 태그로 보완
    const combinedTags = apiTags.length > 0 ? apiTags : calculatedTags
    return [...new Set([...combinedTags, ...realTimeTags])]
  }, [apiTags, calculatedTags, realTimeTags])
  
  // 뷰 모드 변경 핸들러
  const handleViewModeChange = (mode: 'all' | 'blurred' | 'similar') => {
    setViewMode(mode)
    // 전체 모드가 아닐 때는 태그 필터 초기화
    if (mode !== 'all') {
      clearAllTags()
    }
    
    // TanStack Query가 자동으로 데이터를 관리하므로 수동 로딩 불필요
    // 뷰 모드 변경 시 쿼리는 enabled 조건에 따라 자동 실행됨
  }
  
  // 업로드 상태 관리
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean
    currentStep: 'selecting' | 'uploading' | 'processing' | 'completed'
    progress: number
    totalFiles: number
    uploadedFiles: number
    message: string
    jobStatus?: 'STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  }>({
    isUploading: false,
    currentStep: 'selecting',
    progress: 0,
    totalFiles: 0,
    uploadedFiles: 0,
    message: ''
  })
  
  // 전체 사진 개수 상태 (페이징 정보에서 가져옴) - 레거시 데이터용
  const [totalPhotosCount, setTotalPhotosCount] = useState(0)
  
  // 무한 스크롤 적용
  useInfiniteScroll({
    hasNextPage: viewMode === 'all' ? (
      selectedTags.length > 0 ? filteredQuery.hasNextPage : allPhotosQuery.hasNextPage
    ) : viewMode === 'blurred' ? blurredQuery.hasNextPage : 
        viewMode === 'similar' ? similarQuery.hasNextPage : false,
    fetchNextPage: () => {
      console.log('🔄 갤러리 무한스크롤 트리거됨 - threshold: 200px')
      if (viewMode === 'all') {
        if (selectedTags.length > 0) {
          filteredQuery.fetchNextPage()
        } else {
          allPhotosQuery.fetchNextPage()
        }
      } else if (viewMode === 'blurred') {
        blurredQuery.fetchNextPage()
      } else if (viewMode === 'similar') {
        similarQuery.fetchNextPage()
      }
    },
    isFetching: viewMode === 'all' ? (
      selectedTags.length > 0 ? filteredQuery.isFetchingNextPage : allPhotosQuery.isFetchingNextPage
    ) : viewMode === 'blurred' ? blurredQuery.isFetchingNextPage : 
        viewMode === 'similar' ? similarQuery.isFetchingNextPage : false,
    threshold: 200 
  })


  // 자동으로 갤러리 모드로 전환하고 선택모드 활성화
  useEffect(() => {
    if (autoEnterAlbumMode) {
      console.log('그룹스페이스에서 앨범 만들기 버튼으로 진입 - 갤러리 모드로 전환하고 선택모드 활성화')
      // 갤러리 모드로 전환하고 선택모드도 활성화
      enterBaseSelectionMode()
      // 앨범 모드로 설정
      setSelectionType('album')
      
      // 10초 후 자동으로 가이드 해제 (사용자가 버튼을 클릭하지 않은 경우)
      const timer = setTimeout(() => {
        setShowAlbumGuide(false)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [autoEnterAlbumMode])

  // URL 파라미터로 앨범 추가 모드 자동 활성화
  useEffect(() => {
    if (isAddToAlbumParam && targetAlbumType && targetAlbumId) {
      console.log(`앨범에서 사진 추가 모드로 진입 - ${targetAlbumType} 앨범 ${targetAlbumId}`)
      // 선택모드 활성화
      enterBaseSelectionMode()
      // 앨범 추가 모드로 설정
      setSelectionType('add_to_album')
    }
  }, [isAddToAlbumParam, targetAlbumType, targetAlbumId])

  // 컴포넌트가 다시 마운트될 때 (다른 화면에서 돌아올 때) 선택모드 해제
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 선택모드 해제 (다른 화면으로 전환 시)
      if (isSelectionMode) {
        console.log('갤러리에서 다른 화면으로 전환 - 선택모드 해제')
        exitSelectionMode()
      }
    }
  }, [])

  // SSE 연결 정리 (컴포넌트 언마운트 시)
  useEffect(() => {
    return () => {
      if (sseConnectionRef.current) {
        console.log('SSE 연결 정리')
        sseConnectionRef.current.close()
        sseConnectionRef.current = null
      }
    }
  }, [])
  
  // AI 버튼 클릭 핸들러
  const handleAiServiceClick = () => {
    setIsAiModalOpen(true)
  }
  
  // 유사한 사진 분류 핸들러
  const handleSimilarPhotosSort = async () => {
    try {
      setIsAiModalOpen(false)
      
      // 분석 상태 업데이트
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        currentStep: 'processing',
        progress: 0,
        message: '유사사진 분석을 요청하고 있습니다.'
      }))

      console.log('유사사진 분류 시작...')
      
      // 유사사진 분석 요청
      const analysisResult = await requestSimilarPhotosAnalysis(parseInt(groupId))
      console.log('유사사진 분석 요청 완료:', analysisResult)
      
      setUploadState(prev => ({
        ...prev,
        currentStep: 'processing',
        progress: 30,
        message: '분석을 준비하고 있습니다.'
      }))
      
      // SSE 연결 시작
      await startSSEConnection(parseInt(groupId), analysisResult.jobId)
      
      // 분석 완료 후 유사사진 탭으로 이동 및 캐시 새로고침
      console.log('유사사진 분석 완료! 유사사진 탭으로 이동합니다.')
      setViewMode('similar')
      
      // TanStack Query 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: ['all-photos', groupId] })
      await queryClient.invalidateQueries({ queryKey: ['similar-photos', groupId] })
      await queryClient.invalidateQueries({ queryKey: ['all-tags', groupId] })
      
      setUploadState(prev => ({
        ...prev,
        currentStep: 'completed',
        progress: 100,
        message: '유사사진 분류가 완료되었습니다!'
      }))
      
      // 3초 후 상태 초기화
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, isUploading: false }))
      }, 3000)
      
    } catch (error) {
      console.error('유사사진 분류 실패:', error)
      
      // 에러 타입에 따른 메시지 처리
      let errorMessage = '유사사진 분류에 실패했습니다.'
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = '네트워크 연결을 확인해주세요.'
        } else if (error.message.includes('timeout')) {
          errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.'
        } else if (error.message.includes('unauthorized')) {
          errorMessage = '권한이 없습니다. 다시 로그인해주세요.'
        }
      }
      
      setUploadState(prev => ({
        ...prev,
        currentStep: 'completed',
        progress: 0,
        message: errorMessage
      }))
      
      // 에러 알림 표시
      alert(errorMessage)
      
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, isUploading: false }))
      }, 5000) // 에러 시 더 오래 표시
    }
  }
  
  // SSE 연결 시작
  const startSSEConnection = (groupId: number, jobId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 기존 연결이 있으면 종료
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close()
      }
      
      const eventSource = createAnalysisStatusSSE(
        groupId,
        jobId,
        // onMessage: SSE 메시지 수신 시
        (data: AnalysisStatusMessage) => {
          console.log('SSE 메시지 수신:', data)
          
          // 진행률 계산 (completedJob / totalJob * 100)
          const progress = data.totalJob > 0 ? (data.completedJob / data.totalJob) * 100 : 0
          
          // 업로드 상태 업데이트 (jobStatus 포함)
          console.log('setUploadState 호출 전:', { progress, message: data.message, jobStatus: data.jobStatus })
          setUploadState(prev => {
            const newState = {
              ...prev,
              progress,
              message: data.message,
              jobStatus: data.jobStatus
            }
            console.log('setUploadState 업데이트:', { 
              prevMessage: prev.message, 
              newMessage: newState.message,
              prevJobStatus: prev.jobStatus,
              newJobStatus: newState.jobStatus,
              prevCurrentStep: prev.currentStep,
              newCurrentStep: newState.currentStep
            })
            return newState
          })
          
          // 상태에 따른 처리
          if (data.jobStatus === 'COMPLETED') {
            console.log('AI 분석 완료')
            // 연결을 닫기 전에 약간의 지연을 줌
            setTimeout(() => {
              eventSource.close()
              resolve()
            }, 100)
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
          sseConnectionRef.current = null
          reject(new Error('SSE 연결 오류'))
        },
        // onClose: SSE 연결 종료 시
        () => {
          console.log('SSE 연결 종료')
          sseConnectionRef.current = null
        }
      )
      
      sseConnectionRef.current = eventSource
    })
  }
  
  // 사진 태그 정보 로드
  const loadPhotoTags = async (photoId: number): Promise<void> => {
    // 이미 캐시되어 있으면 스킵
    if (photoTagsCache[photoId]) return
    
    try {
      const photoTags = await getPhotoTags(parseInt(groupId), photoId)
      
      // // 디버깅: 실제 데이터 타입과 값 확인
      // console.log('🔍 PhotoTags 디버깅:', {
      //   photoId,
      //   rawTags: photoTags.tags,
      //   rawTagsType: typeof photoTags.tags,
      //   rawMemberNicknames: photoTags.memberNicknames,
      //   rawMemberNicknamesType: typeof photoTags.memberNicknames,
      //   fullResponse: photoTags
      // })
      
      const tags = photoTags.tags
      const members = photoTags.memberNicknames
      
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

  // Query에서 각 탭별 개수 정보를 안전하게 추출 (useMemo 사용)
  const totalPhotosFromQuery = useMemo(() => {
    return allPhotosQuery.data?.pages?.[0]?.pageInfo?.totalElement || 0
  }, [allPhotosQuery.data?.pages])

  const blurredPhotosCount = useMemo(() => {
    // API에서 pageInfo.totalElement 사용
    return blurredQuery.data?.pages?.[0]?.pageInfo?.totalElement || 0
  }, [blurredQuery.data?.pages])

  const similarClustersCount = useMemo(() => {
    // 유사사진은 수동 분석이므로 데이터가 있을 때만 개수 표시
    if (!similarQuery.data?.pages || similarQuery.data.pages.length === 0) return 0
    return similarQuery.data.pages[0]?.pageInfo?.totalElement || 
           similarQuery.data.pages.reduce((total, page) => total + page.list.length, 0) || 0
  }, [similarQuery.data?.pages])

  // 총 개수 정보 동기화 (한 번만 실행되도록 ref 사용)
  const syncedTotalRef = useRef(false)
  useEffect(() => {
    if (totalPhotosFromQuery > 0 && !syncedTotalRef.current) {
      setTotalPhotosCount(totalPhotosFromQuery)
      syncedTotalRef.current = true
    }
  }, [totalPhotosFromQuery])

  // Query 데이터 변화 감지용 ref
  const lastDataLengthRef = useRef(0)
  useEffect(() => {
    if (allQueryPhotos.length > 0 && allQueryPhotos.length !== lastDataLengthRef.current) {
      lastDataLengthRef.current = allQueryPhotos.length
      if (viewMode === 'all') {
        setGalleryData(allQueryPhotos)
      }
    }
  }, [allQueryPhotos.length, viewMode])

  // TanStack Query를 사용하므로 수동 로딩 함수들은 제거됨
  // 데이터는 useBlurredPhotosFlat, useSimilarPhotosFlat 훅에서 자동 관리

  // 앨범 생성 모드 진입
  const enterAlbumMode = () => {
    console.log('앨범 모드 진입 - 두 상태 동기화')
    enterBaseSelectionMode() // usePhotoGallery 상태 먼저 활성화
    setSelectionType('album') // PhotoGallery 타입 설정
    setShowAlbumGuide(false) // 가이드 메시지 해제
  }
  
  // 사진 삭제 모드 진입
  const enterDeleteMode = () => {
    console.log('삭제 모드 진입 - 두 상태 동기화')
    enterBaseSelectionMode() // usePhotoGallery 상태 먼저 활성화
    setSelectionType('delete') // PhotoGallery 타입 설정
  }
  
  // 선택 모드 종료 - 모든 선택 관련 상태 완전 초기화
  const exitSelectionMode = () => {
    console.log('선택 모드 종료 시작 - 모든 상태 초기화')
    console.log('종료 전 상태:', { selectionType, baseSelectionMode, isAlbumMode, isDeleteMode })
    
    // 1. PhotoGallery 타입 상태 먼저 초기화
    setSelectionType(null)
    
    // 2. usePhotoGallery 기본 선택 모드 상태 초기화
    exitBaseSelectionMode()
    
    // 3. 모든 모달 및 추가 상태 강제 초기화
    setIsDeleteModalOpen(false)
    
    console.log('선택 모드 종료 완료 - 모든 상태가 초기화됨')
  }
  
  // 삭제 확인 모달 열기 (삭제 모드에서 사진 선택 후)
  const handleDeleteConfirm = () => {
    if (selectedPhotos.length === 0) return
    setIsDeleteModalOpen(true)
  }
  
  // 선택된 사진들 삭제 (실제 API 사용)
  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return
    
    try {
      console.log('사진 삭제 요청:', selectedPhotos)
      
      // API로 사진 삭제 요청 (ID만 추출하여 전달)
      const photoIds = selectedPhotos.map(photo => photo.id)
      const deleteResult = await deleteGroupPhotos(parseInt(groupId), photoIds)
      
      console.log('삭제 결과:', deleteResult)
      
      // 성공적으로 삭제된 사진들만 UI에서 제거
      if (deleteResult.deletedPhotoIds.length > 0) {
        // 로컬 상태 업데이트 (삭제된 사진만 제거)
        deleteSelectedPhotosBase() // 기존 로직 사용하여 UI 업데이트
        
        // 즉시 모든 관련 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['all-photos', groupId] })
        queryClient.invalidateQueries({ queryKey: ['blurred-photos', groupId] })
        queryClient.invalidateQueries({ queryKey: ['similar-photos', groupId] })
        queryClient.invalidateQueries({ queryKey: ['filtered-photos', groupId] })
        queryClient.invalidateQueries({ queryKey: ['all-tags', groupId] })
        
        console.log(`${deleteResult.deletedPhotoIds.length}장 삭제 완료`)
      }
      
      // 삭제되지 않은 사진이 있으면 알림
      if (deleteResult.unDeletedPhotoIds.length > 0) {
        alert(`${deleteResult.unDeletedPhotoIds.length}장의 사진을 삭제할 수 없습니다.`)
      }
      
    } catch (error) {
      console.error('사진 삭제 실패:', error)
      alert('사진 삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsDeleteModalOpen(false)
    }
  }
  
  // 선택된 사진들을 앨범에 추가 (ADD_TO_ALBUM 모드)
  const handleAddToAlbum = async () => {
    if (selectedPhotos.length === 0 || !targetAlbumType || !targetAlbumId) return
    
    try {
      console.log(`앨범에 사진 추가 요청: ${targetAlbumType} 앨범 ${targetAlbumId}`, selectedPhotos)
      
      // 사진 ID 추출
      const photoIds = selectedPhotos.map(photo => photo.id)
      
      // 앨범 타입에 따른 API 호출
      if (targetAlbumType === 'timeline') {
        await addPhotosToTimelineAlbum(parseInt(groupId), parseInt(targetAlbumId), photoIds)
      } else if (targetAlbumType === 'tier') {
        await addPhotosToTierAlbum(parseInt(groupId), parseInt(targetAlbumId), photoIds)
      }
      
      console.log(`${selectedPhotos.length}장의 사진을 ${targetAlbumType} 앨범에 추가 완료`)
      
      // 앨범 캐시 무효화하여 최신 데이터 반영
      if (targetAlbumType === 'timeline') {
        // 타임라인 앨범 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['timeline-album', groupId, targetAlbumId] })
      } else if (targetAlbumType === 'tier') {
        // 티어 앨범 캐시 무효화  
        queryClient.invalidateQueries({ queryKey: ['tier-album', groupId, targetAlbumId] })
      }
      
      // 성공 후 앨범 편집 페이지로 돌아가기 (편집 모드 유지)
      const backUrl = targetAlbumType === 'timeline' 
        ? `/group/${groupId}/timeline/${targetAlbumId}?edit=true&from=gallery`
        : `/group/${groupId}/tier/${targetAlbumId}?edit=true&from=gallery`
      
      window.location.href = backUrl
      
    } catch (error: any) {
      console.error('앨범에 사진 추가 실패:', error)
      
      // API 에러 응답에서 중복 사진 에러 감지
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const responseStatus = error?.response?.status;
      
      // 409 Conflict 또는 400 Bad Request에서 '잘못된 요청 파라미터입니다.' 메시지가 중복 에러로 간주
      const isDuplicatePhotoError = responseStatus === 409 || 
        (responseStatus === 400 && errorMessage.includes('잘못된 요청 파라미터입니다'));
      
      if (isDuplicatePhotoError) {
        // 중복 사진 에러인 경우 전용 모달 표시
        setDuplicateErrorInfo({
          totalCount: selectedPhotos.length,
          duplicateCount: selectedPhotos.length // 임시: 실제로는 서버에서 중복 개수를 받아야 함
        });
        setIsDuplicateModalOpen(true);
      } else {
        // 일반 에러인 경우 기존 alert 사용
        alert('앨범에 사진을 추가하는데 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  // 썸네일 선택 모드에서 사진 클릭 핸들러
  const handleThumbnailSelection = (photo: any) => {
    console.log('그룹 썸네일 선택:', photo)
    
    // 임시로 사이드바의 썸네일을 즉시 변경하기 위해
    // window.postMessage를 사용해 AppSidebar에 알림
    const thumbnailUrl = photo.thumbnailUrl || photo.originalUrl
    window.postMessage({
      type: 'THUMBNAIL_SELECTED',
      data: { thumbnailUrl, groupId }
    }, '*')
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
        message: '분석을 준비하고 있습니다.'
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
      
      // TanStack Query 캐시 무효화로 모든 관련 데이터 새로고침
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-photos', groupId] }),
        queryClient.invalidateQueries({ queryKey: ['blurred-photos', groupId] }),
        queryClient.invalidateQueries({ queryKey: ['similar-photos', groupId] }),
        queryClient.invalidateQueries({ queryKey: ['all-tags', groupId] })
      ])
      
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
        {/* Gallery Tabs & Controls */}
        <div className="max-w-7xl mx-auto pt-8 pb-4">
          <div className="flex items-center justify-between border-b border-gray-800">
            {/* Left: Tabs */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleViewModeChange('all')}
                disabled={isSelectionMode}
                className={`px-6 py-3 text-base font-keepick-primary transition-all duration-300 relative ${
                  isSelectionMode
                    ? 'text-gray-600 cursor-not-allowed'
                    : viewMode === 'all' 
                      ? 'text-white' 
                      : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                전체 ({totalPhotosFromQuery || totalPhotosCount})
                {viewMode === 'all' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FE7A25]" />
                )}
              </button>
              <button 
                onClick={() => handleViewModeChange('blurred')}
                disabled={isSelectionMode}
                className={`px-6 py-3 text-base font-keepick-primary transition-all duration-300 relative ${
                  isSelectionMode
                    ? 'text-gray-600 cursor-not-allowed'
                    : viewMode === 'blurred' 
                      ? 'text-white' 
                      : 'text-gray-500 hover:text-gray-300'
                }`}
              >
흐린사진 ({blurredPhotosCount})
                {viewMode === 'blurred' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FE7A25]" />
                )}
              </button>
              <button 
                onClick={() => handleViewModeChange('similar')}
                disabled={isSelectionMode}
                className={`px-6 py-3 text-base font-keepick-primary transition-all duration-300 relative ${
                  isSelectionMode
                    ? 'text-gray-600 cursor-not-allowed'
                    : viewMode === 'similar' 
                      ? 'text-white' 
                      : 'text-gray-500 hover:text-gray-300'
                }`}
              >
유사사진 ({similarClustersCount}개 그룹)
                {viewMode === 'similar' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FE7A25]" />
                )}
              </button>
            </div>


            {/* Right: Control Buttons */}
            <div className="flex items-center gap-3 pb-2">
              {/* Album Mode Button - 같은 자리에서 텍스트만 변경 */}
              <motion.button
                onClick={() => {
                  if (isAlbumMode) {
                    console.log('앨범 모드 취소 버튼 클릭 - 선택 모드 종료 시작')
                    exitSelectionMode()
                  } else {
                    console.log('앨범 만들기 버튼 클릭 - 앨범 모드 진입')
                    enterAlbumMode()
                  }
                }}
                disabled={isDeleteMode}
                // 그룹스페이스에서 진입했을 때 강조 애니메이션 (선택모드가 이미 활성화된 경우 제외)
                animate={showAlbumGuide && !isAlbumMode && !baseSelectionMode ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(254, 122, 37, 0)",
                    "0 0 0 4px rgba(254, 122, 37, 0.3)",
                    "0 0 0 0 rgba(254, 122, 37, 0)"
                  ]
                } : {}}
                transition={showAlbumGuide && !isAlbumMode && !baseSelectionMode ? {
                  duration: 2,
                  repeat: 3,
                  repeatDelay: 0.5
                } : {}}
                whileHover={{
                  scale: isDeleteMode ? 1 : 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{
                  scale: isDeleteMode ? 1 : 0.98,
                  transition: { duration: 0.1 }
                }}
                className={`px-6 py-2 bg-transparent border-2 font-keepick-heavy text-sm tracking-wider transition-all duration-300 ${
                  isDeleteMode
                    ? "border-gray-600 text-gray-600 cursor-not-allowed"
                    : isAlbumMode 
                      ? "border-gray-600 text-gray-300 hover:text-white hover:border-gray-400"
                      : showAlbumGuide
                        ? "border-[#FE7A25] text-white bg-gradient-to-r from-[#FE7A25]/10 to-[#FF6B35]/10 shadow-lg shadow-[#FE7A25]/20"
                        : "border-[#FE7A25] text-white hover:bg-[#FE7A25]/10"
                } ${showAlbumGuide && !isAlbumMode ? 'relative overflow-hidden' : ''}`}
              >
                {showAlbumGuide && !isAlbumMode && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: 2,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                    style={{ skewX: -20 }}
                  />
                )}
                {isAlbumMode ? "취소" : "앨범 만들기"}
              </motion.button>

              {/* AI Magic Button */}
              <div className={isSelectionMode ? "pointer-events-none opacity-50" : ""}>
                <AiMagicButton onAiServiceClick={handleAiServiceClick} />
              </div>

              {/* Upload Button */}
              <div className="relative group">
                <button 
                  onClick={handleUploadClick}
                  disabled={isSelectionMode}
                  className={`px-6 py-2 bg-transparent border-2 font-keepick-primary text-sm tracking-wider transition-all duration-300 flex items-center justify-center ${
                    isSelectionMode
                      ? "border-gray-600 text-gray-600 cursor-not-allowed"
                      : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                  }`}
                >
                  <Upload size={16} />
                </button>
                
                {/* 호버 툴팁 - 최대 20개 제한 안내 */}
                {!isSelectionMode && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs font-keepick-primary rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    최대 20개 파일까지 업로드 가능
                  </div>
                )}
              </div>
              
              {/* Delete Mode Button - 같은 자리에서 텍스트만 변경 */}
              <button 
                onClick={() => {
                  if (isDeleteMode) {
                    console.log('삭제 모드 취소 버튼 클릭 - 선택 모드 종료 시작')
                    exitSelectionMode()
                  } else {
                    console.log('삭제 모드 버튼 클릭 - 삭제 모드 진입')
                    enterDeleteMode()
                  }
                }}
                disabled={isAlbumMode}
                className={`px-6 py-2 bg-transparent border-2 font-keepick-heavy text-sm tracking-wider transition-all duration-300 flex items-center justify-center ${
                  isAlbumMode
                    ? 'border-gray-600 text-gray-600 cursor-not-allowed'
                    : isDeleteMode
                      ? "border-gray-600 text-gray-300 hover:text-white hover:border-gray-400"
                      : 'border-red-600 text-red-400 hover:text-white hover:border-red-500 hover:bg-red-600/10'
                }`}
              >
                {isDeleteMode ? "취소" : <Trash2 size={16} />}
              </button>
              
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
        </div>

        {/* Tag Filters Section (전체 모드일 때만 표시) */}
        {viewMode === 'all' && (
          <div className={`max-w-7xl mx-auto py-4 ${isSelectionMode && !isThumbnailSelectionMode ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-keepick-primary text-sm text-gray-400 tracking-wider">
                태그별 분류
                {realTimeTags.length > 0 && (
                  <span className="ml-2 text-xs text-[#FE7A25]">
                    +{realTimeTags.length}개 AI 태그
                  </span>
                )}
              </h3>
              {(selectedTags.length > 0 || selectedMemberNames.length > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#FE7A25] hover:text-orange-400 transition-colors font-keepick-primary"
                >
                  전체 해제
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* 최종 태그 목록 표시 - 딕셔너리에 있는 태그만 표시 */}
              {displayTags
                .filter(tag => translateTagOrIgnore(tag) !== null) // 딕셔너리에 있는 태그만 필터링
                .sort()
                .map((tag) => {
                const isRealTimeTag = realTimeTags.includes(tag) && !apiTags.includes(tag) && !calculatedTags.includes(tag)
                const translatedTag = translateTag(tag) // 이미 필터링됐으므로 일반 translateTag 사용
                return (
                  <motion.button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-sm font-keepick-primary tracking-wide transition-all duration-300 relative ${ 
                      selectedTags.includes(tag)
                        ? "bg-[#111111] text-[#FFFFFF] shadow-lg border border-[#111111]"
                        : isRealTimeTag
                        ? "bg-[#111111]/20 text-[#111111] border border-[#111111]/50 hover:bg-[#111111]/30"
                        : "bg-gray-800 text-gray-300 border border-gray-600 hover:border-[#111111] hover:text-[#FFFFFF] hover:bg-[#111111]"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {translatedTag}
                    {/* 실시간 태그 표시 */}
                    {isRealTimeTag && !selectedTags.includes(tag) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FE7A25] rounded-full"></span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* 사람 태그 섹션 */}
            {calculatedMemberNicknames.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-3 mt-6">
                  <h3 className="font-keepick-primary text-sm text-gray-400 tracking-wider">
                    사람 태그
                    <span className="ml-2 text-xs text-[#F5E7C6]">
                      {calculatedMemberNicknames.length}명
                    </span>
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {calculatedMemberNicknames.map((memberName) => (
                    <motion.button
                      key={`member-${memberName}`}
                      onClick={() => toggleMemberName(memberName)}
                      className={`px-3 py-1.5 text-sm font-keepick-primary tracking-wide transition-all duration-300 border ${ 
                        selectedMemberNames.includes(memberName)
                          ? "bg-[#F5E7C6] text-[#111111] border-[#F5E7C6] shadow-lg"
                          : "bg-[#F5E7C6]/30 text-[#111111] border-[#F5E7C6]/50 hover:bg-[#F5E7C6]/60"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      👤 {memberName}
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {(selectedTags.length > 0 || selectedMemberNames.length > 0) && (
              <p className="text-xs text-gray-500 mt-3 font-keepick-primary">
                {selectedTags.length > 0 && `${selectedTags.length}개 태그`}
                {selectedTags.length > 0 && selectedMemberNames.length > 0 && " • "}
                {selectedMemberNames.length > 0 && `${selectedMemberNames.length}명 사람`}
                {" 선택됨 • "}
                {displayPhotos.length}장의 사진
              </p>
            )}
          </div>
        )}

        {/* Masonry Grid */}
        <div className="max-w-7xl mx-auto">
          {/* 빈 갤러리 상태 */}
          {displayPhotos.length === 0 && similarPhotoClusters.length === 0 && !loading && !allPhotosLoading && !blurredPhotosLoading && !similarPhotosLoading && !filteredPhotosLoading && (
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
                  {viewMode === 'blurred' ? '흐린사진이 없습니다' : 
                   viewMode === 'similar' ? '유사사진이 없습니다' : 
                   '갤러리가 비었습니다'}
                </h3>
                <p className="text-gray-500 font-keepick-primary text-lg mb-8">
                  {viewMode === 'all' ? '이미지를 업로드해주세요' : 
                   'AI 분석을 통해 자동으로 분류됩니다'}
                </p>
                {viewMode === 'all' && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-[#FE7A25] text-white font-keepick-primary rounded hover:bg-[#e66a20] transition-colors"
                  >
                    첫 번째 사진 업로드하기
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* 로딩 중 표시 */}
          {(allPhotosLoading || blurredPhotosLoading || similarPhotosLoading || filteredPhotosLoading) && (
            <div className="flex justify-center py-16">
              <div className="flex items-center gap-3">
                <div className="animate-spin w-6 h-6 border-2 border-[#FE7A25] border-t-transparent rounded-full"></div>
                <span className="text-gray-400 font-keepick-primary">
                  {viewMode === 'all' ? (selectedTags.length > 0 ? '필터링된 사진 로딩 중...' : '전체사진 로딩 중...') :
                   viewMode === 'blurred' ? '흐린사진 로딩 중...' : 
                   viewMode === 'similar' ? '유사사진 로딩 중...' : 
                   '로딩 중...'}
                </span>
              </div>
            </div>
          )}

          {/* 유사사진 클러스터 뷰 */}
          {viewMode === 'similar' && similarPhotoClusters.length > 0 && !similarPhotosLoading && (
            <div className="space-y-8">
              {similarPhotoClusters.map((cluster, index) => (
                <motion.div
                  key={cluster.clusterId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border border-gray-700 rounded-lg p-6 bg-gray-900/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-keepick-heavy text-white">
                      유사사진 그룹 {index + 1}
                    </h3>
                    <span className="text-sm text-gray-400 font-keepick-primary">
                      {cluster.photoCount}장
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {cluster.photos.map((photo: any, photoIndex: number) => {
                      const galleryPhoto = convertToGalleryPhoto(photo)
                      return (
                        <motion.div
                          key={photo.photoId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: photoIndex * 0.05 }}
                          className="relative aspect-square overflow-hidden rounded cursor-pointer group"
                          onClick={() => {
                            if (isThumbnailSelectionMode) {
                              // 썸네일 선택 모드일 때는 썸네일로 설정 (테두리 없이)
                              handleThumbnailSelection(photo)
                            } else if (isSelectionMode) {
                              togglePhotoSelection(convertToGalleryPhoto(photo))
                            } else {
                              openPhotoModal({ 
                                id: photo.photoId, 
                                originalUrl: photo.originalUrl,
                                thumbnailUrl: photo.thumbnailUrl,
                                name: `사진 #${photo.photoId}` 
                              })
                            }
                          }}
                        >
                          <Image
                            src={photo.originalUrl || getPhotoPlaceholder()}
                            alt={`사진 #${photo.photoId}`}
                            fill
                            sizes="200px"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            quality={75}
                            priority={false}
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                            draggable={false}
                          />
                          
                          {/* 선택 오버레이 */}
                          {isSelectionMode && (
                            <div
                              className={`absolute inset-0 border-4 transition-all duration-300 ${
                                selectedPhotos.some(selected => selected.id === photo.photoId)
                                  ? isDeleteMode 
                                    ? "border-red-500 bg-red-500/20"
                                    : isAddToAlbumMode
                                      ? "border-green-500 bg-green-500/20"
                                      : "border-[#FE7A25] bg-[#FE7A25]/20"
                                  : isDeleteMode
                                    ? "border-transparent hover:border-red-500/50"
                                    : isAddToAlbumMode
                                      ? "border-transparent hover:border-green-500/50"
                                      : "border-transparent hover:border-[#FE7A25]/50"
                              }`}
                            >
                              {selectedPhotos.some(selected => selected.id === photo.photoId) && (
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                                  isDeleteMode ? "bg-red-500" : isAddToAlbumMode ? "bg-green-500" : "bg-[#FE7A25]"
                                }`}>
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 transition-colors duration-300" />
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 사진이 있을 때만 표시 */}
          {displayPhotos.length > 0 && !allPhotosLoading && !blurredPhotosLoading && !similarPhotosLoading && !filteredPhotosLoading && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTags.join(",")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex gap-2 items-start w-full"
              >
                {columns.map((column, columnIndex) => (
                  <motion.div 
                    key={columnIndex} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: columnIndex * 0.1 }}
                    className="flex flex-col gap-4 min-w-0" 
                    style={{ 
                      flex: '1 1 0%',
                      width: `calc(${100 / columns.length}% - ${8 * (columns.length - 1) / columns.length}px)`
                    }}>
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
                        if (isThumbnailSelectionMode) {
                          // 썸네일 선택 모드일 때는 썸네일로 설정 (테두리 없이)
                          handleThumbnailSelection(photo)
                        } else if (isSelectionMode) {
                          togglePhotoSelection(photo)
                        } else {
                          // 선택 모드가 아닐 때는 사진 모달 열기
                          openPhotoModal({ id: photo.id, originalUrl: photo.originalUrl, thumbnailUrl: photo.thumbnailUrl, name: photo.title })
                        }
                      }}
                    >
                      <Image
                        src={photo.originalUrl || getPhotoPlaceholder()}
                        alt={photo.title || `Photo ${photo.id}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        className={`object-cover transition-all duration-500 ${
                          isSelectionMode ? "group-hover:scale-105" : "group-hover:scale-110"
                        } ${selectedPhotos.some(selected => selected.id === photo.id) ? "brightness-75" : ""}`}
                        quality={75}
                        priority={false}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        draggable={false}
                      />

                      {/* Selection Overlay */}
                      {isSelectionMode && (
                        <div
                          className={`absolute inset-0 border-4 transition-all duration-300 ${
                            selectedPhotos.some(selected => selected.id === photo.id)
                              ? isDeleteMode 
                                ? "border-red-500 bg-red-500/20"
                                : isAddToAlbumMode
                                  ? "border-green-500 bg-green-500/20"
                                  : "border-[#FE7A25] bg-[#FE7A25]/20"
                              : isDeleteMode
                                ? "border-transparent hover:border-red-500/50"
                                : isAddToAlbumMode
                                  ? "border-transparent hover:border-green-500/50"
                                  : "border-transparent hover:border-[#FE7A25]/50"
                          }`}
                        >
                          {selectedPhotos.some(selected => selected.id === photo.id) && (
                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                              isDeleteMode ? "bg-red-500" : isAddToAlbumMode ? "bg-green-500" : "bg-[#FE7A25]"
                            }`}>
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info Overlay (Always Show) */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300">
                          <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="mb-3">
                              <p className="font-keepick-primary text-white text-sm font-medium">{photo.date}</p>
                            </div>
                            {/* 태그 표시 영역 - 사람 태그와 일반 태그 통합 */}
                            <div className="flex flex-wrap gap-1">
                              {/* 사람 태그 (우선 표시) */}
                              {(photoTagsCache[photo.id]?.members || []).slice(0, 2).map((memberName, index) => (
                                <span
                                  key={`member-${index}`}
                                  className="px-2 py-1 bg-[#F5E7C6]/90 backdrop-blur-sm text-[#111111] text-xs font-keepick-primary rounded-sm"
                                >
                                  👤 {memberName}
                                </span>
                              ))}
                              {/* API 태그 (일반 태그) - 딕셔너리에 있는 태그만 필터링 */}
                              {translateTagsAndFilter(photoTagsCache[photo.id]?.tags || []).slice(0, Math.max(0, 3 - (photoTagsCache[photo.id]?.members || []).slice(0, 2).length)).map((translatedTag, index) => (
                                <span
                                  key={`api-${index}`}
                                  className="px-2 py-1 bg-[#111111]/80 backdrop-blur-sm text-[#FFFFFF] text-xs font-keepick-primary rounded-sm"
                                >
                                  {translatedTag}
                                </span>
                              ))}
                              {/* 더 많은 태그가 있을 때 - 사람 태그와 일반 태그 모두 고려 */}
                              {(() => {
                                const memberCount = (photoTagsCache[photo.id]?.members || []).length
                                const apiTagCount = translateTagsAndFilter(photoTagsCache[photo.id]?.tags || []).length
                                const legacyTagCount = translateTagsAndFilter(photo.tags).length
                                const totalTagCount = memberCount + apiTagCount + legacyTagCount
                                
                                const displayedMemberCount = Math.min(2, memberCount)
                                const displayedApiTagCount = Math.min(3 - displayedMemberCount, apiTagCount)
                                const totalDisplayed = displayedMemberCount + displayedApiTagCount
                                
                                return totalTagCount > totalDisplayed && (
                                  <span className="px-2 py-1 bg-white/10 backdrop-blur-sm text-gray-300 text-xs font-keepick-primary rounded-sm">
                                    +{totalTagCount - totalDisplayed}
                                  </span>
                                )
                              })()}
                            </div>
                          </div>
                        </div>

                      <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          )}


          {/* No Results - 전체 모드에서 태그 필터링 결과가 없을 때만 표시 */}
          {viewMode === 'all' && displayPhotos.length === 0 && selectedTags.length > 0 && (allQueryPhotos.length > 0 || allPhotos.length > 0) && (
            <div className="text-center py-16">
              <p className="font-keepick-primary text-gray-400 text-lg mb-4">선택한 태그에 해당하는 사진이 없습니다</p>
              <button
                onClick={clearAllTags}
                disabled={isSelectionMode}
                className={`font-keepick-primary transition-colors underline underline-offset-4 ${
                  isSelectionMode 
                    ? "text-gray-600 cursor-not-allowed"
                    : "text-[#FE7A25] hover:text-orange-400"
                }`}
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
                      {uploadState.currentStep === 'processing' && (uploadState.message || 'AI 분석 중')}
                      {uploadState.currentStep === 'completed' && '업로드 완료!'}
                    </p>
                    <p className="text-gray-400 font-keepick-primary text-xs">
                      {uploadState.currentStep === 'processing' && uploadState.progress > 0 && 
                        `진행률: ${Math.round(uploadState.progress)}%`}
                    </p>
                  </div>
                </div>

                {/* 가운데: 진행률 바 */}
                <div className="flex-1 max-w-md mx-6">
                  <div className="flex justify-between text-xs font-keepick-primary text-gray-400 mb-1">
                    <span>
                      {uploadState.currentStep === 'uploading' && `${uploadState.uploadedFiles}/${uploadState.totalFiles} 파일`}
                      {uploadState.currentStep === 'processing' && (
                        uploadState.message 
                          ? uploadState.message 
                          : '분석 진행 중'
                      )}
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
            className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t-4 shadow-2xl ${
              isDeleteMode 
                ? "bg-gradient-to-t from-red-500/20 to-[#1a1a1a]/98 border-red-500 shadow-red-500/30"
                : isAddToAlbumMode
                  ? "bg-gradient-to-t from-green-500/20 to-[#1a1a1a]/98 border-green-500 shadow-green-500/30"
                  : "bg-gradient-to-t from-[#FE7A25]/20 to-[#1a1a1a]/98 border-[#FE7A25] shadow-[#FE7A25]/30"
            }`}
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
                      { isDeleteMode ? 
                      <p className="font-keepick-primary text-xm text-gray-400 mb-3">
                        선택한 사진들을 갤러리에서 삭제할 수 있습니다. 
                      </p>
                      : isAddToAlbumMode ?
                      <div className="mb-3">
                        <p className="font-keepick-primary text-xm text-gray-400 mb-2">
                          선택한 사진들을 {targetAlbumType === 'timeline' ? '타임라인' : '티어'} 앨범에 추가할 수 있습니다.
                        </p>
                        <p className="font-keepick-primary text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-1">
                          📝 이미 앨범에 있는 사진들은 추가되지 않습니다.
                        </p>
                      </div>
                      : 
                      <p className="font-keepick-primary text-xm text-gray-400 mb-3">
                        선택한 사진들로 앨범을 생성할 수 있습니다. 
                      </p>
                      }

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
                                  src={photo.thumbnailUrl || getPhotoPlaceholder()}
                                  alt={photo.title || `Photo ${photo.id}`}
                                  fill
                                  sizes="12.5vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  quality={75}
                                  priority={false}
                                  loading="lazy"
                                  placeholder="blur"
                                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                                  draggable={false}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={() => togglePhotoSelection(photo)}
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
                      {selectedPhotos.slice(0, 8).map((photo) => {
                        return (
                          <div key={photo.id} className="w-10 h-10 flex-shrink-0 rounded overflow-hidden relative">
                            <Image
                              src={photo.thumbnailUrl || getPhotoPlaceholder()}
                              alt={photo.title || `Photo ${photo.id}`}
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

                  {/* Right: Action Buttons - 모드에 따라 다른 버튼 표시 */}
                  <div className="flex items-center gap-3">
                    {isDeleteMode ? (
                      /* 삭제 모드: 삭제 버튼 */
                      <motion.button
                        onClick={handleDeleteConfirm}
                        disabled={selectedPhotos.length === 0}
                        className={`px-4 py-3 bg-transparent border-2 border-red-500 font-keepick-heavy text-sm tracking-wide transition-all duration-300 whitespace-nowrap ${
                          selectedPhotos.length === 0
                            ? "text-gray-500 border-gray-600 cursor-not-allowed"
                            : "text-white hover:bg-red-500/20 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20"
                        }`}
                        whileHover={selectedPhotos.length > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedPhotos.length > 0 ? { scale: 0.95 } : {}}
                      >
                        {selectedPhotos.length}개의 사진 삭제하기
                      </motion.button>
                    ) : isAddToAlbumMode ? (
                      /* 앨범 추가 모드: 앨범에 추가하기 버튼 */
                      <motion.button
                        onClick={handleAddToAlbum}
                        disabled={selectedPhotos.length === 0}
                        className={`px-4 py-3 bg-transparent border-2 border-green-500 font-keepick-heavy text-sm tracking-wide transition-all duration-300 whitespace-nowrap ${
                          selectedPhotos.length === 0
                            ? "text-gray-500 border-gray-600 cursor-not-allowed"
                            : "text-white hover:bg-green-500/20 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20"
                        }`}
                        whileHover={selectedPhotos.length > 0 ? { scale: 1.05 } : {}}
                        whileTap={selectedPhotos.length > 0 ? { scale: 0.95 } : {}}
                      >
                        {selectedPhotos.length}개의 사진 앨범에 추가하기
                      </motion.button>
                    ) : (
                      /* 앨범 모드: 앨범 생성 버튼들 */
                      <>
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
                      </>
                    )}
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
      
      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-keepick-heavy text-lg">사진 삭제</h3>
                  <p className="text-gray-400 font-keepick-primary text-sm">선택한 사진을 삭제하시겠습니까?</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 font-keepick-primary text-sm mb-2">
                  <span className="text-[#FE7A25] font-medium">{selectedPhotos.length}장</span>의 사진이 영구적으로 삭제됩니다.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-amber-300 font-keepick-primary text-xs font-medium mb-1">
                        삭제 제한 안내
                      </p>
                      <p className="text-amber-200 font-keepick-primary text-xs leading-relaxed">
                        앨범에 포함된 사진은 삭제할 수 없습니다.<br />
                        해당 사진들은 자동으로 제외되며, 삭제 가능한 사진만 처리됩니다.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 font-keepick-primary text-xs">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-keepick-primary text-sm transition-colors rounded"
                >
                  취소
                </button>
                <button
                  onClick={deleteSelectedPhotos}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-keepick-primary text-sm transition-colors rounded"
                >
                  삭제하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 중복 사진 에러 모달 */}
      <DuplicatePhotoModal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setDuplicateErrorInfo({});
        }}
        duplicateCount={duplicateErrorInfo.duplicateCount}
        totalCount={duplicateErrorInfo.totalCount}
      />
    </div>
  )
}
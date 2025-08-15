"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { AlbumType, GroupPhoto } from "@/entities/group"
import { getTimelineAlbumList, deleteTimelineAlbum, type TimelineAlbumListItem } from "@/features/timeline-album/api/timelineAlbumApi"

export const albumTypes: AlbumType[] = [
  { id: "timeline", name: "TIMELINE ALBUM", subtitle: "타임라인 앨범" },
  { id: "tier", name: "TIER ALBUM", subtitle: "티어 앨범" },
  { id: "highlight", name: "HIGHLIGHT ALBUM", subtitle: "하이라이트 앨범" },
]

// 갤러리는 순환에서 제외하되, 데이터는 유지 (필요시 사용 가능)
export const galleryAlbum: AlbumType = { id: "gallery", name: "GALLERY", subtitle: "갤러리" }

// Album/Gallery 메인 모드 정의
export const mainModes = [
  { id: "album", name: "ALBUM" },
  { id: "gallery", name: "GALLERY" }
] as const

export type MainMode = typeof mainModes[number]["id"]

export const samplePhotos = {
  timeline: [], // 더미 타임라인 앨범 제거
  tier: [
    { id: 1, title: "최고의 순간", subtitle: "S급 추억", image: "/dummy/jeju-dummy2.jpg" },
    { id: 2, title: "특별한 날", subtitle: "A급 기념일", image: "/dummy/main-dummy6.jpg" },
    { id: 3, title: "소중한 시간", subtitle: "B급 일상", image: "/dummy/main-dummy7.jpg" },
    { id: 4, title: "행복한 순간", subtitle: "A급 웃음", image: "/dummy/main-dummy8.jpg" },
    { id: 5, title: "감동의 순간", subtitle: "S급 감동", image: "/dummy/jeju-dummy3.jpg" },
    { id: 6, title: "맛있는 시간", subtitle: "A급 음식", image: "/dummy/food-dummy1.jpg" },
  ],
  highlight: [
    { id: 1, title: "올해의 베스트", subtitle: "2024 하이라이트", image: "/dummy/main-dummy9.jpg" },
    { id: 2, title: "가족 모임", subtitle: "전체 가족 사진", image: "/dummy/main-dummy10.jpg" },
    { id: 3, title: "성취의 순간", subtitle: "졸업식", image: "/dummy/ssafy-dummy1.jpg" },
    { id: 4, title: "첫 걸음", subtitle: "아기 첫걸음", image: "/dummy/main-dummy11.jpg" },
    { id: 5, title: "제주 여행", subtitle: "아름다운 풍경", image: "/dummy/jeju-dummy4.jpg" },
  ],
  gallery: [
    { id: 1, title: "포트레이트", subtitle: "가족 인물 사진", image: "/dummy/main-dummy12.jpg" },
    { id: 2, title: "풍경 사진", subtitle: "여행지 풍경", image: "/dummy/jeju-dummy5.jpg" },
    { id: 3, title: "일상 스냅", subtitle: "자연스러운 순간", image: "/dummy/main-dummy13.jpg" },
    { id: 4, title: "이벤트 사진", subtitle: "특별한 행사", image: "/dummy/ssafy-dummy2.jpg" },
    { id: 5, title: "아트 사진", subtitle: "창작 사진", image: "/dummy/dummy7.png" },
    { id: 6, title: "빈티지 사진", subtitle: "옛날 사진", image: "/dummy/main-dummy14.jpg" },
    { id: 7, title: "SSAFY 생활", subtitle: "교육 과정", image: "/dummy/ssafy-dummy3.jpg" },
    { id: 8, title: "제주 바다", subtitle: "푸른 바다", image: "/dummy/jeju-dummy6.jpg" },
  ],
}

export function useGroupSpace(groupId?: number) {
  const queryClient = useQueryClient()
  const [currentModeIndex, setCurrentModeIndex] = useState(0) // Album/Gallery 모드
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [deletingAlbumId, setDeletingAlbumId] = useState<number | null>(null)

  const currentMode = mainModes[currentModeIndex]
  const currentAlbum = albumTypes[currentAlbumIndex]
  
  // 타임라인 앨범일 때만 API 호출 (12개씩 가져옴)
  const currentPage = Math.floor(currentPhotoIndex / 12)
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['timelineAlbums', groupId, currentPage],
    queryFn: () => getTimelineAlbumList(groupId!, currentPage, 12),
    enabled: !!groupId && currentAlbum.id === 'timeline',
    staleTime: 0, // 캐시를 즉시 stale로 만들어 항상 최신 데이터 확인
    refetchOnWindowFocus: false, // 불필요한 재요청 방지
  })

  // 타임라인 앨범 삭제 mutation
  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: number) => {
      if (!groupId) throw new Error('Group ID is required')
      return deleteTimelineAlbum(groupId, albumId)
    },
    onMutate: (albumId) => {
      setDeletingAlbumId(albumId)
    },
    onSuccess: () => {
      // 앨범 목록 쿼리 무효화 - 모든 페이지
      queryClient.invalidateQueries({ 
        queryKey: ['timelineAlbums', groupId] 
      })
    },
    onError: (error) => {
      console.error('앨범 삭제 실패:', error)
      // TODO: 사용자에게 에러 메시지 표시
    },
    onSettled: () => {
      setDeletingAlbumId(null)
    }
  })

  // API 데이터를 GroupPhoto 형식으로 변환
  const convertToGroupPhotos = (albums: TimelineAlbumListItem[]): GroupPhoto[] => {
    // console.log('🔄 convertToGroupPhotos - 원본 앨범 데이터:', albums)
    
    const converted = albums.map(album => {
      const groupPhoto = {
        id: album.albumId,
        title: album.name,
        subtitle: album.description || `${album.photoCount}장의 사진`,
        image: album.thumbnailUrl || "/placeholder.svg"
      }
      
      console.log(`📝 앨범 ${album.albumId} 변환:`, {
        원본: { name: album.name, description: album.description },
        변환결과: { title: groupPhoto.title, subtitle: groupPhoto.subtitle }
      })
      
      return groupPhoto
    })
    
    // console.log('✅ convertToGroupPhotos - 최종 결과:', converted)
    return converted
  }

  // 현재 앨범에 따라 데이터 결정
  let currentPhotos: GroupPhoto[]
  let visiblePhotos: GroupPhoto[]
  let hasNextPage = false
  
  if (currentAlbum.id === 'timeline') {
    // 타임라인: API에서 12개씩 가져와서 4개씩 슬라이싱
    currentPhotos = timelineData ? convertToGroupPhotos(timelineData.list) : []
    const localIndex = currentPhotoIndex % 12 // 현재 페이지 내에서의 인덱스
    visiblePhotos = currentPhotos.slice(localIndex, localIndex + 4)
    
    // 다음 페이지 존재 여부: 현재 페이지에 더 있거나 API에 다음 페이지가 있을 때
    hasNextPage = localIndex < currentPhotos.length - 4 || (timelineData?.pageInfo.hasNext || false)
  } else {
    // 다른 앨범: 전체 데이터에서 4개씩 슬라이싱
    currentPhotos = samplePhotos[currentAlbum.id as keyof typeof samplePhotos]
    visiblePhotos = currentPhotos.slice(currentPhotoIndex, currentPhotoIndex + 4)
    hasNextPage = currentPhotoIndex < currentPhotos.length - 4
  }

  const changeMainMode = (direction: "up" | "down") => {
    if (isAnimating) return

    setIsAnimating(true)

    if (direction === "up") {
      setCurrentModeIndex((prev) => (prev === 0 ? mainModes.length - 1 : prev - 1))
    } else {
      setCurrentModeIndex((prev) => (prev === mainModes.length - 1 ? 0 : prev + 1))
    }

    setCurrentPhotoIndex(0)

    setTimeout(() => setIsAnimating(false), 500)
  }

  const changeAlbumType = (direction: "up" | "down") => {
    // Album 모드일 때만 앨범 순환 가능
    if (currentMode.id !== "album" || isAnimating) return

    setIsAnimating(true)

    if (direction === "up") {
      setCurrentAlbumIndex((prev) => (prev === 0 ? albumTypes.length - 1 : prev - 1))
    } else {
      setCurrentAlbumIndex((prev) => (prev === albumTypes.length - 1 ? 0 : prev + 1))
    }

    setCurrentPhotoIndex(0)

    setTimeout(() => setIsAnimating(false), 500)
  }

  const navigatePhotos = (direction: "left" | "right") => {
    if (currentAlbum.id === 'timeline') {
      // 타임라인 앨범: 12개 단위로 관리하면서 4개씩 네비게이션
      if (direction === "left" && currentPhotoIndex > 0) {
        setCurrentPhotoIndex((prev) => Math.max(0, prev - 4))
      } else if (direction === "right") {
        const localIndex = currentPhotoIndex % 12
        const hasMoreInCurrentPage = localIndex < currentPhotos.length - 4
        const hasNextAPIPage = timelineData?.pageInfo.hasNext || false
        
        if (hasMoreInCurrentPage) {
          // 현재 페이지에 더 보여줄 것이 있으면 4개 더 진행
          setCurrentPhotoIndex((prev) => prev + 4)
        } else if (hasNextAPIPage) {
          // 현재 페이지를 다 봤고 다음 API 페이지가 있으면 다음 페이지로
          setCurrentPhotoIndex((prev) => prev + 4)
        }
      }
    } else {
      // 다른 앨범: 기존 로직
      if (direction === "left" && currentPhotoIndex > 0) {
        setCurrentPhotoIndex((prev) => Math.max(0, prev - 4))
      } else if (direction === "right" && currentPhotoIndex < currentPhotos.length - 4) {
        setCurrentPhotoIndex((prev) => Math.min(currentPhotos.length - 4, prev + 4))
      }
    }
  }

  const switchToGalleryMode = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setCurrentModeIndex(1) // 갤러리 모드로 설정 (인덱스 1)
    setCurrentPhotoIndex(0)
    
    setTimeout(() => setIsAnimating(false), 500)
  }

  return {
    currentMode,
    currentAlbum,
    currentPhotos,
    visiblePhotos,
    currentPhotoIndex,
    isAnimating,
    isLoading: isLoading && currentAlbum.id === 'timeline',
    hasNextPage,
    hasPrevPage: currentPhotoIndex > 0,
    deletingAlbumId,
    changeMainMode,
    changeAlbumType,
    navigatePhotos,
    switchToGalleryMode,
    deleteAlbum: deleteAlbumMutation.mutate,
    isDeletingAlbum: deleteAlbumMutation.isPending,
  }
}
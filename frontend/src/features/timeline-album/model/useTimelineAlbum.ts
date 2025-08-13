"use client"

import { useState, useEffect } from "react"
import type { TimelineEvent } from "@/entities/album"

// 더미 데이터 생성 함수
const generateTimelineData = (albumId: string): TimelineEvent[] => {
  const dummyImages = [
    "/dummy/start1.jpg",
    "/dummy/start2.jpg",
    "/dummy/start3.jpg",
    "/dummy/eat1.jpg",
    "/dummy/eat2.jpg",
    "/dummy/eat3.jpg",
    "/dummy/coffe1.jpg",
    "/dummy/coffe2.jpg",
    "/dummy/coffe3.jpg",
    "/dummy/umbrella1.jpg",
    "/dummy/umbrella2.jpg",
    "/dummy/umbrella3.jpg",
    "/dummy/magam1.jpg",
    "/dummy/magam2.jpg",
    "/dummy/magam3.jpg",

  ]

  // 기본 4개 섹션 - 원본과 동일한 구조
  const baseTimelineSections = [
    {
      id: "1",
      title: "오전 개발",
      subtitle: "여유로운 하루를 보내는 중..",
      description: "",
      date: "2025.08.13",
      photos: [],
      images: [
        { src: dummyImages[0], size: "large" as const, position: "main" },
        { src: dummyImages[1], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[2], size: "small" as const, position: "bottom-left" },
      ],
    },
    {
      id: "2", 
      title: "맛있는 점심!",
      subtitle: "밀면 맛도리",
      description: "",
      date: "2025.08.13",
      photos: [],
      images: [
        { src: dummyImages[3], size: "large" as const, position: "main" },
        { src: dummyImages[4], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[5], size: "small" as const, position: "bottom-left" },
      ],
    },
    {
      id: "3",
      title: "커피와 한 컷!",
      subtitle: "개발자들이 죽어있다.", 
      description: "",
      date: "2025.08.13",
      photos: [],
      images: [
        { src: dummyImages[6], size: "large" as const, position: "main" },
        { src: dummyImages[7], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[8], size: "small" as const, position: "bottom-left" },
      ],
    },
    {
      id: "4",
      title: "점심 산책 중",
      subtitle: "우(양)산 쓰고 산책중~",
      description: "",
      date: "2025.08.13",
      photos: [],
      images: [
        { src: dummyImages[9], size: "large" as const, position: "main" },
        { src: dummyImages[10], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[11], size: "small" as const, position: "bottom-left" },
      ],
    },
    {
      id: "5",
      title: "자기계발중",
      subtitle: "마감 5일전인데 프론트를 시작하고 있는 모습이다.",
      description: "",
      date: "2025.08.13",
      photos: [],
      images: [
        { src: dummyImages[12], size: "large" as const, position: "main" },
        { src: dummyImages[13], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[14], size: "small" as const, position: "bottom-left" },
      ],
    }
  ]

  // 앨범 메인 이미지
  // 앨범 ID에 따라 이미지를 다르게 할당 (기본 4개 섹션은 유지)
  const albumSpecificImages = {
    "1": { // 가족여행
      images: [dummyImages[0], dummyImages[3], dummyImages[6], dummyImages[9]]
    },
    "2": { // 생일파티
      images: [dummyImages[7], dummyImages[1], dummyImages[2], dummyImages[4]]
    },
    "3": { // 크리스마스
      images: [dummyImages[2], dummyImages[5], dummyImages[8], dummyImages[10]]
    }
  }

  const albumImages = albumSpecificImages[albumId as keyof typeof albumSpecificImages]?.images || dummyImages

  // baseTimelineSections의 원본 images 배열 사용 (덮어쓰기 제거)
  return baseTimelineSections
}

export function useTimelineAlbum(groupId: string, albumId: string) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => 
    // 초기값으로 바로 데이터 생성 (로딩 없이)
    generateTimelineData(albumId)
  )
  const [loading, setLoading] = useState(false) // 기본값 false

  useEffect(() => {
    // 앨범 ID가 변경될 때만 업데이트 (즉시 반영)
    const events = generateTimelineData(albumId)
    setTimelineEvents(events)
  }, [albumId])


  return {
    timelineEvents,
    loading,
    // API 연동 시 사용할 함수들
    refetchTimeline: () => {
      const events = generateTimelineData(albumId)
      setTimelineEvents(events)
    },
    // API 연동 시 사전 로딩을 위한 함수 (미리 데이터를 캐시)
    prefetchTimeline: async (albumId: string) => {
      // TODO: React Query나 SWR을 사용해서 사전 로딩
      // await queryClient.prefetchQuery(['timeline', groupId, albumId], () => api.getTimeline(groupId, albumId))
    }
  }
}
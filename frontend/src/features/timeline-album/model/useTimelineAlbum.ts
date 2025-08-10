"use client"

import { useState, useEffect } from "react"
import type { TimelineEvent } from "@/entities/album"

// 더미 데이터 생성 함수
const generateTimelineData = (albumId: string): TimelineEvent[] => {
  const dummyImages = [
    "/dummy/main-dummy1.jpg",
    "/dummy/main-dummy2.jpg", 
    "/dummy/main-dummy3.jpg",
    "/dummy/jeju-dummy1.webp",
    "/dummy/jeju-dummy2.jpg",
    "/dummy/jeju-dummy3.jpg",
    "/dummy/sea-dummy1.jpg",
    "/dummy/food-dummy1.jpg",
    "/dummy/main-dummy4.jpg",
    "/dummy/main-dummy5.jpg",
    "/dummy/ssafy-dummy1.jpg",
    "/dummy/airport-dummy1.jpg"
  ]

  // 기본 4개 섹션 - 원본과 동일한 구조
  const baseTimelineSections = [
    {
      id: "1",
      title: "새해 첫날의\n특별한 순간",
      subtitle: "A SPECIAL MOMENT\nOF NEW YEAR'S DAY",
      description: "2024년 새해를 맞이하며 온 가족이 모여 새로운 시작을 다짐했습니다. 따뜻한 햇살 아래에서 찍은 가족사진과 아이들의 밝은 웃음소리가 가득했던 하루였습니다.",
      date: "2024.01.01",
      photos: [],
      images: [
        { src: dummyImages[0], size: "large" as const, position: "main" },
        { src: dummyImages[1], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[2], size: "small" as const, position: "bottom-left" },
      ],
    },
    {
      id: "2", 
      title: "봄나들이\n벚꽃과 함께",
      subtitle: "SPRING OUTING\nWITH CHERRY BLOSSOMS",
      description: "따뜻한 봄날, 온 가족이 함께 벚꽃구경을 떠났습니다. 아이들은 떨어지는 꽃잎을 받으며 즐거워했고, 우리는 소중한 추억을 하나 더 만들었습니다.",
      date: "2024.04.15",
      photos: [],
      images: [
        { src: dummyImages[3], size: "large" as const, position: "main" },
        { src: dummyImages[4], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[5], size: "small" as const, position: "bottom-left" },
      ],
    },
    {
      id: "3",
      title: "여름휴가\n바다에서의 하루",
      subtitle: "SUMMER VACATION\nA DAY AT THE BEACH", 
      description: "시원한 바닷바람과 함께한 여름휴가. 아이들은 모래성을 쌓고 파도와 놀며 즐거운 시간을 보냈습니다. 석양이 지는 바다를 배경으로 찍은 가족사진이 특히 아름다웠습니다.",
      date: "2024.07.20",
      photos: [],
      images: [
        { src: dummyImages[6], size: "large" as const, position: "main" },
        { src: dummyImages[7], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[8], size: "small" as const, position: "bottom-left" },
      ],
    },
    {
      id: "4",
      title: "크리스마스\n따뜻한 겨울밤",
      subtitle: "CHRISTMAS\nWARM WINTER NIGHT",
      description: "반짝이는 크리스마스 트리 아래에서 온 가족이 모여 선물을 나누며 행복한 시간을 보냈습니다. 아이들의 기쁨에 찬 표정과 따뜻한 가족의 사랑이 느껴지는 특별한 밤이었습니다.",
      date: "2024.12.25",
      photos: [],
      images: [
        { src: dummyImages[9], size: "large" as const, position: "main" },
        { src: dummyImages[10], size: "small" as const, position: "bottom-right" },
        { src: dummyImages[11], size: "small" as const, position: "bottom-left" },
      ],
    }
  ]

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

  // 각 섹션의 메인 이미지를 앨범별로 다르게 설정
  return baseTimelineSections.map((section, index) => ({
    ...section,
    images: [
      { src: albumImages[index], size: "large" as const, position: "main" },
      { src: albumImages[(index + 1) % albumImages.length], size: "small" as const, position: "bottom-right" },
      { src: albumImages[(index + 2) % albumImages.length], size: "small" as const, position: "bottom-left" },
    ]
  }))
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
"use client"

import { useState, useEffect } from "react"
import type { TimelineEvent } from "@/entities/album"

// 더미 데이터 생성 함수
const generateTimelineData = (albumTitle: string): TimelineEvent[] => {
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

  // 앨범 제목에 따라 다른 타임라인 생성
  const timelineTemplates = {
    "가족여행": [
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
        title: "제주도 여행\n푸른 바다와 함께",
        subtitle: "JEJU ISLAND TRIP\nWITH BLUE OCEAN",
        description: "에메랄드빛 바다가 펼쳐진 제주도에서의 특별한 시간. 아이들은 파도와 놀며 즐거워했고, 우리는 아름다운 자연 속에서 소중한 추억을 만들었습니다.",
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
        title: "공항에서\n새로운 여행의 시작",
        subtitle: "AT THE AIRPORT\nSTART OF NEW JOURNEY",
        description: "설레는 마음으로 공항에 도착했습니다. 아이들의 기대에 찬 표정과 함께 새로운 모험이 시작되는 순간을 담았습니다. 여행의 시작은 언제나 특별합니다.",
        date: "2024.08.10",
        photos: [],
        images: [
          { src: dummyImages[11], size: "large" as const, position: "main" },
          { src: dummyImages[9], size: "small" as const, position: "bottom-right" },
          { src: dummyImages[10], size: "small" as const, position: "bottom-left" },
        ],
      }
    ],
    "생일파티": [
      {
        id: "1",
        title: "생일 준비\n특별한 하루를 위해",
        subtitle: "BIRTHDAY PREPARATION\nFOR A SPECIAL DAY",
        description: "사랑하는 가족의 생일을 위해 온 가족이 정성스럽게 준비했습니다. 케이크부터 장식까지, 모든 것이 완벽한 하루를 만들기 위한 노력이었습니다.",
        date: "2024.03.15",
        photos: [],
        images: [
          { src: dummyImages[7], size: "large" as const, position: "main" },
          { src: dummyImages[0], size: "small" as const, position: "bottom-right" },
          { src: dummyImages[1], size: "small" as const, position: "bottom-left" },
        ],
      },
      {
        id: "2",
        title: "축하 파티\n기쁨이 넘치는 순간",
        subtitle: "CELEBRATION PARTY\nMOMENTS FULL OF JOY",
        description: "촛불을 끄는 순간의 행복한 미소, 선물을 받는 기쁨, 온 가족이 함께 부르는 생일 축하 노래. 사랑이 가득한 특별한 하루였습니다.",
        date: "2024.03.15",
        photos: [],
        images: [
          { src: dummyImages[2], size: "large" as const, position: "main" },
          { src: dummyImages[3], size: "small" as const, position: "bottom-right" },
          { src: dummyImages[4], size: "small" as const, position: "bottom-left" },
        ],
      },
    ],
    default: [
      {
        id: "1",
        title: "소중한 순간\n함께한 시간",
        subtitle: "PRECIOUS MOMENTS\nTIME TOGETHER",
        description: "일상 속에서 발견한 특별한 순간들. 작은 것 하나하나가 모여 소중한 추억이 되었습니다. 가족과 함께하는 모든 순간이 의미 있었습니다.",
        date: "2024.05.20",
        photos: [],
        images: [
          { src: dummyImages[0], size: "large" as const, position: "main" },
          { src: dummyImages[1], size: "small" as const, position: "bottom-right" },
          { src: dummyImages[2], size: "small" as const, position: "bottom-left" },
        ],
      }
    ]
  }

  return timelineTemplates[albumTitle as keyof typeof timelineTemplates] || timelineTemplates.default
}

export function useTimelineAlbum(groupId: string, albumTitle: string) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    // 더미 데이터 로드
    setLoading(true)
    setTimeout(() => {
      const events = generateTimelineData(albumTitle)
      setTimelineEvents(events)
      setLoading(false)
    }, 500)
  }, [albumTitle])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return {
    timelineEvents,
    loading,
    scrollY,
    // TODO: API 연동 시 추가될 함수들
    refetchTimeline: () => {
      const events = generateTimelineData(albumTitle)
      setTimelineEvents(events)
    }
  }
}
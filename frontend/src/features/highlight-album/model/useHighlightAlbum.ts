// 임시 - API나 요청/응답 로직은 나중에 재정의 예정
import { useState } from "react"
import { HighlightAlbumDetail, HighlightPhoto } from "@/entities/highlight"

interface PhotoSlide {
  currentSlide: number
}

export function useHighlightAlbum(groupId: string, albumId: string) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [photoSlides, setPhotoSlides] = useState<Record<string, PhotoSlide>>({})

  // 임시 데이터 - 실제로는 API에서 가져와야 함
  const album: HighlightAlbumDetail = {
    albumId: parseInt(albumId),
    groupId: parseInt(groupId),
    name: "즐거운 화상통화",
    description: "친구들과의 재미있는 시간들",
    photoCount: 12,
    photos: {
      "LAUGH": [
        { photoId: 1, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/laugh_002.jpg", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 2, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/laugh_029.jpg", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 3, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/laugh_122.jpg", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 11, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy1.jpg", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 12, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy2.jpg", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 13, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy3.jpg", type: "LAUGH", takenAt: "2025-08-01" },
      ],
      "SURPRISE": [
        { photoId: 4, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/surprise_018.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 5, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/surprise_109.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 6, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/surprise_154.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 21, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy4.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 21, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy5.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 23, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy6.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
      ],
      "TIRED": [
        { photoId: 7, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/yawn_001.jpg", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 8, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/yawn_011.jpg", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 9, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/yawn_065.jpg", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 31, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy7.jpg", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 32, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy8.jpg", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 33, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy9.jpg", type: "TIRED", takenAt: "2025-08-01" },
      ],
      "SERIOUS": [
        { photoId: 10, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/serious_021.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 11, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/serious_072.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 12, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/serious_119.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 41, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy10.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 42, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy11.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 43, memberId: 3, chatSessionId: "session1", photoUrl: "/dummy/main-dummy12.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
      ],
    },
  }

  const emotionIcons = {
    "LAUGH": "/emotions/fun.svg",
    "SURPRISE": "/emotions/surprise.svg",
    "TIRED": "/emotions/tired.svg",
    "SERIOUS": "/emotions/serious.svg",
  }

  const emotionLabels = {
    "LAUGH": "FUN",
    "SURPRISE": "SURPRISE", 
    "TIRED": "TIRED",
    "SERIOUS": "SERIOUS",
  }

  const emotionColors = {
    "LAUGH": "#FFB803",
    "SURPRISE": "#579AFF",
    "TIRED": "#7EBC60",
    "SERIOUS": "#FF577F",
  }

  // 각 감정별 슬라이드 상태 초기화
  const initializeSlides = () => {
    const slides: Record<string, PhotoSlide> = {}
    Object.keys(album.photos).forEach(emotion => {
      if (!photoSlides[emotion]) {
        slides[emotion] = { currentSlide: 0 }
      } else {
        slides[emotion] = photoSlides[emotion]
      }
    })
    return slides
  }

  // 초기화된 슬라이드 상태 사용
  const currentSlides = { ...initializeSlides(), ...photoSlides }

  const handleSectionZoom = (emotion: string) => {
    setSelectedEmotion(emotion)
    console.log(`Zooming into ${emotion} section`)
  }

  const handleEmotionClick = (emotion: string) => {
    setSelectedEmotion(emotion)
    console.log(`Viewing ${emotion} photos`)
  }

  const handlePrevSlide = (emotion: string) => {
    setPhotoSlides(prev => ({
      ...prev,
      [emotion]: {
        currentSlide: Math.max(0, (prev[emotion]?.currentSlide || 0) - 1)
      }
    }))
  }

  const handleNextSlide = (emotion: string) => {
    const maxSlides = Math.ceil((album.photos[emotion]?.length || 0) / 6)
    setPhotoSlides(prev => ({
      ...prev,
      [emotion]: {
        currentSlide: Math.min(maxSlides - 1, (prev[emotion]?.currentSlide || 0) + 1)
      }
    }))
  }


  return {
    album,
    selectedEmotion,
    emotionIcons,
    emotionLabels,
    emotionColors,
    photoSlides: currentSlides,
    handleSectionZoom,
    handleEmotionClick,
    handlePrevSlide,
    handleNextSlide,
  }
}
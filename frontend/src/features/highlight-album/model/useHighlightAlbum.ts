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
    name: "하이라이트",
    description: "감정별 하이라이트",
    photoCount: 12,
    photos: {
      "LAUGH": [
        { photoId: 1, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/laugh_1.png", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 2, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/laugh_2.jpg", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 3, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/laugh_3.png", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 11, memberId: 4, chatSessionId: "session1", photoUrl: "/presentation/laugh_4.jpg", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 12, memberId: 5, chatSessionId: "session1", photoUrl: "/presentation/laugh_5.png", type: "LAUGH", takenAt: "2025-08-01" },
        { photoId: 13, memberId: 5, chatSessionId: "session1", photoUrl: "/presentation/laugh_6.png", type: "LAUGH", takenAt: "2025-08-01" },
      ],
      "SURPRISE": [
        { photoId: 4, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/surprise_1.png", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 5, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/surprise_2.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 6, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/surprise_3.png", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 21, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/surprise_4.jpg", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 22, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/surprise_5.png", type: "SURPRISE", takenAt: "2025-08-01" },
        { photoId: 23, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/surprise_6.png", type: "SURPRISE", takenAt: "2025-08-01" },
      ],
      "TIRED": [
        { photoId: 7, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/yawn_1.png", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 8, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/yawn_2.jpg", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 9, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/yawn_3.png", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 31, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/yawn_4.jpg", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 32, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/yawn_5.png", type: "TIRED", takenAt: "2025-08-01" },
        { photoId: 33, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/yawn_6.png", type: "TIRED", takenAt: "2025-08-01" },
      ],
      "SERIOUS": [
        { photoId: 10, memberId: 1, chatSessionId: "session1", photoUrl: "/presentation/serious_1.png", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 11, memberId: 2, chatSessionId: "session1", photoUrl: "/presentation/serious_2.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 12, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/serious_3.png", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 41, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/serious_4.jpg", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 42, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/serious_5.png", type: "SERIOUS", takenAt: "2025-08-01" },
        { photoId: 43, memberId: 3, chatSessionId: "session1", photoUrl: "/presentation/serious_6.png", type: "SERIOUS", takenAt: "2025-08-01" },
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
    "LAUGH": "LAUGH",
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
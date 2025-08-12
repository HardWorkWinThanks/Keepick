// 임시 - API나 요청/응답 로직은 나중에 재정의 예정
import { useState } from "react"
import { HighlightAlbum } from "@/entities/highlight"

interface PhotoSlide {
  currentSlide: number
}

export function useHighlightAlbum(groupId: string, albumId: string) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [photoSlides, setPhotoSlides] = useState<Record<string, PhotoSlide>>({})

  // 임시 데이터 - 실제로는 API에서 가져와야 함
  const album: HighlightAlbum = {
    id: albumId,
    title: "즐거운 화상통화",
    description: "친구들과의 재미있는 시간들",
    coverPhoto: "/family-vacation-best-moment.png",
    emotions: {
      웃김: ["/family-vacation-best-moment.png", "/family-vacation-best-moment.png"],
      놀람: ["/family-vacation-best-moment.png", "/family-vacation-best-moment.png"],
      피곤함: ["/family-vacation-best-moment.png"],
      진지함: Array(12).fill("/family-vacation-best-moment.png"),
    },
  }

  const emotionIcons = {
    웃김: "/emotions/fun.svg",
    놀람: "/emotions/surprise.svg",
    피곤함: "/emotions/tired.svg",
    진지함: "/emotions/serious.svg",
  }

  const emotionLabels = {
    웃김: "FUN",
    놀람: "SURPRISE", 
    피곤함: "TIRED",
    진지함: "SERIOUS",
  }

  const emotionColors = {
    웃김: "#FFB803",
    놀람: "#579AFF",
    피곤함: "#7EBC60",
    진지함: "#FF577F",
  }

  // 각 감정별 슬라이드 상태 초기화
  const initializeSlides = () => {
    const slides: Record<string, PhotoSlide> = {}
    Object.keys(album.emotions).forEach(emotion => {
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
    const maxSlides = Math.ceil((album.emotions[emotion]?.length || 0) / 6)
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
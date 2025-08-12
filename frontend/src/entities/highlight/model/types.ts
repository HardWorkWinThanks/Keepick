// 임시 - API나 요청/응답 데이터타입, 필드설정은 나중에 재정의 예정
export interface HighlightAlbum {
  id: string
  title: string
  description: string
  coverPhoto: string
  emotions: {
    [key: string]: string[]
  }
}

export interface EmotionCategory {
  emotion: string
  icon: string
  label: string
  color: string
  photos: string[]
}
// 티어 데이터 타입
export interface TierPhoto {
  id: number
  src: string
  title: string
  date: string
  tier: "S" | "A" | "B" | "C" | "D"
}

export interface TierInfo {
  id: "S" | "A" | "B" | "C" | "D"
  name: string
  color: string
}

export type TierType = TierInfo["id"]
// Photo 타입을 재export하여 통일성 유지
export type { Photo as TierPhoto } from "@/entities/photo"

export interface TierInfo {
  id: "S" | "A" | "B" | "C" | "D"
  name: string
  color: string
}

export type TierType = TierInfo["id"]
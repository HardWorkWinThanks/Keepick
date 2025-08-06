import { Photo } from "@/entities/photo";

export interface TierData {
  [key: string]: Photo[];
}

export interface BattleSequence {
  newPhoto: Photo;
  opponents: Photo[];
  currentOpponentIndex: number;
  targetTier: string;
  targetIndex: number;
  sourceType: string;
}

export interface DragOverPosition {
  tier: string;
  index: number;
}

export interface TierConfig {
  label: string;
  color: string;
}

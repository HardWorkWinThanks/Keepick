import { Photo } from "@/entities/photo";

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  emoji: string;
  description: string;
  photos: Photo[];
}

export interface BattleSequence {
  newPhoto: Photo;
  opponents: Photo[];
  currentOpponentIndex: number;
  targetTier: string;
  targetIndex: number;
  sourceType: string;
}

export interface EmotionCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  images: Photo[];
}

export interface TierData {
  [key: string]: Photo[];
}

export interface DragOverPosition {
  tier: string;
  index: number;
}

import { EmotionCategory } from "@/entities/album";

export const emotionCategories: EmotionCategory[] = [
  {
    id: "lol",
    title: "웃음 대폭발의 순간",
    description: '"이때 왜 웃었지?" 다시 봐도 웃음이 나는 유쾌한 대화들',
    icon: "😂",
    images: Array(5)
      .fill(null)
      .map((_, i) => ({ id: i + 1, src: "/ssafy-dummy1.jpg" })),
  },
  {
    id: "surprised",
    title: "동공지진! 놀람의 순간",
    description: '"헐, 대박!"을 외쳤던, 예상치 못한 반전의 기록들',
    icon: "😮",
    images: Array(4)
      .fill(null)
      .map((_, i) => ({ id: i + 100, src: "/ssafy-dummy1.jpg" })),
  },
  {
    id: "serious",
    title: "진지한 대화, 깊어진 우리",
    description: "가끔은 진지하게, 우리의 깊은 속마음을 나눴던 순간",
    icon: "🤔",
    images: Array(3)
      .fill(null)
      .map((_, i) => ({ id: i + 200, src: "/ssafy-dummy1.jpg" })),
  },
  {
    id: "screenshots",
    title: "기억하고 싶은 모든 순간",
    description: "사소하지만 그래서 더 특별한, 우리만의 모든 기록들",
    icon: "📸",
    images: Array(6)
      .fill(null)
      .map((_, i) => ({ id: i + 300, src: "/ssafy-dummy1.jpg" })),
  },
];

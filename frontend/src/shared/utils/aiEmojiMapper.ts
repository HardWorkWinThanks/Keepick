// AI 감지 결과를 이모지로 변환하는 유틸리티
export const mapGestureToEmoji = (gestureLabel: string): string => {
  const gestureEmojis: { [key: string]: string } = {
    // Static gestures
    bad: "👎",
    fist: "✊",
    good: "👍", 
    gun: "👉",
    heart: "🫶",
    ok: "👌",
    open_palm: "✋",
    promise: "🤙",
    rock: "🤘",
    victory: "✌️",
    // Dynamic gestures
    fire: "🔥",
    hi: "👋",
    hit: "💥", 
    nono: "🚫",
    nyan: "🐾",
    shot: "💖"
  };
  
  return gestureEmojis[gestureLabel] || "👌";
};

export const mapEmotionToEmoji = (emotionLabel: string): string => {
  const emotionEmojis: { [key: string]: string } = {
    laugh: "😄",
    serious: "😤", 
    surprise: "😲",
    yawn: "🥱",
    angry: "😠",
    sad: "😢",
    happy: "😊"
  };
  
  return emotionEmojis[emotionLabel] || "😐";
};

export const generateReactionId = (): string => {
  return `reaction_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};
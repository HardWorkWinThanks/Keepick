"use client";

import { motion } from "framer-motion";
import { InteractiveHoverButton } from "./InteractiveHoverButton";

interface CreateAlbumButtonProps {
  onCreateAlbum: () => void;
  albumType: 'timeline' | 'tier';
}

export function CreateAlbumButton({ onCreateAlbum, albumType }: CreateAlbumButtonProps) {
  const handleClick = () => {
    console.log(`${albumType} 앨범 생성 버튼 클릭 - 갤러리 모드로 전환`)
    onCreateAlbum()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <InteractiveHoverButton
        variant="ghost"
        size="lg"
        onClick={handleClick}
        className="text-lg px-8 py-4"
      >
        CREATE NEW ALBUM
      </InteractiveHoverButton>
    </motion.div>
  )
}
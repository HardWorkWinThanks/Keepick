  "use client";

  import Image from "next/image";
  import { Photo } from "@/entities/photo";

  interface PhotoModalProps {
    photo: Photo | null;
    isOpen: boolean;
    onClose: () => void;
  }

  export function PhotoModal({ photo, isOpen, onClose }: PhotoModalProps) {
    if (!isOpen || !photo) return null;

    return (
      <div
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="relative max-w-4xl max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={photo.src}
            alt={photo.name || photo.id}
            width={1200}
            height={800}
            className="object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: "90vh", maxWidth: "90vw" }}
          />
        </div>
      </div>
    );
  }
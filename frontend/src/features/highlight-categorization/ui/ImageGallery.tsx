"use client";

import Image from "next/image";
import { EmotionCategory } from "@/entities/album";
import { Photo } from "@/entities/photo";

interface ImageGalleryProps {
  category: EmotionCategory;
  onImageClick: (image: Photo) => void;
}

export function ImageGallery({ category, onImageClick }: ImageGalleryProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
        <span className="text-3xl">{category.icon}</span>
        {category.title}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {category.images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer border border-gray-200 shadow-sm hover:shadow-xl hover:border-teal-400
  transition-all duration-300"
            onClick={() => onImageClick(image)}
          >
            <Image
              src={image.thumbnailUrl}
              alt={image.name || `Image ${image.id}`}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { EmotionCategory } from "@/entities/album";

interface CategoryCardProps {
  category: EmotionCategory;
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({
  category,
  isSelected,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group p-5 text-left bg-white rounded-xl shadow-md border-2 transition-all duration-300 ${
        isSelected
          ? "border-teal-500 shadow-lg scale-105"
          : "border-transparent hover:border-teal-300 hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl mt-1">{category.icon}</span>
        <div>
          <h3 className="font-bold text-lg text-gray-800">{category.title}</h3>
          <p className="text-sm text-gray-500">{category.description}</p>
        </div>
      </div>
    </button>
  );
}

"use client";

import { EmotionCategory } from "@/entities/album";
import { CategoryCard } from "./CategoryCard";

interface CategoryGridProps {
  categories: EmotionCategory[];
  selectedCategory: string | null;
  onCategoryClick: (categoryId: string) => void;
}

export function CategoryGrid({
  categories,
  selectedCategory,
  onCategoryClick,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.id}
          onClick={() => onCategoryClick(category.id)}
        />
      ))}
    </div>
  );
}

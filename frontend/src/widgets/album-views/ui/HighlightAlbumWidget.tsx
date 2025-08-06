  "use client";

  import { Photo } from "@/entities/photo";

  import {
    useAlbumState,
    AlbumControls,
    AlbumManagementProps
  } from "@/features/album-management";

  import {
    useEmotionCategories,
    CategoryGrid,
    ImageGallery,
    EmptyState
  } from "@/features/emotion-categorization";

  export function HighlightAlbumWidget({
    albumId,
    albumTitle,
    onBack
  }: AlbumManagementProps) {

    // features hooks 조합
    const { handleImageClick } = useAlbumState();

    const {
      emotionCategories,
      selectedCategory,
      activeCategoryData,
      handleCategoryClick
    } = useEmotionCategories();

    return (
      <div className="space-y-6 animate-fade-in">
        <AlbumControls albumTitle={albumTitle} onBack={onBack} />

        <CategoryGrid
          categories={emotionCategories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />

        {activeCategoryData ? (
          <ImageGallery
            category={activeCategoryData}
            onImageClick={handleImageClick}
          />
        ) : null}
      </div>
    );
  }
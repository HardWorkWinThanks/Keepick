"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, SlidersHorizontal, Check, Trash2, X, ChevronUp, ChevronDown, Upload } from "lucide-react"
import { usePhotoGallery, useMasonryLayout, useDragScroll } from "../model/usePhotoGallery"

interface PhotoGalleryProps {
  groupId: string
  onBack?: () => void
}

export default function PhotoGallery({ groupId, onBack }: PhotoGalleryProps) {
  const {
    filteredPhotos,
    selectedPhotoData,
    allTags,
    selectedTags,
    loading,
    hasMore,
    columnCount,
    isSelectionMode,
    selectedPhotos,
    isPhotosExpanded,
    toggleTag,
    clearAllTags,
    enterSelectionMode,
    exitSelectionMode,
    togglePhotoSelection,
    deleteSelectedPhotos,
    createTimelineAlbum,
    createTierAlbum,
    loadMorePhotos,
    setIsPhotosExpanded,
  } = usePhotoGallery()

  const columns = useMasonryLayout(filteredPhotos, columnCount)
  const smallPreviewDrag = useDragScroll()
  const expandedPreviewDrag = useDragScroll()
  const [isPickHovered, setIsPickHovered] = React.useState(false)

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Main Content */}
      <main className="px-4 md:px-8" style={{ paddingBottom: isSelectionMode ? "100px" : "0" }}>
        {/* Controls Section */}
        <div className="max-w-7xl mx-auto py-8">
          <div className="flex items-start justify-between gap-8">
            {/* Left: Tag Filters */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-keepick-primary text-sm text-gray-400 tracking-wider">태그별 분류</h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearAllTags}
                    className="text-xs text-[#FE7A25] hover:text-orange-400 transition-colors font-keepick-primary"
                  >
                    전체 해제
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <motion.button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-xs font-keepick-primary tracking-wide transition-all duration-300 ${ 
                      selectedTags.includes(tag)
                        ? "bg-white text-black shadow-lg"
                        : "bg-gray-900 text-gray-300 border border-gray-700 hover:border-gray-500 hover:text-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>

              {selectedTags.length > 0 && (
                <p className="text-xs text-gray-500 mt-3 font-keepick-primary">
                  {selectedTags.length}개 태그 선택됨 • {filteredPhotos.length}장의 사진
                </p>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex flex-col items-end gap-3 w-32">
              {/* Selection Mode Button - Fixed height container */}
              <div className="h-10 flex items-center">
                <AnimatePresence mode="wait">
                  {!isSelectionMode ? (
                    <motion.button
                      key="keep-button"
                      onClick={enterSelectionMode}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="px-6 py-2 bg-transparent border-2 border-[#FE7A25] text-white font-keepick-heavy text-sm tracking-wider transition-all duration-300 hover:bg-[#FE7A25]/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Keep!
                    </motion.button>
                  ) : (
                    <motion.button
                      key="exit-button"
                      onClick={exitSelectionMode}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-keepick-primary text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Button */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-keepick-primary">정렬</span>
                <button className="p-2 border border-gray-700 hover:border-gray-500 transition-colors">
                  <SlidersHorizontal size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-keepick-primary">업로드</span>
                <button className="p-2 border border-gray-700 hover:border-gray-500 transition-colors">
                  <Upload size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Delete Button (Selection Mode Only) - Fixed position */}
              <div className="h-10 flex items-center">
                <AnimatePresence>
                  {isSelectionMode && selectedPhotos.length > 0 && (
                    <motion.button
                      onClick={deleteSelectedPhotos}
                      className="p-2 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTags.join(",")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4 items-start"
            >
              {columns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex-1 flex flex-col gap-4">
                  {column.map((photo, photoIndex) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: (columnIndex * column.length + photoIndex) * 0.05,
                        ease: "easeOut",
                      }}
                      className="relative overflow-hidden cursor-pointer group"
                      style={{
                        aspectRatio: photo.aspectRatio,
                      }}
                      onClick={() => isSelectionMode && togglePhotoSelection(photo.id)}
                    >
                      <img
                        src={photo.src || "/placeholder.svg"}
                        alt={photo.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isSelectionMode ? "group-hover:scale-105" : "group-hover:scale-110"
                        } ${selectedPhotos.includes(photo.id) ? "brightness-75" : ""}`}
                        loading="lazy"
                        draggable={false}
                      />

                      {/* Selection Overlay */}
                      {isSelectionMode && (
                        <div
                          className={`absolute inset-0 border-4 transition-all duration-300 ${
                            selectedPhotos.includes(photo.id)
                              ? "border-[#FE7A25] bg-[#FE7A25]/20"
                              : "border-transparent hover:border-[#FE7A25]/50"
                          }`}
                        >
                          {selectedPhotos.includes(photo.id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#FE7A25] rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info Overlay (Non-Selection Mode) */}
                      {!isSelectionMode && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300">
                          <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="mb-3">
                              <p className="font-keepick-primary text-white text-sm font-medium">{photo.date}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {photo.tags.slice(0, 4).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-keepick-primary rounded-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                              {photo.tags.length > 4 && (
                                <span className="px-2 py-1 bg-white/10 backdrop-blur-sm text-gray-300 text-xs font-keepick-primary rounded-sm">
                                  +{photo.tags.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Load More Button */}
          {hasMore && filteredPhotos.length > 0 && !isSelectionMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mt-16 mb-8"
            >
              <button
                onClick={loadMorePhotos}
                disabled={loading}
                className="border border-white/30 px-12 py-4 font-keepick-primary text-sm tracking-wider hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "로딩 중..." : "더 보기"}
              </button>
            </motion.div>
          )}

          {/* No Results */}
          {filteredPhotos.length === 0 && selectedTags.length > 0 && (
            <div className="text-center py-16">
              <p className="font-keepick-primary text-gray-400 text-lg mb-4">선택한 태그에 해당하는 사진이 없습니다</p>
              <button
                onClick={clearAllTags}
                className="font-keepick-primary text-[#FE7A25] hover:text-orange-400 transition-colors underline underline-offset-4"
              >
                모든 사진 보기
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Selection Drawer */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 200,
                delay: 0.2,
              },
            }}
            exit={{
              y: "100%",
              opacity: 0,
              transition: {
                duration: 0.4,
                ease: "easeInOut",
              },
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700"
          >
            <div className="max-w-7xl mx-auto px-8">
              {/* Expanded Photos Section */}
              <AnimatePresence>
                {isPhotosExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "50vh",
                      opacity: 1,
                      transition: { duration: 0.4, ease: "easeInOut" },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: { duration: 0.4, ease: "easeInOut" },
                    }}
                    className="overflow-hidden border-b border-gray-700"
                  >
                    <div className="py-4 h-full">
                      <p className="font-keepick-primary text-xs text-gray-400 mb-3">
                        선택한 사진들로 앨범을 생성할 수 있습니다. 드래그하여 스크롤하세요.
                      </p>

                      <div
                        ref={expandedPreviewDrag.ref}
                        className="h-[calc(100%-2rem)] overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab select-none"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          cursor: expandedPreviewDrag.isDragging ? "grabbing" : "grab",
                        }}
                        onMouseDown={expandedPreviewDrag.handleMouseDown}
                        onMouseMove={expandedPreviewDrag.handleMouseMove}
                        onMouseUp={expandedPreviewDrag.handleMouseUp}
                        onMouseLeave={expandedPreviewDrag.handleMouseLeave}
                      >
                        {selectedPhotos.length > 0 ? (
                          <div className="flex gap-3 h-full pb-4" style={{ width: "max-content" }}>
                            {selectedPhotoData.map((photo, index) => (
                              <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="relative overflow-hidden rounded cursor-pointer group flex-shrink-0"
                                style={{
                                  width: "120px",
                                  height: "120px",
                                }}
                              >
                                <img
                                  src={photo.src || "/placeholder.svg"}
                                  alt={photo.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  draggable={false}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <button
                                    onClick={() => togglePhotoSelection(photo.id)}
                                    className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                                  >
                                    <X size={12} className="text-white" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500 font-keepick-primary text-sm">
                            선택된 사진이 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Control Bar */}
              <div className="py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 flex-shrink-0">
                      <span className="font-keepick-primary text-sm text-gray-300 whitespace-nowrap">
                        {selectedPhotos.length}장 선택됨
                      </span>
                    </div>

                    <div
                      ref={smallPreviewDrag.ref}
                      className="flex gap-2 overflow-x-auto scrollbar-hide cursor-grab select-none"
                      style={{
                        maxWidth: "300px",
                        cursor: smallPreviewDrag.isDragging ? "grabbing" : "grab",
                      }}
                      onMouseDown={smallPreviewDrag.handleMouseDown}
                      onMouseMove={smallPreviewDrag.handleMouseMove}
                      onMouseUp={smallPreviewDrag.handleMouseUp}
                      onMouseLeave={smallPreviewDrag.handleMouseLeave}
                    >
                      {selectedPhotos.slice(0, 8).map((photoId) => {
                        const photo = selectedPhotoData.find((p) => p.id === photoId)
                        if (!photo) return null
                        return (
                          <div key={photoId} className="w-10 h-10 flex-shrink-0 rounded overflow-hidden">
                            <img
                              src={photo.src || "/placeholder.svg"}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          </div>
                        )
                      })}
                      {selectedPhotos.length > 8 && (
                        <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-700 flex items-center justify-center">
                          <span className="text-xs text-gray-300">+{selectedPhotos.length - 8}</span>
                        </div>
                      )}
                      {selectedPhotos.length === 0 && (
                        <div className="text-gray-500 font-keepick-primary text-sm">선택된 사진이 없습니다</div>
                      )}
                    </div>

                    {selectedPhotos.length > 0 && (
                      <button
                        onClick={() => setIsPhotosExpanded(!isPhotosExpanded)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors font-keepick-primary whitespace-nowrap flex-shrink-0"
                      >
                        {isPhotosExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        <span>{isPhotosExpanded ? "접기" : "크게보기"}</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-3">
                    <div
                      className="relative"
                      onMouseEnter={() => setIsPickHovered(true)}
                      onMouseLeave={() => setIsPickHovered(false)}
                    >
                      <AnimatePresence mode="wait">
                        {!isPickHovered || selectedPhotos.length === 0 ? (
                          <motion.button
                            key="single"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            disabled={selectedPhotos.length === 0}
                            className={`px-8 py-3 bg-transparent border-2 font-keepick-heavy text-sm tracking-wider transition-all duration-300 whitespace-nowrap ${
                              selectedPhotos.length === 0
                                ? "text-gray-500 border-gray-600 cursor-not-allowed"
                                : "text-white border-[#FE7A25] hover:bg-[#FE7A25]/10"
                            }`}
                          >
                            Pick!
                          </motion.button>
                        ) : (
                          <motion.div
                            key="split"
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex gap-2"
                          >
                            <motion.button
                              onClick={createTimelineAlbum}
                              className="px-4 py-3 bg-transparent border-2 border-[#FE7A25] text-white font-keepick-heavy text-sm tracking-wide transition-all duration-300 hover:bg-[#FE7A25]/10 whitespace-nowrap"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              타임라인 앨범
                            </motion.button>
                            <motion.button
                              onClick={createTierAlbum}
                              className="px-4 py-3 bg-transparent border-2 border-[#FE7A25] text-white font-keepick-heavy text-sm tracking-wide transition-all duration-300 hover:bg-[#FE7A25]/10 whitespace-nowrap"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              티어 앨범
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
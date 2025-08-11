"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Trash2, Plus, X } from "lucide-react";
import { TimelineEvent } from "@/entities/album";
import { Photo, DragPhotoData } from "@/entities/photo";
import { DroppableArea } from "@/features/photo-drag-drop";

export interface EditableTimelineSectionProps {
  event: TimelineEvent;
  index: number;
  isEditing: boolean;
  isSelected: boolean;
  isDragOver: boolean;
  onFieldChange: (field: keyof TimelineEvent, value: string) => void;
  onDelete: () => void;
  onSelect: () => void;
  onDrop: (dragData: DragPhotoData) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onPhotoRemove: (photoId: string) => void;
  onPhotoClick?: (photo: Photo) => void;
}

export function EditableTimelineSection({
  event,
  index,
  isEditing,
  isSelected,
  isDragOver,
  onFieldChange,
  onDelete,
  onSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onPhotoRemove,
  onPhotoClick,
}: EditableTimelineSectionProps) {
  const [isEditingText, setIsEditingText] = useState(false);

  // 편집 모드가 아닐 때는 기존 뷰어 모드로 표시
  if (!isEditing) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true, margin: "-100px" }}
        className="min-h-screen flex items-center justify-center px-8 py-16 bg-[#111111]"
      >
        <div className="max-w-7xl w-full">
          <div className={`grid grid-cols-12 gap-8 items-center ${index % 2 === 0 ? "" : "lg:grid-flow-col-dense"}`}>
            {/* Text Content */}
            <div className={`col-span-12 lg:col-span-5 space-y-6 ${index % 2 === 0 ? "lg:pr-12" : "lg:pl-12 lg:col-start-8"}`}>
              <div className="text-[#FE7A25] font-keepick-primary text-sm tracking-wider">{event.date}</div>
              <h2 className="font-keepick-heavy text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide">
                {event.title.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </h2>
              {event.subtitle && (
                <h3 className="font-keepick-primary text-lg md:text-xl text-gray-400 tracking-widest">
                  {event.subtitle.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </h3>
              )}
              <p className="font-keepick-primary text-gray-300 leading-relaxed text-base md:text-lg max-w-md">
                {event.description}
              </p>
            </div>

            {/* Images Area */}
            <div className={`col-span-12 lg:col-span-7 relative h-[500px] md:h-[600px] ${index % 2 === 0 ? "" : "lg:col-start-1"}`}>
              {event.images && event.images.length > 0 ? (
                <TimelineImageLayout event={event} index={index} />
              ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
                  <span className="text-gray-400">이미지가 없습니다</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  // 편집 모드
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative min-h-[400px] p-6 m-4 rounded-xl transition-all duration-200 ${
        isSelected 
          ? "bg-blue-50 ring-2 ring-blue-400" 
          : "bg-gray-50 hover:bg-gray-100"
      } ${isDragOver ? "ring-2 ring-green-400 bg-green-50" : ""}`}
      onClick={onSelect}
    >
      {/* 편집 도구 */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingText(!isEditingText);
          }}
          className={`p-2 rounded-lg transition-colors ${
            isEditingText ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
          title="텍스트 편집"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("이 섹션을 삭제하시겠습니까?")) {
              onDelete();
            }
          }}
          className="p-2 rounded-lg bg-white text-red-500 hover:bg-red-50 transition-colors"
          title="섹션 삭제"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Content */}
        <div className="space-y-4">
          {isEditingText ? (
            <>
              {/* 편집 모드 - 입력 필드들 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <input
                  type="text"
                  value={event.date}
                  onChange={(e) => onFieldChange("date", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="2024.01.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <textarea
                  value={event.title}
                  onChange={(e) => onFieldChange("title", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-20 resize-none"
                  placeholder="추억의 제목"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부제목</label>
                <textarea
                  value={event.subtitle || ""}
                  onChange={(e) => onFieldChange("subtitle", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-16 resize-none"
                  placeholder="ENGLISH SUBTITLE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={event.description}
                  onChange={(e) => onFieldChange("description", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-24 resize-none"
                  placeholder="추억에 대한 설명을 적어보세요..."
                />
              </div>
            </>
          ) : (
            <>
              {/* 읽기 모드 - 미리보기 */}
              <div className="text-orange-500 text-sm font-medium">{event.date}</div>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                {event.title.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </h3>
              {event.subtitle && (
                <p className="text-gray-600 font-medium">
                  {event.subtitle.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </p>
              )}
              <p className="text-gray-700 text-sm leading-relaxed">{event.description}</p>
            </>
          )}
        </div>

        {/* Photos Area */}
        <DroppableArea
          id={event.id}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          isDragOver={isDragOver}
          className="min-h-[200px]"
          placeholder={
            <div className="text-center">
              <Plus size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                사이드바에서 사진을 드래그해서<br />
                이곳에 놓아주세요
              </p>
            </div>
          }
        >
          {event.photos && event.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {event.photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="relative group"
                  draggable
                  onDragStart={(e) => {
                    const dragData = {
                      photoId: photo.id,
                      source: `section-${event.id}`,
                    };
                    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <img
                    src={photo.src}
                    alt={photo.name}
                    className="w-full h-24 object-cover rounded-lg cursor-grab hover:opacity-80 transition-opacity active:cursor-grabbing"
                    onClick={() => onPhotoClick?.(photo)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPhotoRemove(photo.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                  >
                    <X size={12} />
                  </button>
                  
                  {/* 드래그 표시 오버레이 */}
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                    <span className="text-xs text-blue-600 font-medium bg-white px-2 py-1 rounded shadow">
                      드래그 가능
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DroppableArea>
      </div>
    </motion.section>
  );
}

// 기존 이미지 레이아웃 컴포넌트 (뷰어 모드용)
function TimelineImageLayout({ event, index }: { event: TimelineEvent; index: number }) {
  if (!event.images) return null;

  const layoutProps = {
    0: {
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[15%] right-[5%] w-[35%] h-[35%] transform rotate-[3deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-5deg] z-15 overflow-hidden",
      filters: ["", "", ""]
    },
    1: {
      mainClass: "absolute top-0 right-0 w-[65%] h-[70%] transform rotate-[1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[10%] left-[5%] w-[35%] h-[35%] transform rotate-[-4deg] z-20 overflow-hidden", 
      small2Class: "absolute bottom-[25%] left-[25%] w-[30%] h-[30%] transform rotate-[6deg] z-15 overflow-hidden",
      filters: ["grayscale", "", ""]
    },
    2: {
      mainClass: "absolute top-0 left-0 w-[65%] h-[70%] transform rotate-[-1deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[20%] right-[5%] w-[35%] h-[35%] transform rotate-[4deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[25%] w-[30%] h-[30%] transform rotate-[-3deg] z-15 overflow-hidden",
      filters: ["contrast-150", "", "grayscale"]
    },
    3: {
      mainClass: "absolute top-0 left-1/2 transform -translate-x-1/2 w-[60%] h-[65%] rotate-[2deg] z-10 overflow-hidden",
      small1Class: "absolute bottom-[5%] left-[10%] w-[35%] h-[35%] transform rotate-[-2deg] z-20 overflow-hidden",
      small2Class: "absolute bottom-[5%] right-[10%] w-[35%] h-[35%] transform rotate-[5deg] z-15 overflow-hidden",
      filters: ["", "grayscale", ""]
    }
  };

  const layout = layoutProps[index % 4 as keyof typeof layoutProps];

  return (
    <>
      {/* Main large image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: index % 2 === 0 ? -2 : 2 }}
        whileInView={{ opacity: 1, scale: 1, rotate: index % 2 === 0 ? -2 : 2 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className={layout.mainClass}
      >
        <img
          src={event.images[0]?.src || "/placeholder.svg"}
          alt={`${event.title} main`}
          className={`w-full h-full object-cover ${layout.filters[0]}`}
        />
      </motion.div>

      {/* Small image 1 */}
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50, rotate: 3 }}
        whileInView={{ opacity: 1, x: 0, rotate: 3 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        viewport={{ once: true }}
        className={layout.small1Class}
      >
        <img
          src={event.images[1]?.src || "/placeholder.svg"}
          alt={`${event.title} detail 1`}
          className={`w-full h-full object-cover ${layout.filters[1]}`}
        />
      </motion.div>

      {/* Small image 2 */}
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30, rotate: -5 }}
        whileInView={{ opacity: 1, x: 0, rotate: -5 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        viewport={{ once: true }}
        className={layout.small2Class}
      >
        <img
          src={event.images[2]?.src || "/placeholder.svg"}
          alt={`${event.title} detail 2`}
          className={`w-full h-full object-cover ${layout.filters[2]}`}
        />
      </motion.div>
    </>
  );
}
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Edit3, Eye, Plus, Save } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TimelineEvent } from "@/entities/album";
import { Photo, DragPhotoData } from "@/entities/photo";
import { DraggablePhotoGrid } from "@/features/photo-drag-drop";
import { EditableTimelineSection } from "./EditableTimelineSection";
import { SidebarDropZone } from "./SidebarDropZone";
import { useTimelineEdit } from "../model/useTimelineEdit";

export interface TimelineEditorProps {
  groupId: string;
  albumId: string;
  initialEvents?: TimelineEvent[];
  availablePhotos?: Photo[];
  onPhotoClick?: (photo: Photo) => void;
  onSave?: (events: TimelineEvent[]) => void;
}

export function TimelineEditor({
  groupId,
  albumId,
  initialEvents = [],
  availablePhotos = [],
  onPhotoClick,
  onSave,
}: TimelineEditorProps) {
  const {
    timelineEvents,
    isEditing,
    dragOverEventId,
    selectedEventId,
    handleToggleEdit,
    handleFieldChange,
    handleAddEvent,
    handleDeleteEvent,
    handleAddPhotoToEvent,
    handleRemovePhotoFromEvent,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSelectEvent,
  } = useTimelineEdit(initialEvents);

  // 사진을 이벤트별로 찾는 헬퍼 함수
  const findPhoto = (photoId: string): Photo | undefined => {
    return availablePhotos.find(photo => photo.id === photoId);
  };

  // 섹션의 사진을 찾는 헬퍼 함수
  const findPhotoInSections = (photoId: string): Photo | undefined => {
    for (const event of timelineEvents) {
      const photo = event.photos.find(p => p.id === photoId);
      if (photo) return photo;
    }
    return undefined;
  };

  // 드롭 핸들러를 래핑하여 실제 사진 객체를 찾아서 전달
  const handleSectionDrop = (eventId: string, dragData: DragPhotoData) => {
    const photo = findPhoto(dragData.photoId);
    if (photo) {
      handleAddPhotoToEvent(eventId, photo);
    }
  };

  // 사진을 사이드바로 돌려보내는 핸들러
  const handlePhotoReturnToSidebar = (photoId: string) => {
    // 모든 섹션에서 해당 사진을 제거
    timelineEvents.forEach(event => {
      if (event.photos.some(p => p.id === photoId)) {
        handleRemovePhotoFromEvent(event.id, photoId);
      }
    });
  };

  const handleSaveTimeline = () => {
    onSave?.(timelineEvents);
    alert("타임라인이 저장되었습니다!");
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-8 py-4">
          <Link href={`/group/${groupId}`} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={20} />
            <span className="font-keepick-primary text-sm">돌아가기</span>
          </Link>
          
          <h1 className="font-keepick-heavy text-xl tracking-wider">
            ALBUM {albumId} {isEditing ? "EDITOR" : "TIMELINE"}
          </h1>
          
          <div className="flex items-center gap-3">
            {isEditing && (
              <>
                <button
                  onClick={handleAddEvent}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  섹션 추가
                </button>
                <button
                  onClick={handleSaveTimeline}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Save size={16} />
                  저장
                </button>
              </>
            )}
            <button
              onClick={handleToggleEdit}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditing 
                  ? "bg-gray-600 hover:bg-gray-700" 
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
              {isEditing ? "미리보기" : "편집"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {isEditing ? (
          <div className="flex">
            {/* 편집 영역 */}
            <div className="flex-1 p-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">타임라인 편집</h2>
                
                {timelineEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <Plus size={64} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-xl text-gray-400 mb-4">아직 섹션이 없습니다</p>
                    <button
                      onClick={handleAddEvent}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                      첫 번째 섹션 추가하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {timelineEvents.map((event, index) => (
                      <EditableTimelineSection
                        key={event.id}
                        event={event}
                        index={index}
                        isEditing={isEditing}
                        isSelected={selectedEventId === event.id}
                        isDragOver={dragOverEventId === event.id}
                        onFieldChange={(field, value) => handleFieldChange(event.id, field, value)}
                        onDelete={() => handleDeleteEvent(event.id)}
                        onSelect={() => handleSelectEvent(event.id)}
                        onDrop={(dragData) => handleSectionDrop(event.id, dragData)}
                        onDragOver={() => handleDragOver(event.id)}
                        onDragLeave={handleDragLeave}
                        onPhotoRemove={(photoId) => handleRemovePhotoFromEvent(event.id, photoId)}
                        onPhotoClick={onPhotoClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 사이드바 - 사용 가능한 사진들 */}
            <SidebarDropZone
              availablePhotos={availablePhotos}
              onPhotoClick={onPhotoClick}
              onPhotoReturn={handlePhotoReturnToSidebar}
            />
          </div>
        ) : (
          // 뷰어 모드 - 기존 타임라인 표시
          <div>
            {timelineEvents.map((event, index) => (
              <EditableTimelineSection
                key={event.id}
                event={event}
                index={index}
                isEditing={false}
                isSelected={false}
                isDragOver={false}
                onFieldChange={() => {}}
                onDelete={() => {}}
                onSelect={() => {}}
                onDrop={() => {}}
                onDragOver={() => {}}
                onDragLeave={() => {}}
                onPhotoRemove={() => {}}
                onPhotoClick={onPhotoClick}
              />
            ))}
            
            {timelineEvents.length === 0 && (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">타임라인이 비어있습니다</h2>
                  <p className="text-gray-400 mb-6">편집 모드에서 섹션을 추가해보세요</p>
                  <button
                    onClick={handleToggleEdit}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors"
                  >
                    편집 시작하기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {!isEditing && timelineEvents.length > 0 && (
        <footer className="bg-[#111111] border-t border-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="font-keepick-heavy text-3xl md:text-4xl mb-4 tracking-wider">ALBUM {albumId}</h2>
            <p className="font-keepick-primary text-gray-400 text-sm tracking-wider">소중한 순간들을 함께 나누는 공간</p>
            <div className="mt-8 flex justify-center gap-8 text-sm font-keepick-primary text-gray-500">
              <Link href={`/group/${groupId}`} className="hover:text-white transition-colors">
                홈
              </Link>
              <Link href={`/group/${groupId}/gallery`} className="hover:text-white transition-colors">
                갤러리
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
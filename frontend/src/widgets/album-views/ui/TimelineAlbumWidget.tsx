  // "use client";

  // import { useState, useEffect } from "react";
  // import { Photo } from "@/entities/photo";
  // import { TimelineEvent as TimelineEventType } from "@/entities/album";

  // import {
  //   useAlbumState,
  //   useAlbumStorage,
  //   AlbumControls,
  //   AvailablePhotosPanel,
  //   AlbumManagementProps
  // } from "@/features/album-management";

  // import {
  //   useTimelineEdit,
  //   // useEmojiPicker,
  //   TimelineControls,
  //   TimelineEvent
  // } from "@/features/timeline-editing";

  // export function TimelineAlbumWidget({
  //   albumId,
  //   albumTitle,
  //   onBack
  // }: AlbumManagementProps) {

  //   // features hooks 사용
  //   const {
  //     availablePhotos,
  //     setAvailablePhotos,
  //     selectedImage,
  //     showImageModal,
  //     handleImageClick,
  //     handleCloseImageModal
  //   } = useAlbumState();

  //   // 초기 이벤트 데이터
  //   const initialEvents: TimelineEventType[] = [
  //     {
  //       id: "event1",
  //       title: "우리의 첫 만남",
  //       date: "2024.01.15",
  //       location: "서울 카페거리",
  //       emoji: "🥰",
  //       description: "이날 엄청 설렜는데, 날씨도 완벽했어.",
  //       photos: [],
  //     },
  //     {
  //       id: "event2",
  //       title: "첫 번째 여행",
  //       date: "2024.03.20",
  //       location: "부산 해운대",
  //       emoji: "✈️",
  //       description: "밤바다 보면서 나눴던 얘기들, 아직도 생생해.",
  //       photos: [],
  //     },
  //   ];

  //   const {
  //     timelineEvents,
  //     setTimelineEvents,
  //     dragOverEventId,
  //     handleFieldChange,
  //     handleAddEvent,
  //     handleRemovePhotoFromEvent,
  //     handleDragOver,
  //     handleDrop,
  //     handleDragLeave,
  //   } = useTimelineEdit(initialEvents);

  //   // const {
  //   //   editingEmojiEventId,
  //   //   emojiOptions,
  //   //   emojiPickerRef,
  //   //   openEmojiPicker,
  //   //   selectEmoji
  //   // } = useEmojiPicker();

  //   // 드래그 시작 핸들러
  //   const handleDragStart = (
  //     e: React.DragEvent<HTMLDivElement>,
  //     photo: Photo,
  //     source: string
  //   ) => {
  //     e.dataTransfer.setData("photo", JSON.stringify(photo));
  //   };

  //   // 앨범 데이터 로드
  //   useEffect(() => {
  //     const initialPhotos: Photo[] = [
  //       { id: "photo1", src: "/ssafy-dummy1.jpg", name: "사진1" },
  //       { id: "photo2", src: "/ssafy-dummy2.jpg", name: "사진2" },
  //       { id: "photo3", src: "/ssafy-dummy3.jpg", name: "사진3" },
  //       { id: "photo4", src: "/ssafy-dummy4.jpg", name: "사진4" },
  //       { id: "photo5", src: "/jaewan1.jpg", name: "사진5" },
  //       { id: "photo6", src: "/food-dummy1.jpg", name: "사진6" },
  //     ];

  //     setAvailablePhotos(initialPhotos);
  //   }, [albumId, setAvailablePhotos]);

  //   return (
  //     <div className="animate-fade-in">
  //       <AlbumControls albumTitle={albumTitle} onBack={onBack}>
  //         <TimelineControls onAddEvent={handleAddEvent} />
  //       </AlbumControls>

  //       <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-8">
  //         <div className="relative pl-8">
  //           <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-300
  // via-cyan-300 to-indigo-300 rounded-full" />

  //           {timelineEvents.map((event) => (
  //             <TimelineEvent
  //               key={event.id}
  //               event={event}
  //               isDraggedOver={dragOverEventId === event.id}
  //               // editingEmojiEventId={editingEmojiEventId}
  //               // emojiOptions={emojiOptions}
  //               // emojiPickerRef={emojiPickerRef}
  //               onFieldChange={handleFieldChange}
  //               onRemovePhoto={(eventId, photo) => {
  //                 handleRemovePhotoFromEvent(eventId, photo);
  //                 setAvailablePhotos(prev => [photo, ...prev]);
  //               }}
  //               // onEmojiClick={openEmojiPicker}
  //               // onEmojiSelect={(eventId, emoji) =>
  //               //   selectEmoji(emoji, (selectedEmoji) =>
  //               //     handleFieldChange(eventId, "emoji", selectedEmoji)
  //               //   )
  //               // }
  //               onDragOver={handleDragOver}
  //               onDrop={(e, eventId) => {
  //                 const photoData = handleDrop(e, eventId);
  //                 if (photoData) {
  //                   setAvailablePhotos(prev => prev.filter(p => p.id !== photoData.id));
  //                 }
  //               }}
  //               onDragLeave={handleDragLeave}
  //             />
  //           ))}

  //           <div className="text-center text-gray-500 font-semibold py-8">
  //             ✨ 우리의 이야기는 계속됩니다... ✨
  //           </div>
  //         </div>

  //         <AvailablePhotosPanel
  //           photos={availablePhotos}
  //           onPhotoClick={handleImageClick}
  //           onDragStart={handleDragStart}
  //           onDragEnd={() => {}}
  //           draggingPhotoId={null}
  //         />
  //       </div>
  //     </div>
  //   );
  // }
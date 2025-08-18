 "use client";

  import { Photo } from "@/entities/photo";
  import { DraggablePhotoGrid } from "@/features/photo-drag-drop";

  interface AvailablePhotosPanelProps {
    photos: Photo[];
    onPhotoClick?: (photo: Photo) => void;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, photo: Photo, source: string) => void;      
    onDragEnd?: () => void;
    draggingPhotoId?: number | null;
    className?: string;
  }

  export function AvailablePhotosPanel({
    photos,
    onPhotoClick,
    onDragStart,
    onDragEnd,
    draggingPhotoId,
    className = "bg-white rounded-xl p-6 shadow-md border lg:h-full lg:max-h-[calc(100vh-180px)] overflow-y-auto",
  }: AvailablePhotosPanelProps) {
    return (
      <div className={className}>
        <h3 className="text-xl font-bold text-gray-700 mb-4">
          사용 가능한 사진
        </h3>
        <div className="p-4 bg-gray-50 rounded-lg min-h-[120px] border-2 border-dashed">
          {photos.length > 0 ? (
            <DraggablePhotoGrid
              photos={photos}
              onPhotoClick={onPhotoClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              draggingPhotoId={draggingPhotoId}
              sourceId="available"
              gridClassName="flex flex-wrap gap-3 items-center"
              photoClassName="rounded-md object-cover cursor-grab w-22 h-22 shadow-sm"
            />
          ) : (
            <p className="text-gray-400 text-sm text-center">
              모든 사진이 배치되었습니다.
            </p>
          )}
        </div>
      </div>
    );
  }
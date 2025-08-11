import EXIF from 'exif-js';

export interface ImageMetadata {
  fileName: string;
  contentType: string;
  fileSize: number;
  width: number;
  height: number;
  takenAt: string;
}

/**
 * 이미지 파일에서 width/height를 추출하는 함수
 */
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src); // 메모리 해제
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * EXIF 데이터에서 촬영 시간을 추출하는 함수
 */
export const getExifTakenAt = (file: File): Promise<Date | null> => {
  return new Promise((resolve) => {
    EXIF.getData(file as any, function() {
      const dateTime = EXIF.getTag(file as any, "DateTime");
      const dateTimeOriginal = EXIF.getTag(file as any, "DateTimeOriginal");
      const dateTimeDigitized = EXIF.getTag(file as any, "DateTimeDigitized");
      
      // 우선순위: DateTimeOriginal > DateTimeDigitized > DateTime
      const exifDate = dateTimeOriginal || dateTimeDigitized || dateTime;
      
      if (exifDate) {
        try {
          // EXIF 날짜 형식: "YYYY:MM:DD HH:MM:SS"
          const [datePart, timePart] = exifDate.split(' ');
          const [year, month, day] = datePart.split(':');
          const [hour, minute, second] = timePart.split(':');
          
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1, // 월은 0부터 시작
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
          );
          
          if (!isNaN(date.getTime())) {
            resolve(date);
            return;
          }
        } catch (error) {
          console.warn('EXIF 날짜 파싱 실패:', error);
        }
      }
      
      // EXIF 데이터가 없거나 파싱에 실패한 경우 null 반환
      resolve(null);
    });
  });
};

/**
 * 파일의 생성 시간을 가져오는 함수 (fallback)
 */
export const getFileCreationTime = (file: File): Date => {
  // File.lastModified는 파일의 마지막 수정 시간을 반환 (밀리초)
  return new Date(file.lastModified);
};

/**
 * 이미지 파일에서 모든 메타데이터를 추출하는 통합 함수
 */
export const extractImageMetadata = async (file: File): Promise<ImageMetadata> => {
  // 기본 파일 정보
  const fileName = file.name;
  const contentType = file.type;
  const fileSize = file.size;
  
  // 이미지 크기 추출
  const { width, height } = await getImageDimensions(file);
  
  // 촬영 시간 추출 (EXIF 우선, 없으면 파일 생성 시간)
  let takenAtDate: Date;
  
  try {
    const exifDate = await getExifTakenAt(file);
    takenAtDate = exifDate || getFileCreationTime(file);
  } catch (error) {
    console.warn('EXIF 추출 실패, 파일 생성 시간 사용:', error);
    takenAtDate = getFileCreationTime(file);
  }
  
  return {
    fileName,
    contentType,
    fileSize,
    width,
    height,
    takenAt: takenAtDate.toISOString(),
  };
};

/**
 * 다중 이미지 파일들의 메타데이터를 병렬로 추출하는 함수
 */
export const extractMultipleImageMetadata = async (
  files: File[]
): Promise<ImageMetadata[]> => {
  const promises = files.map(file => extractImageMetadata(file));
  return Promise.all(promises);
};
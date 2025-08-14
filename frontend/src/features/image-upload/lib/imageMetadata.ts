// // utils/image-metadata.ts
// import exifr from 'exifr';

// export interface ImageMetadata {
//   fileName: string;
//   contentType: string;
//   fileSize: number;
//   width: number;
//   height: number;
//   takenAt: string; // ISO string
// }

// /**
//  * 이미지 파일에서 width/height를 추출
//  * (렌더링 기준의 실제 픽셀 크기를 쓰는 게 안전해서 그대로 유지)
//  */
// export const getImageDimensions = (
//   file: File
// ): Promise<{ width: number; height: number }> => {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => {
//       resolve({ width: img.width, height: img.height });
//       URL.revokeObjectURL(img.src);
//     };
//     img.onerror = reject;
//     img.src = URL.createObjectURL(file);
//   });
// };

// /** "YYYY:MM:DD HH:MM:SS" → Date 변환 */
// function parseExifDateString(s: string): Date | null {
//   // 일부 기기에서 "YYYY:MM:DD HH:MM:SS" 형식
//   const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(s.trim());
//   if (!m) return null;
//   const [, y, mo, d, h, mi, se] = m.map(Number) as unknown as number[];
//   const date = new Date(y, mo - 1, d, h, mi, se);
//   return isNaN(date.getTime()) ? null : date;
// }

// /**
//  * exifr 결과에서 촬영 시각 후보를 뽑아 우선순위로 선택
//  * 우선순위: DateTimeOriginal > CreateDate > ModifyDate > DateTime
//  */
// function pickBestExifDate(tags: any): Date | null {
//   if (!tags) return null;
  
//   const candidates = [
//     tags.DateTimeOriginal,
//     tags.CreateDate,
//     tags.ModifyDate,
//     tags.DateTime, // 일부 기기/포맷
//   ];

//   for (const v of candidates) {
//     if (!v) continue;
//     if (v instanceof Date && !isNaN(v.getTime())) return v;
//     if (typeof v === 'string') {
//       const d = parseExifDateString(v);
//       if (d) return d;
//       // 혹시 다른 문자열 포맷일 수도 있으니 Date 파서 한 번 더 시도
//       const d2 = new Date(v);
//       if (!isNaN(d2.getTime())) return d2;
//     }
//   }
//   return null;
// }

// /**
//  * EXIF/메타데이터에서 촬영 시간을 추출 (exifr)
//  * - JPEG, HEIC, WebP, TIFF 등 폭넓은 포맷 지원
//  */
// export const getExifTakenAt = async (file: File): Promise<Date | null> => {
//   try {
//     // translateValues: true → 사람이 읽기 쉬운 값으로 변환 (날짜는 Date로 오는 경우가 많음)
//     // mergeOutput: true → EXIF/IPTC/XMP 통합
//     const tags = await exifr.parse(file, { translateValues: true, mergeOutput: true });
//     return pickBestExifDate(tags);
//   } catch (e) {
//     console.warn('exifr.parse 실패:', e);
//     return null;
//   }
// };

// /** 파일의 수정시간(로컬 기준) — fallback */
// export const getFileCreationTime = (file: File): Date => {
//   return new Date(file.lastModified);
// };

// /**
//  * 단일 이미지 파일에서 모든 메타데이터 추출
//  */
// export const extractImageMetadata = async (file: File): Promise<ImageMetadata> => {
//   const fileName = file.name;
//   const contentType = file.type;
//   const fileSize = file.size;

//   const { width, height } = await getImageDimensions(file);

//   let takenAtDate: Date;
//   try {
//     const exifDate = await getExifTakenAt(file);
//     takenAtDate = exifDate || getFileCreationTime(file);
//   } catch (error) {
//     console.warn('EXIF 추출 실패, 파일 수정 시간으로 대체:', error);
//     takenAtDate = getFileCreationTime(file);
//   }

//   return {
//     fileName,
//     contentType,
//     fileSize,
//     width,
//     height,
//     takenAt: takenAtDate.toISOString(),
//   };
// };

// /**
//  * 여러 이미지의 메타데이터 병렬 추출
//  */
// export const extractMultipleImageMetadata = async (
//   files: File[]
// ): Promise<ImageMetadata[]> => {
//   return Promise.all(files.map(extractImageMetadata));
// };

// shared/lib로 옮김
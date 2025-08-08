import os
import cv2
import numpy as np
from utils import download_image, read_img_robust, clear_folder, get_face_embeddings_from_array

def laplacian_var(image):
    """라플라시안 분산을 계산하여 흐림 정도 측정"""
    if image.ndim == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def detect_blur(images, blur_threshold=100, temp_dir="temp_blur"):
    """
    흐린 사진을 감지하는 함수
    Args:
        images: 이미지 정보 리스트 [{"url": "...", "name": "..."}]
        blur_threshold: 흐림 임계값 (기본값: 100)
        temp_dir: 임시 디렉토리 경로
    Returns:
        results: 각 이미지의 흐림 감지 결과
    """
    results = []
    
    for idx, img_info in enumerate(images):
        img_name = img_info.get('name', f'image_{idx}')
        
        if 'url' not in img_info:
            results.append({"name": img_name, "error": "URL이 필요합니다"})
            continue
        
        # 이미지 다운로드 및 로드
        temp_path = os.path.join(temp_dir, f"{img_name}.jpg")
        if not download_image(img_info['url'], temp_path):
            results.append({"name": img_name, "error": "이미지 다운로드 실패"})
            continue
            
        img = read_img_robust(temp_path)
        os.remove(temp_path)
        
        if img is None:
            results.append({"name": img_name, "error": "이미지 로드 실패"})
            continue
        
        # 얼굴 영역이 있으면 얼굴 영역에서 블러 검사, 없으면 전체 이미지에서 검사
        faces = get_face_embeddings_from_array(img)
        lap_var = 0
        
        if faces:
            max_area = 0
            for face in faces:
                x1, y1, x2, y2 = map(int, face["bbox"])
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
                crop = img[y1:y2, x1:x2]
                if crop is None or crop.size == 0:
                    continue
                area = (x2 - x1) * (y2 - y1)
                if area > max_area:
                    max_area = area
                    lap_var = laplacian_var(crop)
        else:
            lap_var = laplacian_var(img)
        
        is_blur = lap_var < blur_threshold
        
        results.append({
            "name": img_name,
            "is_blur": bool(is_blur),
            "laplacian_variance": float(lap_var),
            "has_face": bool(len(faces) > 0)
        })
    
    # 임시 디렉토리 정리
    clear_folder(temp_dir)
    
    return {
        "status": "success",
        "blur_threshold": blur_threshold,
        "results": results,
        "summary": {
            "total_images": len(results),
            "blur_images": sum(1 for r in results if r.get('is_blur', False))
        }
    }
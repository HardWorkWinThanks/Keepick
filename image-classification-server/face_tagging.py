import os
import cv2
import torch
import torch.nn.functional as F
import base64
from collections import defaultdict
from utils import download_image, read_img_robust, clear_folder, get_face_embeddings_from_array

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def img_to_base64(img):
    """OpenCV 이미지를 base64로 변환"""
    try:
        _, buffer = cv2.imencode('.jpg', img)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"[오류] 이미지 base64 변환 실패: {e}")
        return None

def tag_faces(target_faces, source_images, distance_threshold=0.6, return_tagged_images=False, temp_dir="temp_face"):
    """
    기준 인물과 매칭되는 얼굴을 찾아 태깅하는 함수
    Args:
        target_faces: 기준 인물 이미지 리스트 [{"url": "...", "name": "..."}]
        source_images: 분석할 이미지 리스트 [{"url": "...", "name": "..."}]
        distance_threshold: 거리 임계값 (기본값: 0.6)
        return_tagged_images: 태깅된 이미지를 base64로 반환할지 여부
        temp_dir: 임시 디렉토리 경로
    Returns:
        results: 얼굴 태깅 결과
    """
    
    # 1. 기준 인물 얼굴 임베딩 생성
    targets = []
    for target_info in target_faces:
        person_name = target_info.get('name', 'unknown')
        
        if 'url' not in target_info:
            print(f"[경고] 기준 인물 URL이 없음: {person_name}")
            continue
        
        # 이미지 다운로드 및 로드
        temp_path = os.path.join(temp_dir, f"target_{person_name}.jpg")
        if not download_image(target_info['url'], temp_path):
            print(f"[경고] 기준 인물 이미지 다운로드 실패: {person_name}")
            continue
            
        img = read_img_robust(temp_path)
        os.remove(temp_path)
        
        if img is None:
            print(f"[경고] 기준 인물 이미지 로드 실패: {person_name}")
            continue
        
        faces = get_face_embeddings_from_array(img)
        if faces:
            for idx, face in enumerate(faces):
                face_name = f"{person_name}_{idx}" if len(faces) > 1 else person_name
                targets.append((face_name, torch.tensor(face["embedding"]).to(device)))
            print(f"[INFO] 기준 인물 로드: {person_name} -> {len(faces)} face(s)")
        else:
            print(f"[경고] 기준 인물 얼굴 인식 실패: {person_name}")
    
    if not targets:
        return {"error": "기준 인물의 얼굴을 인식할 수 없습니다"}
    
    # 2. 소스 이미지에서 얼굴 태깅
    results = []
    tagged_images_data = defaultdict(list)
    
    for idx, img_info in enumerate(source_images):
        img_name = img_info.get('name', f'image_{idx}')
        
        if 'url' not in img_info:
            results.append({"image_name": img_name, "error": "URL이 필요합니다"})
            continue
        
        # 이미지 다운로드 및 로드
        temp_path = os.path.join(temp_dir, f"source_{img_name}.jpg")
        if not download_image(img_info['url'], temp_path):
            results.append({"image_name": img_name, "error": "이미지 다운로드 실패"})
            continue
            
        img = read_img_robust(temp_path)
        os.remove(temp_path)
        
        if img is None:
            results.append({"image_name": img_name, "error": "이미지 로드 실패"})
            continue
        
        # 얼굴 인식 및 매칭
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        from utils import face_app  # face_app 가져오기
        faces = face_app.get(img_rgb)
        
        found_faces = []
        img_copy = img.copy()
        
        for face in faces:
            emb = torch.tensor(face["embedding"]).to(device)
            best_name, best_dist = None, 1.0
            
            # 가장 유사한 기준 인물 찾기
            for tname, temb in targets:
                dist = 1 - F.cosine_similarity(temb.unsqueeze(0), emb.unsqueeze(0)).item()
                if dist < best_dist:
                    best_dist, best_name = dist, tname
            
            # 임계값 이하인 경우 매칭 성공
            if best_dist < distance_threshold:
                x1, y1, x2, y2 = map(int, face["bbox"])
                
                # 이미지에 태깅 박스 그리기
                cv2.rectangle(img_copy, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(img_copy, f"{best_name} ({best_dist:.2f})", 
                          (x1, max(0, y1 - 10)),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                found_faces.append({
                    "person_name": best_name,
                    "distance": float(round(best_dist, 4)),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)]
                })
                
                tagged_images_data[best_name].append(img_name)
        
        # 결과 저장
        result_item = {
            "image_name": img_name,
            "found_faces": found_faces,
            "total_faces": int(len(faces))
        }
        
         # 태깅된 이미지 저장 (로컬 파일로 : /uploads/tagged_results)
        if found_faces:
            # 저장 디렉토리 생성
            save_dir = os.path.join(os.path.dirname(temp_dir), "tagged_results")
            os.makedirs(save_dir, exist_ok=True)
            
            # 태깅된 이미지 파일로 저장
            tagged_filename = f"tagged_{img_name}.jpg"
            tagged_path = os.path.join(save_dir, tagged_filename)
            
            success = cv2.imwrite(tagged_path, img_copy)
            if success:
                result_item["tagged_image_path"] = tagged_path
                result_item["tagged_image_filename"] = tagged_filename
                print(f"[저장] 태깅된 이미지 저장: {tagged_path}")
            else:
                print(f"[오류] 태깅된 이미지 저장 실패: {tagged_path}")

        # 태깅된 이미지를 base64로 반환하는 경우
        if return_tagged_images and found_faces:
            tagged_base64 = img_to_base64(img_copy)
            if tagged_base64:
                result_item["tagged_image_base64"] = tagged_base64
        
        results.append(result_item)
    
    # 임시 디렉토리 정리
    clear_folder(temp_dir)
    
    return {
        "status": "success",
        "distance_threshold": float(distance_threshold),
        "target_persons": [name for name, _ in targets],
        "results": results,
        "tagged_images_by_person": dict(tagged_images_data),
        "summary": {
            "total_source_images": len(results),
            "images_with_faces": sum(1 for r in results if r.get('found_faces')),
            "total_matched_faces": sum(len(r.get('found_faces', [])) for r in results)
        }
    }
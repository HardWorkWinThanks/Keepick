# === 통합 함수: 얼굴매칭 + 객체인식 + 흐림판별 (출력 스키마는 tag_faces와 동일) ===
import os
import cv2
import base64
import torch
import torch.nn.functional as F
from collections import defaultdict

from utils import download_image, read_img_robust, clear_folder, get_face_embeddings_from_array
from job_status import update_job_status

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- 선택적 YOLO 로더 (없으면 objects=[]) ---
_YOLO = None
def _lazy_load_yolo(model_path="./best.pt"):
    global _YOLO
    if _YOLO is not None:
        return _YOLO
    try:
        from ultralytics import YOLO
        if os.path.exists(model_path):
            _YOLO = YOLO(model_path)
        else:
            _YOLO = None
    except Exception:
        _YOLO = None
    return _YOLO

def _run_yolo_on_bgr(img_bgr, conf=0.4, imgsz=640):
    yolo = _lazy_load_yolo()
    if yolo is None:
        return []  # YOLO 미사용 시 빈 리스트
    try:
        res = yolo.predict(img_bgr, conf=conf, imgsz=imgsz, verbose=False)
        r0 = res[0]
        boxes = []
        names = r0.names
        if r0.boxes is not None:
            xyxy = r0.boxes.xyxy.cpu().numpy()
            confs = r0.boxes.conf.cpu().numpy()
            clss = r0.boxes.cls.cpu().numpy().astype(int)
            for (x1, y1, x2, y2), cf, c in zip(xyxy, confs, clss):
                # names가 dict/list 어떤 형태든 안전 접근
                if isinstance(names, (list, tuple)):
                    label = names[c] if 0 <= c < len(names) else str(c)
                else:
                    label = names.get(c, str(c))
                boxes.append({
                    "label": label,
                    "conf": float(round(float(cf), 4)),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)]
                })
        return boxes
    except Exception as e:
        print(f"YOLO 예외 발생: {e}")
        return []

def _img_to_base64(img):
    try:
        _, buffer = cv2.imencode(".jpg", img)
        return base64.b64encode(buffer).decode("utf-8")
    except Exception:
        return None

def _laplacian_var(image_bgr):
    if image_bgr is None or image_bgr.size == 0:
        return 0.0
    if image_bgr.ndim == 3:
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_bgr
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def _faces_to_dicts(faces):
    """
    utils.get_face_embeddings_from_array가 dict 리스트이든, Face 객체 리스트이든
    여기서 dict 표준 형태로 맞춰줌: {'embedding', 'bbox'}
    """
    out = []
    for f in (faces or []):
        if isinstance(f, dict):
            # 이미 표준 dict
            if "embedding" in f and "bbox" in f:
                out.append({
                    "embedding": f["embedding"],
                    "bbox": [int(f["bbox"][0]), int(f["bbox"][1]), int(f["bbox"][2]), int(f["bbox"][3])]
                })
        else:
            # InsightFace Face 객체
            emb = getattr(f, "normed_embedding", None)
            if emb is None:
                emb = getattr(f, "embedding", None)
            if emb is None:
                continue
            x1, y1, x2, y2 = [int(v) for v in getattr(f, "bbox", [0, 0, 0, 0])]
            out.append({"embedding": emb, "bbox": [x1, y1, x2, y2]})
    return out

def tag_faces_detect_and_blur(
    job_id,
    target_faces,
    source_images,
    distance_threshold=0.6,
    return_tagged_images=False,
    temp_dir="temp_face",
    blur_threshold=20.0,
    yolo_conf=0.4,
    yolo_imgsz=640,
):
    """
    반환 스키마는 tag_faces와 동일.
    - top-level: status, distance_threshold, target_persons, results, tagged_images_by_person, summary
    - results[*]: 기존 필드 + (objects, is_blur, laplacian_variance, has_face)만 '추가'
    """
    os.makedirs(temp_dir, exist_ok=True)

    # 1) 타깃 임베딩
    targets = []
    for target_info in target_faces:
        person_name = target_info.get('name', 'unknown')
        url = target_info.get('url')
        if not url:
            continue
        tpath = os.path.join(temp_dir, f"target_{person_name}.jpg")
        if not download_image(url, tpath):
            continue
        img = read_img_robust(tpath)
        try:
            os.remove(tpath)
        except Exception:
            pass
        if img is None:
            continue
        faces_raw = get_face_embeddings_from_array(img)
        faces = _faces_to_dicts(faces_raw)
        for idx, face in enumerate(faces):
            face_name = f"{person_name}_{idx}" if len(faces) > 1 else person_name
            emb = torch.tensor(face["embedding"], dtype=torch.float32, device=device)
            emb = F.normalize(emb, dim=0)
            targets.append((face_name, emb))

    if not targets:
        clear_folder(temp_dir)
        update_job_status(job_id, "integration", "기준 인물의 얼굴을 인식할 수 없습니다", "PROCESSING", len(source_images), 0)
    else:
        # 타깃 텐서로 묶어 매트멀 가속
        t_names = [n for n, _ in targets]
        t_embs = torch.stack([e for _, e in targets], dim=0)  # (T, D)

    results = []
    tagged_by_person = defaultdict(list)

    processed_count = 0
    # 2) 각 소스 이미지 처리
    for idx, info in enumerate(source_images):
        img_name = info.get('name', f'image_{idx}')
        url = info.get('url')
        if not url:
            results.append({"image_name": img_name, "error": "URL이 필요합니다"})
            continue

        spath = os.path.join(temp_dir, f"source_{img_name}.jpg")
        if not download_image(url, spath):
            results.append({"image_name": img_name, "error": "이미지 다운로드 실패"})
            continue

        img = read_img_robust(spath)
        try:
            os.remove(spath)
        except Exception:
            pass
        if img is None:
            results.append({"image_name": img_name, "error": "이미지 로드 실패"})
            continue

        draw = img.copy()

        # (a) 객체인식
        objects = _run_yolo_on_bgr(img, conf=yolo_conf, imgsz=yolo_imgsz)
        for ob in objects:
            x1, y1, x2, y2 = ob["bbox"]
            cv2.rectangle(draw, (x1, y1), (x2, y2), (255, 128, 0), 2)
            cv2.putText(draw, f"{ob['label']} {ob['conf']:.2f}",
                        (x1, max(0, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 128, 0), 2)

        # (b) 얼굴매칭
        faces_raw = get_face_embeddings_from_array(img)
        faces = _faces_to_dicts(faces_raw)
        found_faces = []

        if targets and faces:
            s_embs = torch.stack([torch.tensor(f["embedding"], dtype=torch.float32, device=device) for f in faces], dim=0)
            s_embs = F.normalize(s_embs, dim=1)  # (S, D)
            sims = torch.matmul(s_embs, t_embs.T)  # (S, T)
            best_t_idx = torch.argmax(sims, dim=1)  # (S,)
            best_sims = sims[torch.arange(sims.shape[0], device=device), best_t_idx]  # (S,)
            best_dists = 1.0 - best_sims

            for k, f in enumerate(faces):
                dist = float(best_dists[k].item())
                if dist < float(distance_threshold):
                    name = t_names[int(best_t_idx[k].item())]
                    x1, y1, x2, y2 = map(int, f["bbox"])
                    cv2.rectangle(draw, (x1, y1), (x2, y2), (0, 220, 0), 2)
                    cv2.putText(draw, f"{name} ({dist:.2f})",
                                (x1, max(0, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 220, 0), 2)
                    found_faces.append({
                        "person_name": name,
                        "distance": float(round(dist, 4)),
                        "bbox": [x1, y1, x2, y2]
                    })
                    tagged_by_person[name].append(img_name)

        # (c) 흐림판별 (얼굴 있으면 가장 큰 얼굴, 없으면 전체)
        if faces:
            H, W = img.shape[:2]
            max_area, lap = 0, 0.0
            for f in faces:
                x1, y1, x2, y2 = map(int, f["bbox"])
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(W, x2), min(H, y2)
                crop = img[y1:y2, x1:x2]
                if crop is None or crop.size == 0:
                    continue
                area = max(0, x2 - x1) * max(0, y2 - y1)
                if area > max_area:
                    max_area = area
                    lap = _laplacian_var(crop)
            lap_var = lap
        else:
            lap_var = _laplacian_var(img)

        is_blur = bool(lap_var < float(blur_threshold))
        if is_blur:
            cv2.rectangle(draw, (8, 8), (90, 36), (0, 0, 255), -1)
            cv2.putText(draw, "BLUR", (14, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # (d) 결과 아이템: tag_faces 스키마 유지 + (추가필드만 더함)
        item = {
            "image_name": img_name,
            "found_faces": found_faces,
            "total_faces": int(len(faces)),
            # --- 추가 필드 (스키마 확장): ---
            "objects": objects,
            "is_blur": is_blur,
            "laplacian_variance": float(lap_var),
            "has_face": bool(len(faces) > 0),
        }

        # 태깅 이미지 저장 (tag_faces와 동작 동일)
        if found_faces or objects or is_blur:
            save_dir = os.path.join(os.path.dirname(temp_dir), "tagged_results")
            os.makedirs(save_dir, exist_ok=True)
            tagged_filename = f"tagged_{img_name}.jpg"
            tagged_path = os.path.join(save_dir, tagged_filename)
            if cv2.imwrite(tagged_path, draw):
                item["tagged_image_path"] = tagged_path
                item["tagged_image_filename"] = tagged_filename

            if return_tagged_images:
                b64 = _img_to_base64(draw)
                if b64:
                    item["tagged_image_base64"] = b64

        results.append(item)
        processed_count += 1
        update_job_status(job_id, "integration", f"이미지 {idx + 1}/{len(source_images)} 분석 완료","PROCESSING", len(source_images), processed_count)

    # 마무리
    clear_folder(temp_dir)

    # summary는 tag_faces 스키마 그대로 유지
    summary = {
        "total_source_images": len(results),
        "images_with_faces": sum(1 for r in results if r.get('found_faces')),
        "total_matched_faces": sum(len(r.get('found_faces', [])) for r in results),
    }

    return {
        "status": "success",
        "distance_threshold": float(distance_threshold),
        "target_persons": [name for name, _ in targets],
        "results": results,
        "tagged_images_by_person": dict(tagged_by_person),
        "summary": summary
    }, processed_count

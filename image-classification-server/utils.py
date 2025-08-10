import os
import cv2
import numpy as np
import requests
from insightface.app import FaceAnalysis

# 전역 모델 초기화
face_app = FaceAnalysis(providers=['CUDAExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

def clear_folder(folder_path):
    """폴더 내 모든 파일 삭제"""
    if os.path.exists(folder_path):
        for f in os.listdir(folder_path):
            fp = os.path.join(folder_path, f)
            if os.path.isfile(fp):
                os.remove(fp)

def read_img_robust(img_path):
    """안전한 이미지 읽기"""
    try:
        with open(img_path, "rb") as stream:
            bytes_data = bytearray(stream.read())
            numpy_array = np.asarray(bytes_data, dtype=np.uint8)
            return cv2.imdecode(numpy_array, cv2.IMREAD_UNCHANGED)
    except Exception as e:
        print(f"[오류] 이미지 읽기 실패 {img_path}: {e}")
        return None

def get_face_embeddings_from_array(img):
    """이미지 배열에서 얼굴 임베딩 추출"""
    if img is None:
        return []
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return face_app.get(rgb)

def download_image(url, save_path):
    """URL에서 이미지 다운로드"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"[실패] 다운로드 실패: {url}")
            return False
    except Exception as e:
        print(f"[오류] 다운로드 중 예외 발생: {url} / {e}")
        return False
import os
import cv2
import numpy as np
import requests
import torch
from insightface.app import FaceAnalysis

_has_cuda = torch.cuda.is_available()
face_app = FaceAnalysis(providers=['CUDAExecutionProvider'] if _has_cuda else ['CPUExecutionProvider'])
face_app.prepare(ctx_id=0 if _has_cuda else -1, det_size=(640, 640))

def clear_folder(folder_path):
    if os.path.exists(folder_path):
        for f in os.listdir(folder_path):
            fp = os.path.join(folder_path, f)
            if os.path.isfile(fp):
                try:
                    os.remove(fp)
                except Exception:
                    pass

def read_img_robust(img_path):
    try:
        with open(img_path, "rb") as stream:
            bytes_data = bytearray(stream.read())
            numpy_array = np.asarray(bytes_data, dtype=np.uint8)
            return cv2.imdecode(numpy_array, cv2.IMREAD_UNCHANGED)
    except Exception as e:
        print(f"[오류] 이미지 읽기 실패 {img_path}: {e}")
        return None

def get_face_embeddings_from_array(img):
    if img is None:
        return []
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return face_app.get(rgb)

def download_image(url, save_path):
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

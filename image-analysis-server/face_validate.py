import os
import torch
import torch.nn.functional as F
from utils import download_image, read_img_robust, get_face_embeddings_from_array

def validate_face_registration(image_url, person_name="user", temp_dir="temp_face", min_face_size=50):
    """
    사용자 얼굴 등록을 위한 이미지 검증 함수
    - 정확히 1개의 얼굴만 감지되어야 함
    - AI가 인식 가능한 얼굴 특징이 있어야 함
    
    Args:
        image_url (str): 검증할 이미지 URL
        person_name (str): 사용자 이름 (기본값: "user")
        temp_dir (str): 임시 디렉토리 경로
        min_face_size (int): 최소 얼굴 크기 (픽셀)
    
    Returns:
        dict: {
            'is_valid': bool,           # 등록 가능 여부
            'face_count': int,          # 감지된 얼굴 수
            'embedding': tensor/None,   # 정규화된 얼굴 임베딩 (성공시)
            'face_bbox': list/None,     # 얼굴 위치 [x1, y1, x2, y2]
            'error_code': str,          # 오류 코드
            'message': str              # 상세 메시지
        }
    """
    
    # 임시 디렉토리 생성
    os.makedirs(temp_dir, exist_ok=True)
    
    # 이미지 다운로드
    temp_path = os.path.join(temp_dir, f"validate_{person_name}.jpg")
    
    if not download_image(image_url, temp_path):
        return {
            'is_valid': False,
            'face_count': 0,
            'embedding': None,
            'face_bbox': None,
            'error_code': 'DOWNLOAD_FAILED',
            'message': '이미지 다운로드에 실패했습니다.'
        }
    
    try:
        # 이미지 로드
        img = read_img_robust(temp_path)
        if img is None:
            return {
                'is_valid': False,
                'face_count': 0,
                'embedding': None,
                'face_bbox': None,
                'error_code': 'IMAGE_LOAD_FAILED',
                'message': '이미지를 읽을 수 없습니다.'
            }
        
        # 얼굴 감지 및 임베딩 추출
        try:
            faces_raw = get_face_embeddings_from_array(img)
        except Exception as e:
            return {
                'is_valid': False,
                'face_count': 0,
                'embedding': None,
                'face_bbox': None,
                'error_code': 'FACE_DETECTION_ERROR',
                'message': f'얼굴 감지 중 오류가 발생했습니다: {str(e)}'
            }
        
        # 얼굴 수 검증
        if not faces_raw or len(faces_raw) == 0:
            return {
                'is_valid': False,
                'face_count': 0,
                'embedding': None,
                'face_bbox': None,
                'error_code': 'NO_FACE_DETECTED',
                'message': '얼굴이 감지되지 않았습니다. 얼굴이 명확히 보이는 사진을 사용해주세요.'
            }
        
        if len(faces_raw) > 1:
            return {
                'is_valid': False,
                'face_count': len(faces_raw),
                'embedding': None,
                'face_bbox': None,
                'error_code': 'MULTIPLE_FACES_DETECTED',
                'message': f'{len(faces_raw)}개의 얼굴이 감지되었습니다. 1명만 있는 사진을 사용해주세요.'
            }
        
        # 단일 얼굴 정보 추출
        face = faces_raw[0]
        
        # 얼굴 정보를 dict 형태로 변환
        if isinstance(face, dict):
            embedding = face.get("embedding")
            bbox = face.get("bbox", [0, 0, 0, 0])
        else:
            # InsightFace Face 객체인 경우
            embedding = getattr(face, "normed_embedding", None)
            if embedding is None:
                embedding = getattr(face, "embedding", None)
            bbox = getattr(face, "bbox", [0, 0, 0, 0])
        
        # 임베딩 검증
        if embedding is None:
            return {
                'is_valid': False,
                'face_count': 1,
                'embedding': None,
                'face_bbox': None,
                'error_code': 'NO_EMBEDDING',
                'message': '얼굴 특징을 추출할 수 없습니다.'
            }
        
        # bbox 정보 검증 및 크기 확인
        x1, y1, x2, y2 = [int(v) for v in bbox]
        face_width = x2 - x1
        face_height = y2 - y1
        
        if face_width < min_face_size or face_height < min_face_size:
            return {
                'is_valid': False,
                'face_count': 1,
                'embedding': None,
                'face_bbox': [x1, y1, x2, y2],
                'error_code': 'FACE_TOO_SMALL',
                'message': f'얼굴 크기가 너무 작습니다 ({face_width}x{face_height}). 더 큰 얼굴이 나온 사진을 사용해주세요.'
            }
        
        # 임베딩을 텐서로 변환하고 정규화
        try:
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            embedding_tensor = torch.tensor(embedding, dtype=torch.float32, device=device)
            normalized_embedding = F.normalize(embedding_tensor, dim=0)
            
            # 임베딩 품질 검증 (기본적인 체크)
            if torch.isnan(normalized_embedding).any() or torch.isinf(normalized_embedding).any():
                return {
                    'is_valid': False,
                    'face_count': 1,
                    'embedding': None,
                    'face_bbox': [x1, y1, x2, y2],
                    'error_code': 'INVALID_EMBEDDING',
                    'message': '얼굴 특징 벡터가 유효하지 않습니다.'
                }
            
        except Exception as e:
            return {
                'is_valid': False,
                'face_count': 1,
                'embedding': None,
                'face_bbox': [x1, y1, x2, y2],
                'error_code': 'EMBEDDING_PROCESSING_ERROR',
                'message': f'얼굴 특징 처리 중 오류: {str(e)}'
            }
        
        # 성공적으로 검증 완료
        return {
            'is_valid': True,
            'face_count': 1,
            'embedding': normalized_embedding,
            'face_bbox': [x1, y1, x2, y2],
            'error_code': 'SUCCESS',
            'message': f'얼굴 등록이 가능합니다. 얼굴 크기: {face_width}x{face_height}'
        }
        
    finally:
        # 임시 파일 정리
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass


# 사용 예시
if __name__ == "__main__":
    # 1. 얼굴 등록 검증만 수행
    image_url = "https://keepick-bucket.s3.ap-northeast-2.amazonaws.com/test/group-sh.jpg"
    person_name = "홍길동"
    
    result = validate_face_registration(image_url)
    
    if result['is_valid']:
        print(f"✓ 등록 가능: {result['message']}")
        print(f"  얼굴 위치: {result['face_bbox']}")
        print(f"  임베딩 차원: {result['embedding'].shape}")
    else:
        print(f"✗ 등록 불가: {result['message']}")
        print(f"  오류 코드: {result['error_code']}")

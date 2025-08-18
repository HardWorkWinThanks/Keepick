import os
import cv2
import torch
import torch.nn.functional as F
from torchvision import models, transforms
from utils import download_image, read_img_robust, clear_folder
from job_status import update_job_status

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# CNN 모델 초기화
cnn_model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
cnn_model = torch.nn.Sequential(*list(cnn_model.children())[:-1])
cnn_model = cnn_model.to(device).eval()

preprocess = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

def get_cnn_embedding(img_tensor):
    """CNN을 사용하여 이미지 임베딩 생성"""
    with torch.no_grad():
        return cnn_model(img_tensor.unsqueeze(0).to(device)).flatten()

def group_similar_images(job_id, images, similarity_threshold=0.95, temp_dir="temp_similar"):
    """
    유사한 이미지들을 그룹화하는 함수
    Args:
        images: 이미지 정보 리스트 [{"url": "...", "name": "..."}]
        similarity_threshold: 유사도 임계값 (기본값: 0.9)
        temp_dir: 임시 디렉토리 경로
    Returns:
        groups: 유사한 이미지들의 그룹 정보
    """
    embeddings = []
    
    # 각 이미지의 임베딩 생성
    for idx, img_info in enumerate(images):
        img_name = img_info.get('name', f'image_{idx}')
        
        if 'url' not in img_info:
            print(f"[경고] URL이 없음: {img_name}")
            continue
        
        # 이미지 다운로드 및 로드
        temp_path = os.path.join(temp_dir, f"{img_name}.jpg")
        if not download_image(img_info['url'], temp_path):
            print(f"[경고] 이미지 다운로드 실패: {img_name}")
            continue
            
        img = read_img_robust(temp_path)
        os.remove(temp_path)
        
        if img is None:
            print(f"[경고] 이미지 로드 실패: {img_name}")
            continue
        
        try:
            # CNN 임베딩 생성
            tensor = preprocess(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).to(device)
            emb = get_cnn_embedding(tensor)
            embeddings.append((img_name, emb))
            print(f"[INFO] 임베딩 생성 성공: {img_name}")
        except Exception as e:
            print(f"[경고] 임베딩 실패: {img_name} / {e}")
    
    update_job_status(job_id, "similar_grouping", "이미지 임베딩 생성 완료", "PROCESSING", len(embeddings), 0)
    # 유사성 기반 그룹화
    groups = []
    used = set()
    
    for i in range(len(embeddings)):
        if embeddings[i][0] in used:
            continue
        
        group = [embeddings[i][0]]
        similarities = []
        
        for j in range(i + 1, len(embeddings)):
            if embeddings[j][0] not in used:
                sim = F.cosine_similarity(
                    embeddings[i][1].unsqueeze(0), 
                    embeddings[j][1].unsqueeze(0)
                ).item()
                
                if sim > similarity_threshold:
                    group.append(embeddings[j][0])
                    used.add(embeddings[j][0])
                    similarities.append({
                        "image1": embeddings[i][0],
                        "image2": embeddings[j][0],
                        "similarity": float(round(sim, 4))
                    })
        used.add(embeddings[i][0])
        
        if len(group) > 1:
            groups.append({
                "group_id": len(groups),
                "images": group,
                "similarities": similarities
            })

        update_job_status(job_id, "similar_grouping", "유사 이미지 분석중입니다.", "PROCESSING", len(embeddings), i)
    
    # 임시 디렉토리 정리
    clear_folder(temp_dir)
    
    return {
        "status": "success",
        "similarity_threshold": float(similarity_threshold),
        "groups": groups,
        "summary": {
            "total_images": len(embeddings),
            "grouped_images": sum(len(g['images']) for g in groups),
            "total_groups": len(groups)
        }
    }
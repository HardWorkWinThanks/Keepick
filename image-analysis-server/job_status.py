import json
from datetime import datetime
from redis_client import redis_client

def update_job_status(job_id, job_type, message, job_status, total_images, processed_images, result=None):
    """Redis에 작업 상태 업데이트"""
    job_data = {
        "job_id": job_id,
        "job_type": job_type,
        "job_status": job_status,  # "started", "processing", "completed", "failed"
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "result": result,
        "total_images": total_images,
        "processed_images": processed_images,
    }
    try:
        print(f"[INFO] Redis 작업 상태 업데이트: {job_data}")
        redis_client.setex(f"{job_id}", 3600, json.dumps(job_data))  # 1시간 TTL
    except Exception as e:
        print(f"[ERROR] Redis 작업 상태 업데이트 실패: {e}")


def get_job_status(job_id):
    """Redis에서 작업 상태 조회"""
    data = redis_client.get(f"{job_id}")
    return json.loads(data) if data else None
# redis_utils.py
import os
import redis
import json
from datetime import datetime

# Redis 클라이언트 설정 (환경변수로 설정 가능)
REDIS_HOST = os.getenv('REDIS_HOST', '127.0.0.1')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 0))

# 전역 Redis 클라이언트 인스턴스
# redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
    redis_client.ping()
    print("✅ Redis 연결 성공!")
except Exception as e:
    print(f"❌ Redis 연결 실패: {e}")

def get_redis_client():
    """Redis 클라이언트 인스턴스 반환"""
    return redis_client

def update_job_status(job_id, status, message="", progress=0, result=None, ttl=3600):
    """Redis에 작업 상태 업데이트"""
    job_data = {
        "status": status,  # "started", "processing", "completed", "failed"
        "message": message,
        "progress": progress,
        "result": result
    }
    redis_client.setex(f"job:{job_id}", ttl, json.dumps(job_data))

def get_job_status(job_id):
    """Redis에서 작업 상태 조회"""
    data = redis_client.get(f"job:{job_id}")
    return json.loads(data) if data else None

def delete_job_status(job_id):
    """Redis에서 작업 상태 삭제"""
    return redis_client.delete(f"job:{job_id}")

def get_all_jobs(pattern="job:*"):
    """모든 작업 목록 조회"""
    keys = redis_client.keys(pattern)
    jobs = {}
    for key in keys:
        job_id = key.replace("job:", "")
        jobs[job_id] = get_job_status(job_id)
    return jobs
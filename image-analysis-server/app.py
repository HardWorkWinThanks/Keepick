import os
import redis
import json
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

# 모듈: 통합(얼굴+객체+블러), 유사도
from detect_and_blur import tag_faces_detect_and_blur
from similar_grouping import group_similar_images

BASE = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE, "uploads")

app = Flask(__name__, template_folder=os.path.join(BASE, "templates"))
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Redis 클라이언트 설정
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# 필요 폴더
for folder in ["temp_face", "temp_similar", "tagged_results"]:
    os.makedirs(os.path.join(UPLOAD_FOLDER, folder), exist_ok=True)

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
    redis_client.setex(f"{job_id}", 3600, json.dumps(job_data))  # 1시간 TTL

def get_job_status(job_id):
    """Redis에서 작업 상태 조회"""
    data = redis_client.get(f"{job_id}")
    return json.loads(data) if data else None


# tagged 이미지 서빙 (tagged_image_filename용)
@app.route("/uploads/tagged_results/<path:filename>")
def serve_tagged(filename):
    base = os.path.join(UPLOAD_FOLDER, "tagged_results")
    return send_from_directory(base, filename)

# 1) 통합: 얼굴매칭 + 객체인식 + 블러
@app.route("/api/tag_and_detect", methods=["POST"])
def api_tag_and_detect():
    job_id = None
    try:
        data = request.get_json()
        if (not data or "target_faces" not in data or "source_images" not in data):
            return jsonify({"error": "target_faces와 source_images 필드가 필요합니다"}), 400

        job_id      = data.get("job_id", 1)
        targets     = data["target_faces"]
        sources     = data["source_images"]
        face_th     = data.get("face_distance_threshold", 0.6)
        yolo_opt    = data.get("yolo", {"conf": 0.4, "imgsz": 640})
        blur_th     = data.get("blur_threshold", 100.0)
        ret_b64     = data.get("return_tagged_images", False)

        # 작업 시작 상태 업데이트
        update_job_status(job_id, "integration", "얼굴 매칭 및 객체 인식 작업을 시작합니다", "STARTED", len(sources), 0)

        temp_dir    = os.path.join(UPLOAD_FOLDER, "temp_face")
        tagged_dir  = os.path.join(UPLOAD_FOLDER, "tagged_results")
        os.makedirs(temp_dir, exist_ok=True)
        os.makedirs(tagged_dir, exist_ok=True)

        # 처리 중 상태 업데이트
        update_job_status(job_id, "integration", "이미지를 처리 중입니다", "PROCESSING",  len(sources), 0)

        result = tag_faces_detect_and_blur(
            target_faces=targets,
            source_images=sources,
            distance_threshold=face_th,
            return_tagged_images=ret_b64,
            temp_dir=temp_dir,
            blur_threshold=blur_th,
            yolo_conf=yolo_opt.get("conf", 0.4),
            yolo_imgsz=yolo_opt.get("imgsz", 640),
        )

        if "tagged_images_by_person" in result:
            result["tagged_images"] = dict(result["tagged_images_by_person"])

        if "error" in result:
            # 실패 상태 업데이트
            update_job_status(job_id, "integration", f"처리 실패: {result['error']}", "FAILED", len(sources), 0, result)
            status = 400
        else:
            # 완료 상태 업데이트
            update_job_status(job_id, "integration", "작업이 성공적으로 완료되었습니다", "COMPLETED", len(sources), len(sources), result)
            status = 200

        return jsonify(result), status
    except Exception as e:
        if job_id:
            update_job_status(job_id, "integration",  f"처리 중 오류 발생: {str(e)}", "FAILED", len(sources), 0, result)
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500

# 2) 유사도 그룹핑만
@app.route("/api/similar_grouping", methods=["POST"])
def api_similar_grouping():
    job_id = None
    try:
        data = request.get_json()
        if not data or "images" not in data:
            return jsonify({"error": "images 필드가 필요합니다"}), 400

        job_id   = data.get("job_id", 1)
        images   = data["images"]
        sim_th   = data.get("similarity_threshold", 0.9)
        temp_dir = os.path.join(UPLOAD_FOLDER, "temp_similar")
        os.makedirs(temp_dir, exist_ok=True)

        # 작업 시작 상태 업데이트
        update_job_status(job_id, "similar_grouping", "이미지를 처리 중입니다", "PROCESSING",  len(images), 0)

        update_job_status(job_id, "similar_grouping", "유사 이미지 그룹핑 작업을 시작합니다", "STARTED", len(images), 0)

        # 처리 중 상태 업데이트
        update_job_status(job_id, "similar_grouping", "이미지 유사도를 분석 중입니다", "PROCESSING", len(images), 0)

        result = group_similar_images(images, similarity_threshold=sim_th, temp_dir=temp_dir)
        
        # 완료 상태 업데이트
        update_job_status(job_id, "similar_grouping", "유사 이미지 그룹핑이 완료되었습니다", "COMPLETED", len(images), len(images), result)
        
        return jsonify(result)
    except Exception as e:
        if job_id:
            update_job_status(job_id, "similar_grouping",  f"처리 중 오류 발생: {str(e)}", "FAILED", len(images), 0)
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500

@app.route("/", methods=["GET"])
def home():
    tmpl = os.path.join(BASE, "templates", "index.html")
    return render_template("index.html") if os.path.exists(tmpl) else "OK"

if __name__ == "__main__":
    # 프로덕션에선 debug=False 권장
    app.run(host="0.0.0.0", port=5000, debug=True)
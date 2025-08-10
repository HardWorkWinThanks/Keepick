import os
from flask import Flask, render_template, request, jsonify

# 각 기능 모듈 import
from blur_detection import detect_blur
from similar_grouping import group_similar_images
from face_tagging import tag_faces

# ===== Flask 설정 =====
BASE = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE, "uploads")

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# 임시 디렉토리 생성
for folder in ["temp_blur", "temp_similar", "temp_face"]:
    os.makedirs(os.path.join(UPLOAD_FOLDER, folder), exist_ok=True)

# ===== API 엔드포인트들 =====

@app.route("/api/blur_detection", methods=["POST"])
def blur_detection_api():
    """흐린 사진 감지 API"""
    try:
        data = request.get_json()
        if not data or 'images' not in data:
            return jsonify({"error": "images 필드가 필요합니다"}), 400
        
        images = data['images']
        blur_threshold = data.get('blur_threshold', 100)
        temp_dir = os.path.join(UPLOAD_FOLDER, "temp_blur")
        
        result = detect_blur(images, blur_threshold, temp_dir)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500

@app.route("/api/similar_grouping", methods=["POST"])
def similar_grouping_api():
    """유사 사진 분류 API"""
    try:
        data = request.get_json()
        if not data or 'images' not in data:
            return jsonify({"error": "images 필드가 필요합니다"}), 400
        
        images = data['images']
        similarity_threshold = data.get('similarity_threshold', 0.9)
        temp_dir = os.path.join(UPLOAD_FOLDER, "temp_similar")
        
        result = group_similar_images(images, similarity_threshold, temp_dir)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500

@app.route("/api/face_tagging", methods=["POST"])
def face_tagging_api():
    """얼굴 인식 및 태깅 API"""
    try:
        data = request.get_json()
        if not data or 'target_faces' not in data or 'source_images' not in data:
            return jsonify({"error": "target_faces와 source_images 필드가 필요합니다"}), 400
        
        target_faces = data['target_faces']
        source_images = data['source_images']
        distance_threshold = data.get('distance_threshold', 0.6)
        return_tagged_images = data.get('return_tagged_images', False)
        temp_dir = os.path.join(UPLOAD_FOLDER, "temp_face")
        
        result = tag_faces(target_faces, source_images, distance_threshold, return_tagged_images, temp_dir)
        
        # 오류가 있는 경우 400 상태 코드 반환
        if "error" in result:
            return jsonify(result), 400
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
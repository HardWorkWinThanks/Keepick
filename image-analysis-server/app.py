import os
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

# 필요 폴더
for folder in ["temp_face", "temp_similar", "tagged_results"]:
    os.makedirs(os.path.join(UPLOAD_FOLDER, folder), exist_ok=True)

# tagged 이미지 서빙 (tagged_image_filename용)
@app.route("/uploads/tagged_results/<path:filename>")
def serve_tagged(filename):
    base = os.path.join(UPLOAD_FOLDER, "tagged_results")
    return send_from_directory(base, filename)

# 1) 통합: 얼굴매칭 + 객체인식 + 블러
@app.route("/api/tag_and_detect", methods=["POST"])
def api_tag_and_detect():
    """
    Body:
    {
      "target_faces":[{"url":"...","name":"alice"}],
      "source_images":[{"url":"...","name":"img1"}],
      "face_distance_threshold":0.6,
      "yolo":{"conf":0.4,"imgsz":640},
      "blur_threshold":100,
      "return_tagged_images":false
    }
    """
    try:
        data = request.get_json()
        if (not data or "target_faces" not in data or "source_images" not in data):
            return jsonify({"error": "target_faces와 source_images 필드가 필요합니다"}), 400

        targets     = data["target_faces"]
        sources     = data["source_images"]
        face_th     = data.get("face_distance_threshold", 0.6)
        yolo_opt    = data.get("yolo", {"conf": 0.4, "imgsz": 640})
        blur_th     = data.get("blur_threshold", 100.0)
        ret_b64     = data.get("return_tagged_images", False)

        temp_dir    = os.path.join(UPLOAD_FOLDER, "temp_face")
        tagged_dir  = os.path.join(UPLOAD_FOLDER, "tagged_results")
        os.makedirs(temp_dir, exist_ok=True)
        os.makedirs(tagged_dir, exist_ok=True)

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

        status = 400 if "error" in result else 200
        return jsonify(result), status
    except Exception as e:
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500

# 2) 유사도 그룹핑만
@app.route("/api/similar_grouping", methods=["POST"])
def api_similar_grouping():
    """
    Body:
    {
      "images":[{"url":"...","name":"a1"}, ...],
      "similarity_threshold":0.9
    }
    """
    try:
        data = request.get_json()
        if not data or "images" not in data:
            return jsonify({"error": "images 필드가 필요합니다"}), 400

        images   = data["images"]
        sim_th   = data.get("similarity_threshold", 0.9)
        temp_dir = os.path.join(UPLOAD_FOLDER, "temp_similar")
        os.makedirs(temp_dir, exist_ok=True)

        result = group_similar_images(images, similarity_threshold=sim_th, temp_dir=temp_dir)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"처리 중 오류 발생: {str(e)}"}), 500

@app.route("/", methods=["GET"])
def home():
    tmpl = os.path.join(BASE, "templates", "index.html")
    return render_template("index.html") if os.path.exists(tmpl) else "OK"

if __name__ == "__main__":
    # 프로덕션에선 debug=False 권장
    app.run(host="0.0.0.0", port=5000, debug=True)

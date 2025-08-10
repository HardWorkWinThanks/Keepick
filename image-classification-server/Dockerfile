# 1. 베이스 이미지 (Python 3.10 + slim)
FROM python:3.10-slim

# 2. 시스템 의존성 설치 (opencv, insightface 등이 필요로 함)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3. 작업 디렉토리 생성
WORKDIR /app

# 4. requirements.txt 복사 후 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 소스코드 복사
COPY . .

# 6. Flask 실행
CMD ["python", "app.py"]

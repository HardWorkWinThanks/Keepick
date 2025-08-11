# 1. base image
FROM node:22.17.0

# 2. working directory 설정
WORKDIR /src

# 3. package.json과 lock 파일 복사
COPY package*.json ./

# 4. 의존성 설치
RUN npm install

# 5. TypeScript 빌드
COPY . .
RUN npm run build

# 6. 포트 열기 (예: 8443)
EXPOSE 8443

# 7. 서버 실행
CMD ["node", "dist/app.js"]
# Keepick - AI 기반 사진 관리 및 공유 플랫폼

**D207 - 팀 열심히하겠습니다. 우승하겠습니다. 감사합니다. 팀**
<img width="1882" height="905" alt="스크린샷 2025-12-01 215520" src="https://github.com/user-attachments/assets/df73af26-63a3-4b99-bdbf-f6b4afa8f7a2" />

## 🎯 프로젝트 소개

Keepick은 AI 기반 사진 관리 및 공유 플랫폼으로, 다음과 같은 주요 기능을 제공합니다:

- 🤖 AI 기반 사진 분석 및 필터링
- 👥 그룹 갤러리 및 앨범 생성
- 💬 실시간 그룹 채팅
- 🏆 티어 배틀 시스템
- 📅 타임라인 앨범
- 🔐 소셜 로그인 (Google, Kakao, Naver)

## 👥 팀 구성

- **Backend**: 김하은, 권수현, 박재완
- **Mobile**: 최재웅
- **Frontend**: 주재현
- **AI**: 김연주

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: React, Tailwind CSS
- **State Management**: Redux Toolkit
- **Real-time Communication**: Socket.io
- **Video Conference**: MediaSoup

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Build Tool**: Gradle
- **Database**: MySQL 8.0
- **Cache**: Redis 7.2
- **Cloud**: AWS (S3, SQS)

### Infrastructure
- **Web Server**: Nginx 1.24
- **Container**: Docker
- **OS**: Ubuntu 22.04 LTS (운영), Windows 11 (개발)

## 📚 문서

### 📖 포팅 매뉴얼
📌 [포팅 매뉴얼 보기](./exec/porting-manual.md)

### 📝 개발 가이드
📌 [Commit Convention 보기](./docs/commit-convention.md)
📌 [Git Branch Strategy 보기](./docs/branch-strategy.md)

### 📋 Pull Request 템플릿
📌 [PR Template 보기](./.gitlab/merge_request_templates/pr-template.md)

## 🎬 시연 영상

프로젝트의 주요 기능 시연 영상은 [포팅 매뉴얼](./exec/porting-manual.md)의 시연 시나리오 섹션에서 확인할 수 있습니다.

## 🔧 빠른 시작

1. **프로젝트 클론**
   ```bash
   git clone [GitLab Repository URL]
   cd S13P11D207
   ```

2. **환경 설정**
   - [포팅 매뉴얼](./exec/porting-manual.md)의 환경 변수 설정 참조

3. **빌드 및 실행**
   ```bash
   # Backend 빌드
   cd backend
   ./gradlew clean build -x test
   
   # Frontend 빌드
   cd frontend
   npm install
   npm run build
   ```

## 📞 문의

- **프로젝트 담당자**: SSAFY S13P11D207 팀
- **기술 지원**: 프로젝트 이슈 트래커 활용

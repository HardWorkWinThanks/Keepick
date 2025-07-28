# Git Branch Strategy & Naming Convention

## 📁 브랜치 구조

```
master
│
├── backend
│   └── 백엔드 기능 개발 브랜치 기반
│
├── frontend
│   └── 프론트엔드 기능 개발 브랜치 기반
│
├── aos
│   └── AOS 기능 개발 브랜치 기반
│
├── ai
│   └── AI 기능 개발 브랜치 기반
│
└── be/feature/login-ui-make-123
    └── 단일 기능 개발 (JIRA 이슈 넘버)
```

---

## ✅ 브랜치 타입 및 목적

### 1. `master`
- ✅ 실제 배포가 이루어지는 브랜치
- 각 도메인 브랜치에서 병합됨
- 태그 생성: `v1.2.3` 등
- 프로덕션 환경 배포

### 2. `backend`
- ✅ 백엔드 통합 개발 브랜치
- 백엔드 관련 기능 브랜치는 여기로 PR 생성
- API 서버 배포 및 테스트

### 3. `frontend`
- ✅ 프론트엔드 통합 개발 브랜치
- 웹 프론트엔드 관련 기능 브랜치는 여기로 PR 생성
- 웹 애플리케이션 배포 및 테스트

### 4. `aos`
- ✅ AOS 통합 개발 브랜치
- AOS 앱 관련 기능 브랜치는 여기로 PR 생성
- AOS 빌드 및 테스트

### 5. `ai`
- ✅ AI 모델 통합 개발 브랜치
- AI/ML 관련 기능 브랜치는 여기로 PR 생성
- 모델 학습 및 추론 서버 테스트

### 6. `{도메인}/feature/{기능이름}-{이슈넘버}`
- ✅ 기능 단위 작업 브랜치
- 해당 도메인 브랜치에서 분기
- 완료 후 PR → 해당 도메인 브랜치
- 병합 후 브랜치 삭제

예시:
```
be/feature/login-api-make-123 → backend
fe/feature/login-ui-make-123 → frontend
aos/feature/camera-feature-make-137 → aos
ai/feature/recommendation-model-make-142 → ai
```

> ⚠️ 이슈 키는 JIRA 이슈 넘버를 **kebab-case**로 연결: `make-123`

---

## ✅ 브랜치 네이밍 규칙 요약

| 브랜치 타입 | 형식                                          | 설명               |
|--------------|-----------------------------------------------|--------------------|
| master       | `master`                                      | 실제 배포 브랜치    |
| backend      | `backend`                                     | 백엔드 통합 개발    |
| frontend     | `frontend`                                    | 프론트엔드 통합 개발 |
| aos          | `aos`                                         | AOS 통합 개발      |
| ai           | `ai`                                          | AI 통합 개발       |
| feature      | `be/feature/{기능이름}-make-123`              | 백엔드 기능 개발    |
| feature      | `fe/feature/{기능이름}-make-123`              | 프론트엔드 기능 개발 |
| feature      | `aos/feature/{기능이름}-make-123`             | AOS 기능 개발      |
| feature      | `ai/feature/{기능이름}-make-123`              | AI 기능 개발       |

---

## 📋 Pull Request 네이밍 규칙

### 형식: `[도메인][이슈키] 타입: 작업 내용`

예시:
```
[BE][S13P11D207-123] Feat: 스프링부트 프로젝트 초기 설정 및 Dockerfile 작성
[FE][S13P11D207-124] Fix: 로그인 페이지 반응형 레이아웃 수정
[AOS][S13P11D207-125] Perf: 이미지 로딩 최적화 및 캐싱 구현
[AI][S13P11D207-126] Feat: 추천 알고리즘 모델 학습 파이프라인 구축
```

### 도메인 약어:
- `[BE]` - Backend
- `[FE]` - Frontend  
- `[AOS]` - AOS (Android Operating System)
- `[AI]` - AI/ML

---

## 🔧 CI/CD 연동 요약

| 브랜치              | 이벤트       | 작업 예시                                      |
|--------------------|--------------|------------------------------------------------|
| `*/feature/*`      | PR 생성 시    | Lint + Unit Test                              |
| `backend`          | Push 시       | API Test + Backend 서버 배포                  |
| `frontend`         | Push 시       | Build Test + Frontend 배포                    |
| `aos`              | Push 시       | AOS Build + APK 생성                          |
| `ai`               | Push 시       | Model Test + AI 서버 배포                     |
| `master`           | Push 시       | 전체 통합 배포 + Production 환경 업데이트       |

---

## 📝 기타 규칙

- 각 도메인별 브랜치에서 독립적으로 개발 진행
- **브랜치명과 커밋 메시지 모두 동일한 JIRA 이슈 키 포맷** 사용: `make-123` (kebab-case)
- **Pull Request 제목은 도메인과 이슈 키를 명시**: `[BE][S13P11D207-123] Feat: 기능 설명`
- 브랜치 병합 시 **Pull Request 기반 코드 리뷰 필수**
- 병합 후 `*/feature/*` 브랜치는 반드시 삭제
- 도메인 간 통합이 필요한 경우 해당 도메인 브랜치들을 `master`로 병합

---

## 🔚 예시 커밋 메시지

```
Feat: 로그인 API 구현 [MAKE-123]
Feat: 로그인 UI 구현 [MAKE-123]
Fix: 사진 업로드 예외 처리 [MAKE-137]
Perf: 추천 모델 성능 개선 [MAKE-142]
```

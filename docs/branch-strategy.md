# Git Branch Strategy & Naming Convention

## 📁 브랜치 구조

```
main (or master)
│
├── release/1.1.0
│   └── QA 및 배포 준비
│
├── develop
│   └── 기능 개발 브랜치 기반
│
└── feature/login-ui-make-123
    └── 단일 기능 개발 (이슈 기반)
```

---

## ✅ 브랜치 타입 및 목적

### 1. `main` (또는 `master`)
- ✅ 실제 배포가 이루어지는 브랜치
- `release` 브랜치에서 병합됨
- 태그 생성: `v1.2.3` 등
- 앱 스토어 업로드 자동화 연결

### 2. `release/x.y.z`
- ✅ QA 및 릴리즈 준비 브랜치
- `develop`에서 분기
- 버그 수정, 안정화, 최종 테스트 등 수행
- 최종 병합: `main`, `develop`

### 3. `develop`
- ✅ 통합 개발 브랜치
- 모든 기능 브랜치는 여기로 PR 생성
- Snapshot 빌드 및 1차 테스터 배포

### 4. `feature/{기능이름}-make-123`
- ✅ 기능 단위 작업 브랜치
- `develop`에서 분기
- 완료 후 PR → `develop`
- 병합 후 브랜치 삭제

예시:
```
feature/login-ui-make-123
feature/photo-upload-make-137
```

> ⚠️ 이슈 키는 커밋 메시지와 동일하게 **postfix로 kebab-case로 연결**

---

## ✅ 브랜치 네이밍 규칙 요약

| 브랜치 타입 | 형식                                | 설명               |
|--------------|-------------------------------------|--------------------|
| main/master  | `main` 또는 `master`                | 실제 배포 브랜치    |
| develop      | `develop`                           | 통합 개발 브랜치    |
| release      | `release/x.y.z`                     | QA 및 안정화       |
| feature      | `feature/{기능이름}-make-123`       | 기능 개발 브랜치    |

---

## 🔧 CI/CD 연동 요약

| 브랜치       | 이벤트       | 작업 예시                                      |
|--------------|--------------|------------------------------------------------|
| `feature/*`  | PR 생성 시    | Lint + Unit Test (`./gradlew test`)           |
| `develop`    | Push 시       | UI Test + 1차 테스터 배포 (Firebase 등)       |
| `release/*`  | Push 시       | Release 빌드 + 2차 테스터 배포               |
| `main`       | Push 시       | AAB 생성 + 스토어 업로드 자동화 연결          |

---

## 📝 기타 규칙

- `hotfix` 브랜치는 현재 전략에서는 **사용하지 않음**
- **브랜치명과 커밋 메시지 모두 동일한 이슈 키 포맷** 사용: `make-123`
- 브랜치 병합 시 **Pull Request 기반 코드 리뷰 필수**
- 병합 후 `feature/*` 브랜치는 반드시 삭제

---

## 🔚 예시 커밋 메시지

```
Feat: 로그인 UI 구현 [MAKE-123]
Fix: 사진 업로드 예외 처리 [MAKE-137]
```

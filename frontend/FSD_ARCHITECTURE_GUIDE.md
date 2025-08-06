● # FSD 아키텍처 가이드 - Keepick 프로젝트

## 📋 레이어 구조

app/ # Next.js 라우팅만
↓
pages/ # 페이지 조합 (위젯들을 조합해서 완전한 페이지)
↓
widgets/ # UI 블록 (여러 features를 조합한 복합 컴포넌트)
↓
features/ # 비즈니스 기능 (독립적인 기능 단위)
↓
entities/ # 비즈니스 엔티티 (데이터 모델)
↓
shared/ # 공통 인프라 (API, 유틸, 기본 UI)

## 🎯 각 레이어 역할

### **app/** - 라우팅

- Next.js 페이지 파일만
- pages/ 레이어만 import
- 비즈니스 로직 금지

```typescript
// app/group/[groupName]/page.tsx
import { GroupPage } from "@/pages/GroupPage";

export default function Page({ params }) {
  return <GroupPage params={params} />;
}

pages/ - 페이지 조합

- 위젯들을 조합해서 완전한 페이지 구성
- 페이지 레벨 상태 관리
- URL 상태와 동기화

// pages/GroupPage/ui/GroupPage.tsx
export function GroupPage() {
  return (
    <LayoutWidget>
      <GroupSidebarWidget />
      <AlbumListWidget />
      <AlbumViewsWidget />
    </LayoutWidget>
  );
}

widgets/ - UI 블록

- 여러 features를 조합한 복합 UI
- 다른 위젯과 독립적
- 페이지 간 재사용 가능

현재 위젯들:
- widgets/album-views/ - 앨범 뷰들 (티어, 타임라인, 하이라이트)
- widgets/layout/ - 공통 레이아웃
- widgets/group-sidebar/ - 그룹 사이드바
- widgets/album-list/ - 앨범 목록

features/ - 비즈니스 기능

- 독립적인 기능 단위
- 다른 features 간 import 금지
- 단일 책임 원칙

현재 features:
- features/album-management/ - 앨범 공통 기능
- features/tier-battle/ - 티어 배틀 시스템
- features/timeline-editing/ - 타임라인 편집
- features/emotion-categorization/ - 감정 카테고리
- features/photo-viewing/ - 사진 보기
- features/photo-drag-drop/ - 드래그 앤 드롭

entities/ - 데이터 모델

- 순수 비즈니스 데이터
- UI 컴포넌트 없음

현재 entities:
- entities/photo/ - 사진 데이터 모델
- entities/album/ - 앨범 관련 타입들
- entities/user/ - 유저 데이터

shared/ - 공통 인프라

- 모든 레이어에서 사용
- 도메인 로직 없음
- shared/ui/shadcn/ - 기본 UI 컴포넌트

🚫 금지사항

- ❌ app/에서 features/, widgets/ 직접 import
- ❌ widgets/ 간 서로 import
- ❌ features/ 간 서로 import
- ❌ 하위 레이어가 상위 레이어 import
- ❌ app/에 비즈니스 로직 작성

✅ 올바른 예시

Import 방향

// ✅ 올바른 import
// widgets/album-views/ui/TierAlbumWidget.tsx
import { useTierBattle } from "@/features/tier-battle";
import { Photo } from "@/entities/photo";
import { Button } from "@/shared/ui/shadcn/button";

// pages/GroupPage/ui/GroupPage.tsx
import { AlbumViewsWidget } from "@/widgets/album-views";

컴포넌트 분해

// ❌ 나쁜 예: 거대한 컴포넌트
components/TierAlbumView.tsx (467줄)

// ✅ 좋은 예: 기능별 분해
features/album-management/     # 공통 앨범 기능
features/tier-battle/          # 티어 배틀 전용
widgets/album-views/           # UI 조합

🔧 개발 시 체크리스트

1. 새 기능 개발 시:
  - 어떤 레이어에 속하는지 먼저 판단
  - 다른 기능과 독립적인지 확인
  - Import 방향이 올바른지 검증
2. 컴포넌트가 커질 때:
  - 비즈니스 로직별로 features 분해
  - UI 조합은 widgets에서 처리
  - 상태 관리 레벨 적절히 배치
3. 코드 리뷰 시:
  - Import 의존성 방향 확인
  - 레이어별 책임 준수 여부 점검
  - 재사용 가능한 구조인지 검토
```

# Keepick 프론트엔드 프로젝트 분석

## 1. 프로젝트 개요

이 문서는 Keepick 프론트엔드 애플리케이션의 아키텍처, 핵심 비즈니스 로직, 데이터 흐름을 분석하고 설명합니다. 이 프로젝트는 Next.js(App Router) 기반의 TypeScript 애플리케이션으로, 그룹 기반의 소셜 사진 공유 및 앨범 관리 기능을 제공합니다.

### 1.1. 주요 기술 스택

- **프레임워크**: Next.js 13+ (App Router)
- **언어**: TypeScript
- **상태 관리**:
  - **서버 상태**: TanStack Query (React Query) - API 데이터 캐싱, 동기화
  - **전역 클라이언트 상태**: Redux Toolkit - 인증, 사용자 정보 등
- **스타일링**: Tailwind CSS, shadcn/ui
- **실시간 통신**: WebRTC, Mediasoup, Socket.IO (추정)
- **API 통신**: Axios 기반의 커스텀 클라이언트 (`shared/api/http`)

## 2. 아키텍처: Feature-Sliced Design (FSD)

이 프로젝트는 코드의 모듈성, 재사용성, 유지보수성을 극대화하기 위해 **FSD(Feature-Sliced Design)** 아키텍처를 채택했습니다. `FSD_ARCHITECTURE_GUIDE.md` 파일이 존재하며, `src` 디렉토리 구조가 FSD의 레이어와 슬라이스 개념을 명확히 따르고 있습니다.

### 2.1. FSD 레이어 구조

- **`src/app` (App Layer)**
  - **역할**: 애플리케이션의 진입점. 전역 설정, 라우팅, 레이아웃, 프로바이더(Provider)를 관리합니다.
  - **주요 파일**:
    - `layout.tsx`: 모든 페이지에 적용되는 최상위 레이아웃.
    - `page.tsx`: 특정 라우트의 UI 컴포넌트.
    - `providers/`: React Query, Redux 등 전역 상태 관리 라이브러리의 Provider를 설정하는 곳.

- **`src/widgets` (Widgets Layer)**
  - **역할**: 여러 `features`와 `entities`를 조합하여 만드는 독립적인 UI 블록. 비즈니스 로직을 직접 포함하지 않고, 하위 레이어의 기능을 조립하여 의미 있는 UI 단위를 구성합니다.
  - **예시**: `Header`, `Footer`, `VideoConferencePanel`, `TierAlbumView` 등.

- **`src/features` (Features Layer)**
  - **역할**: 사용자와 직접 상호작용하는 기능 단위. 각 기능은 특정 비즈니스 시나리오를 해결합니다.
  - **구조**: 각 기능은 `api`, `model`(상태 및 로직), `ui`(컴포넌트) 등으로 구성됩니다.
  - **예시**: `auth`(인증), `tier-battle`(티어 배틀), `album-management`(앨범 관리), `timeline-editing`(타임라인 편집).

- **`src/entities` (Entities Layer)**
  - **역할**: 핵심 비즈니스 모델(데이터)과 관련된 코드. 데이터의 구조(type), 상태 관리 로직(slice), 관련 UI 컴포넌트를 포함합니다.
  - **예시**: `user`, `photo`, `album`.

- **`src/shared` (Shared Layer)**
  - **역할**: 모든 레이어에서 재사용될 수 있는 가장 작은 단위의 코드. 특정 비즈니스 로직에 종속되지 않습니다.
  - **예시**: `api/http`(API 클라이언트), `ui/shadcn`(UI 라이브러리), `lib/utils`(유틸리티 함수), `assets`(아이콘).

## 3. 핵심 비즈니스 로직 및 기능

### 3.1. 사용자 인증 (Authentication)

- **담당**: `src/features/auth`, `src/entities/user`
- **기능**: 소셜 로그인(카카오, 네이버, 구글), 로그아웃, 인증 상태 유지.
- **로직 흐름**:
  1.  `handleSocialLogin.ts`: 사용자가 로그인 버튼 클릭 시, 백엔드의 소셜 로그인 URL로 리디렉션.
  2.  백엔드에서 인증 후, 프론트엔드의 `/login/oauth-redirect` 경로로 리디렉션되며, URL 파라미터로 토큰 전달.
  3.  `OAuthHandler.ts` 및 `useOAuthCallback.ts`: URL에서 토큰을 파싱하여 `localStorage`에 저장하고, Redux 스토어(`authSlice`, `userSlice`) 상태 업데이트.
  4.  `AuthInitializer.tsx`: 앱 로드 시 `localStorage`의 토큰을 확인하여 자동으로 로그인 상태를 복원하고, 보호된 경로 접근 제어.
  5.  `useLogout.ts`: 로그아웃 시 `localStorage`와 Redux 스토어의 모든 인증/사용자 정보를 초기화.

### 3.2. 앨범 관리 및 사진 공유

- **담당**: `src/features/album-management`, `src/features/photo-drag-drop`, `src/entities/album`, `src/entities/photo`
- **기능**: 그룹 내에서 다양한 형태의 앨범(타임라인, 티어 배틀)을 생성하고, 사진을 드래그 앤 드롭으로 관리.
- **주요 로직**:
  - `useAlbumStorage.ts`: 앨범 데이터를 `localStorage`에 저장하고 불러오는 로직. (현재는 임시 저장, 추후 API 연동 필요)
  - `DraggablePhotoGrid.tsx` / `PhotoDropZone.tsx`: 사진을 드래그하고 특정 영역에 드롭하는 재사용 가능한 UI 컴포넌트.

### 3.3. 티어 배틀 (Tier Battle)

- **담당**: `src/features/tier-battle`
- **기능**: 사진들을 S, A, B, C, D 등급으로 분류하는 게이미피케이션 기능. '정밀 배틀' 모드를 통해 사진 간의 1:1 비교로 순위를 결정.
- **주요 로직**:
  - `useTierGrid.ts`: 티어 그리드의 기본적인 상태(티어별 사진 목록)와 드래그 앤 드롭 상호작용 관리.
  - `useTierBattle.ts`: '정밀 배틀' 모드의 상태(비교 대상, 현재 순서)와 승패 판정 로직 관리.

### 3.4. 타임라인 편집 (Timeline Editing)

- **담당**: `src/features/timeline-editing`
- **기능**: 시간 순서에 따라 이벤트(제목, 날짜, 장소, 설명)를 만들고, 각 이벤트에 사진을 배치하여 타임라인 앨범을 구성.
- **주요 로직**:
  - `useTimelineEdit.ts`: 타임라인 이벤트 목록을 관리하고, 이벤트 추가/수정, 사진 추가/제거, 드래그 앤 드롭 로직을 처리.
  - `useEmojiPicker.ts`: 각 이벤트의 대표 이모지를 선택하는 UI의 상태와 로직을 관리.

### 3.5. 실시간 통신 (WebRTC)

- **담당**: `src/widgets/video-conference`, `server.js`
- **기능**: 그룹 멤버 간의 다자간 영상 통화.
- **구조**: WebRTC 기반의 SFU(Selective Forwarding Unit) 아키텍처를 사용하며, **Mediasoup** 라이브러리를 활용. `server.js` 파일은 이 Mediasoup 통신을 위한 시그널링 서버 역할을 수행.

## 4. 데이터 흐름 및 상태 관리

- **서버 상태 (Server State)**: `TanStack Query`가 API 요청, 캐싱, 동기화를 담당. `useMutation`, `useQuery` 훅을 통해 API 데이터를 관리하며, 로딩 및 에러 상태를 선언적으로 처리.
- **전역 클라이언트 상태 (Global Client State)**: `Redux Toolkit`이 사용되며, 주로 세션 전체에서 유지되어야 하는 상태를 관리.
  - `authSlice`: 로그인 여부, Access/Refresh 토큰 등 인증 관련 상태.
  - `userSlice`: 로그인한 사용자의 프로필 정보.
- **로컬 상태 (Local/Component State)**: `useState`, `useReducer` 및 커스텀 훅을 통해 각 컴포넌트나 기능(feature)에 국한된 상태를 관리. (예: `useTierBattle`, `useTimelineEdit`)
- **영속성 (Persistence)**: `localStorage`가 사용자의 인증 토큰과 편집 중인 앨범 데이터의 임시 저장을 위해 활용됨.

## 5. 주요 파일 및 디렉토리 가이드

- `src/app/providers/Providers.tsx`: 모든 전역 Provider(Redux, React Query 등)를 조합하는 곳.
- `src/features/auth/model/AuthInitializer.tsx`: 앱의 인증 로직의 핵심. 페이지 접근 권한을 처리.
- `src/shared/api/http/index.ts`: `axios` 인스턴스를 생성하고, 요청/응답 인터셉터를 설정하는 중앙 API 클라이언트. (토큰 자동 갱신 로직 포함 가능성 높음)
- `src/entities/user/model/userSlice.ts`: 사용자 정보의 데이터 구조와 Redux 액션/리듀서를 정의.
- `src/features/tier-battle/model/useTierBattle.ts`: 티어 배틀의 핵심 비즈니스 로직을 담고 있는 커스텀 훅.
- `server.js`: Next.js와 별개로 실행되는 Mediasoup 시그널링 서버.

## 6. 결론

Keepick 프론트엔드 프로젝트는 FSD 아키텍처를 성공적으로 적용하여 매우 체계적이고 확장 가능하게 설계되었습니다. 각 기능이 명확하게 분리되어 있어 새로운 기능을 추가하거나 기존 기능을 수정하기 용이합니다. 상태 관리는 서버와 클라이언트의 역할을 명확히 구분하여 효율적으로 데이터를 처리하고 있습니다. 이 문서는 새로운 AI 에이전트나 개발자가 프로젝트를 이해하고 기여하는 데 훌륭한 출발점이 될 것입니다.

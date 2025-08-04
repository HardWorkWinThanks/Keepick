# 소셜로그인 Frontend 연동 구현 가이드

## 🎯 목표
소셜로그인 성공 후 헤더의 프로필 사진과 닉네임이 실제 로그인한 사용자 정보로 표시되도록 구현

## 📋 현재 상황 분석

### Backend 상태 ✅
- **완전 구현됨**: OAuth2, JWT 쿠키 인증, 사용자 정보 API 모두 준비
- **소셜 제공자**: Naver, Kakao, Google 지원
- **로그인 플로우**: `/api/oauth2/authorization/{provider}` → 콜백 → JWT 쿠키 → 리다이렉트

### Frontend 현재 상태 ❌
- **헤더**: 더미 데이터 하드코딩 (`header.tsx:32`)
- **Redux 상태**: 준비되어 있으나 사용되지 않음
- **API 연동**: 소셜로그인 후 사용자 정보 저장 로직 없음

## 🔧 구현해야 할 작업

### 1. 로그인 성공 후 사용자 정보 저장
**파일**: `frontend/src/features/auth/social-login/api/useAuthStatus.ts` (신규 생성)
```typescript
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setAuth } from '@/shared/store/features/auth/authSlice';
import { apiClient } from '@/shared/api/http';

export const useAuthStatus = () => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: ['auth-status'],
    queryFn: async () => {
      const response = await apiClient.get('/api/members/me');
      return response.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};
```

### 2. 앱 초기화 시 인증 상태 확인
**파일**: `frontend/src/shared/config/AuthInitializer.tsx` (수정 필요)
- 쿠키에 JWT 토큰이 있으면 `/api/members/me` 호출
- 응답 성공 시 Redux에 사용자 정보 저장

### 3. 헤더 컴포넌트 수정
**파일**: `frontend/src/components/layout/header.tsx` (수정 필요)
```typescript
// 현재 (삭제할 코드)
const user = { name: "wmwogus", imageUrl: "/jaewan1.jpg" };

// 변경될 코드
const user = useSelector((state: RootState) => state.auth.user);
const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
```

### 4. API 클라이언트 쿠키 자동 포함
**파일**: `frontend/src/shared/api/http/client.ts` (확인 필요)
- `withCredentials: true` 설정 확인
- JWT 쿠키가 자동으로 포함되는지 확인

### 5. 로그아웃 기능 구현
**파일**: `frontend/src/features/auth/social-login/api/useLogout.ts` (수정 필요)
- 백엔드 로그아웃 API 호출
- Redux 상태 초기화
- 쿠키 삭제

## 🏗️ Backend API 명세

### 현재 사용자 정보 조회
```http
GET /api/members/me
Authorization: Cookie (자동 포함)

Response:
{
  "success": true,
  "data": {
    "memberId": 1,
    "nickname": "사용자닉네임",
    "profileUrl": "https://프로필이미지URL",
    "email": "user@example.com",
    "provider": "kakao"
  }
}
```

### 소셜 로그인 시작
```http
GET /api/oauth2/authorization/{provider}
- provider: naver, kakao, google
- 자동으로 소셜 로그인 페이지로 리다이렉트
```

### 로그인 성공 후 플로우
1. 백엔드에서 JWT 쿠키 설정
2. `http://localhost:3000/`로 리다이렉트
3. Frontend에서 쿠키 확인 후 사용자 정보 조회

## 📁 관련 파일 위치

### Backend (완료)
- `SecurityConfig.java` - OAuth2 설정
- `CustomOAuth2MemberService.java` - 사용자 정보 처리
- `CustomSuccessHandler.java` - 로그인 성공 처리
- `MemberController.java` - 사용자 정보 API
- `Member.java` - 사용자 엔티티

### Frontend (작업 필요)
- `src/components/layout/header.tsx` - 헤더 컴포넌트 (더미 데이터 제거)
- `src/shared/store/features/auth/authSlice.ts` - Redux 상태 관리
- `src/shared/config/AuthInitializer.tsx` - 앱 초기화 시 인증 확인
- `src/features/auth/social-login/api/` - 인증 관련 API 훅들
- `src/shared/api/http/client.ts` - HTTP 클라이언트 설정

## 🔄 구현 순서

1. **API 클라이언트 쿠키 설정 확인**
2. **AuthInitializer에서 초기 인증 상태 확인 로직 추가**
3. **header.tsx에서 더미 데이터를 Redux 상태로 교체**
4. **로그아웃 기능 구현**
5. **테스트 및 디버깅**

## 🧪 테스트 시나리오

1. **로그인 전**: 헤더에 기본 UI 표시
2. **소셜로그인 클릭**: 소셜 로그인 페이지로 이동
3. **로그인 성공**: 메인 페이지로 리다이렉트 + 헤더에 사용자 정보 표시
4. **페이지 새로고침**: 로그인 상태 유지
5. **로그아웃**: 상태 초기화 + 쿠키 삭제

## 🐛 주의사항

- **HTTPS 필요**: 소셜로그인과 Secure 쿠키 때문에 개발 서버도 HTTPS 사용
- **CORS 설정**: Backend에서 Frontend URL을 허용하도록 설정됨
- **쿠키 설정**: `HttpOnly=false`로 설정되어 JS에서 접근 가능
- **타입 매핑**: Backend `profileUrl` → Frontend `profileImage`

## 🔗 타입 정의 매핑

### Backend Response → Frontend Type
```typescript
// Backend MemberInfoResponse
{
  memberId: Long,
  nickname: string,
  profileUrl: string,  // ← 이 필드명
  email: string,
  provider: string
}

// Frontend AuthUser
{
  id: number,           // ← memberId를 id로 매핑
  name: string,         // ← nickname을 name으로 매핑
  email: string,
  profileImage: string  // ← profileUrl을 profileImage로 매핑
}
```
# 그룹챗 화상통화 사이드바 통합 완료 

## ✅ 완료된 작업

### 1. 새로운 컴포넌트들
- `GroupChatVideoSection.tsx` - 그룹챗 비디오 UI (2x3 그리드, 접기/펼치기)
- `AlbumInfoEditModal.tsx` - 앨범정보 수정 모달 (기존 사이드바 → 모달로 분리)
- `GroupSelectorSection.tsx` - 그룹 선택/전환 섹션
- `GroupInfoSection.tsx` - 그룹정보 표시/편집 섹션  
- `GalleryPhotosSection.tsx` - 갤러리 사진 관리 섹션

### 2. AppSidebar 구조 개편
- **상단 고정**: 그룹챗 비디오 (항상 표시)
- **하단 동적**: 페이지별 다른 컨텐츠
- **친구 기능 제거**: 프로필 페이지로 이동 예정

### 3. 페이지별 사이드바 구성
- **그룹스페이스**: 그룹챗 + 그룹선택/정보
- **타임라인/티어앨범**: 그룹챗 + 갤러리사진
- **티어뷰/하이라이트**: 그룹챗만

### 4. 모달 연동
- TimelineAlbumPage에 앨범정보 수정 모달 추가
- 헤더의 "앨범 정보" 버튼으로 호출

## 🔧 사용 방법

### AppLayout에서 사이드바 설정

```jsx
// 그룹스페이스 - 기본 컨텐츠 사용
<AppLayout 
  sidebarConfig={{
    showGroupChat: true,
    useDefaultContent: true,
    currentGroup: currentGroup
  }}
/>

// 앨범페이지 - 갤러리 섹션 사용  
<AppLayout 
  sidebarConfig={{
    showGroupChat: true,
    dynamicContent: (
      <GalleryPhotosSection 
        availablePhotos={photos}
        onAddPhotos={handleAdd}
        onDeletePhotos={handleDelete}
        // ... 기타 props
      />
    )
  }}
/>

// 티어뷰 - 그룹챗만
<AppLayout 
  sidebarConfig={{
    showGroupChat: true
    // dynamicContent 없음
  }}
/>
```

## 📁 파일 변경사항

### 새로 생성된 파일
- `src/widgets/layout/ui/GroupChatVideoSection.tsx`
- `src/shared/ui/modal/AlbumInfoEditModal.tsx`
- `src/widgets/layout/ui/GroupSelectorSection.tsx`
- `src/widgets/layout/ui/GroupInfoSection.tsx`
- `src/widgets/layout/ui/GalleryPhotosSection.tsx`

### 수정된 파일
- `src/widgets/layout/ui/AppSidebar.tsx` - 상하 구역 분리, 친구 기능 제거
- `src/widgets/layout/ui/AppLayout.tsx` - dynamicContent 지원 추가
- `src/features/timeline-album/ui/TimelineAlbumPage.tsx` - 모달 연동

### 레거시 파일 (보존)
- `src/shared/ui/composite/AlbumEditingSidebar.tsx` - 주석으로 보존

## 🎯 향후 작업 필요사항

1. **실제 화상회의 기능 연동**
   - GroupChatVideoSection의 TODO 주석 구현
   - 실제 participants 데이터 연결
   - 컨트롤 버튼 기능 구현

2. **다른 앨범 페이지 적용**
   - TierAlbumPage에도 동일한 모달 연동
   - HightlightAlbumPage 사이드바 적용

3. **그룹스페이스 사이드바 적용**
   - useDefaultContent: true로 설정

4. **최종 정리**
   - AlbumEditingSidebar 사용처 모두 제거
   - Import 경로 정리

## ✅ 빌드 테스트 완료
- Next.js 빌드 성공 확인
- 타입 에러 모두 수정 완료
- 정적 페이지 생성 정상 작동
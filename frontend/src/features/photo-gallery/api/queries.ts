import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getGroupBlurredPhotos, getGroupSimilarPhotos, getGroupOverview, getGroupPhotoTags, getFilteredPhotos, convertToGalleryPhoto } from './galleryPhotosApi'

/**
 * 흐린사진 무한 스크롤 쿼리 훅
 */
export const useBlurredPhotos = (groupId: string, viewMode: string) => {
  return useInfiniteQuery({
    queryKey: ['blurred-photos', groupId],
    queryFn: ({ pageParam = 0 }) => 
      getGroupBlurredPhotos(parseInt(groupId), pageParam, 20),
    getNextPageParam: (lastPage) => 
      lastPage.pageInfo.hasNext ? lastPage.pageInfo.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    enabled: !!groupId, // 항상 실행하여 개수 정보 확보
  })
}

/**
 * 유사사진 클러스터 무한 스크롤 쿼리 훅
 */
export const useSimilarPhotos = (groupId: string, viewMode: string) => {
  return useInfiniteQuery({
    queryKey: ['similar-photos', groupId],
    queryFn: ({ pageParam = 0 }) => 
      getGroupSimilarPhotos(parseInt(groupId), pageParam, 20),
    getNextPageParam: (lastPage) => 
      lastPage.pageInfo.hasNext ? lastPage.pageInfo.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    enabled: !!groupId && viewMode === 'similar', // 유사사진 탭 활성화시에만 실행 (수동 분석)
  })
}

/**
 * 흐린사진 데이터를 플래튼된 갤러리 형식으로 변환
 */
export const useBlurredPhotosFlat = (groupId: string, viewMode: string) => {
  const query = useBlurredPhotos(groupId, viewMode)
  
  const photos = query.data?.pages.flatMap(page => 
    page.list.map(convertToGalleryPhoto)
  ) || []
  
  return {
    ...query,
    photos, // 변환된 갤러리 사진 배열
  }
}

/**
 * 유사사진 클러스터 데이터를 플래튼된 형식으로 변환
 */
export const useSimilarPhotosFlat = (groupId: string, viewMode: string) => {
  const query = useSimilarPhotos(groupId, viewMode)
  
  const clusters = query.data?.pages.flatMap(page => 
    page.list
  ) || []
  
  return {
    ...query,
    clusters, // 클러스터 배열
  }
}

/**
 * 전체사진 무한 스크롤 쿼리 훅
 */
export const useAllPhotos = (groupId: string, viewMode: string) => {
  return useInfiniteQuery({
    queryKey: ['all-photos', groupId],
    queryFn: ({ pageParam = 20 }) => 
      getGroupOverview(parseInt(groupId), pageParam).then(response => ({
        list: response.allPhotos.list,
        pageInfo: response.allPhotos.pageInfo,
      })),
    getNextPageParam: (lastPage) => {
      const currentSize = lastPage.pageInfo.size
      const hasNext = lastPage.pageInfo.hasNext
      return hasNext ? currentSize + 20 : undefined
    },
    initialPageParam: 20,
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    enabled: !!groupId, // groupId가 있으면 항상 실행 (개수 정보 필요)
    // 중복 데이터 제거를 위한 select 함수
    select: (data) => ({
      ...data,
      pages: data.pages.map((page, pageIndex) => ({
        ...page,
        list: pageIndex === 0 
          ? page.list // 첫 번째 페이지는 그대로
          : page.list.slice(data.pages.slice(0, pageIndex).reduce((acc, p) => acc + p.list.length, 0)) // 이전 페이지 데이터 제외
      }))
    })
  })
}

/**
 * 전체사진 데이터를 플래튼된 갤러리 형식으로 변환
 */
export const useAllPhotosFlat = (groupId: string, viewMode: string) => {
  const query = useAllPhotos(groupId, viewMode)
  
  // 중복 제거를 위해 Map 사용
  const photosMap = new Map()
  query.data?.pages.forEach(page => {
    page.list.forEach(photo => {
      if (!photosMap.has(photo.photoId)) {
        photosMap.set(photo.photoId, convertToGalleryPhoto(photo))
      }
    })
  })
  
  const photos = Array.from(photosMap.values())
  
  return {
    ...query,
    photos, // 중복 제거된 갤러리 사진 배열
  }
}

/**
 * 전체 태그 조회 쿼리 훅
 */
export const useAllTags = (groupId: string) => {
  return useQuery({
    queryKey: ['all-tags', groupId],
    queryFn: () => getGroupPhotoTags(parseInt(groupId)),
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    enabled: !!groupId, // groupId가 있을 때만 실행
  })
}

/**
 * 필터링된 사진 무한 스크롤 쿼리 훅
 */
export const useFilteredPhotos = (groupId: string, selectedTags: string[]) => {
  // 디버깅: 쿼리 실행 조건 확인
  console.log('🔍 useFilteredPhotos 호출:', {
    groupId,
    selectedTags,
    queryKey: ['filtered-photos', groupId, selectedTags],
    enabled: !!groupId && selectedTags.length > 0
  })
  
  return useInfiniteQuery({
    queryKey: ['filtered-photos', groupId, selectedTags],
    queryFn: ({ pageParam = 0 }) => {
      console.log('🔄 필터링 API 호출:', {
        groupId: parseInt(groupId),
        tags: selectedTags,
        page: pageParam,
        size: 20
      })
      return getFilteredPhotos(parseInt(groupId), {
        tags: selectedTags,
        page: pageParam,
        size: 20
      })
    },
    getNextPageParam: (lastPage) => 
      lastPage.pageInfo.hasNext ? lastPage.pageInfo.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2분 캐싱 (필터링 결과는 자주 변경될 수 있음)
    enabled: !!groupId, // groupId가 있을 때 항상 실행 (태그가 없으면 전체 조회)
  })
}

/**
 * 필터링된 사진 데이터를 플래튼된 갤러리 형식으로 변환
 */
export const useFilteredPhotosFlat = (groupId: string, selectedTags: string[]) => {
  const query = useFilteredPhotos(groupId, selectedTags)
  
  // 중복 제거를 위해 Map 사용
  const photosMap = new Map()
  query.data?.pages.forEach(page => {
    page.list.forEach(photo => {
      if (!photosMap.has(photo.photoId)) {
        photosMap.set(photo.photoId, convertToGalleryPhoto(photo))
      }
    })
  })
  
  const photos = Array.from(photosMap.values())
  
  return {
    ...query,
    photos, // 필터링된 갤러리 사진 배열
  }
}
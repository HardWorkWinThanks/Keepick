import { useInfiniteQuery } from '@tanstack/react-query'
import { getGroupBlurredPhotos, getGroupSimilarPhotos, convertToGalleryPhoto } from './galleryPhotosApi'

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
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    enabled: !!groupId && viewMode === 'blurred', // 흐린사진 모드일 때만 실행
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
    staleTime: 5 * 60 * 1000, // 5분 캐싱
    enabled: !!groupId && viewMode === 'similar', // 유사사진 모드일 때만 실행
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
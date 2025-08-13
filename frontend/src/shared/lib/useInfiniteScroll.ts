import { useEffect, useCallback } from 'react'

interface UseInfiniteScrollProps {
  hasNextPage?: boolean
  fetchNextPage: () => void
  isFetching?: boolean
  threshold?: number // 스크롤 감지 임계값 (px)
}

/**
 * 무한 스크롤 훅
 * 스크롤이 하단 근처에 도달하면 자동으로 다음 페이지를 로드합니다.
 */
export const useInfiniteScroll = ({
  hasNextPage = false,
  fetchNextPage,
  isFetching = false,
  threshold = 200
}: UseInfiniteScrollProps) => {
  const handleScroll = useCallback(() => {
    // 이미 로딩 중이거나 더 이상 페이지가 없으면 스킵
    if (isFetching || !hasNextPage) return

    // 스크롤이 하단 임계값에 도달했는지 확인
    const isNearBottom = 
      window.innerHeight + document.documentElement.scrollTop >= 
      document.documentElement.offsetHeight - threshold

    if (isNearBottom) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, isFetching, threshold])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
}
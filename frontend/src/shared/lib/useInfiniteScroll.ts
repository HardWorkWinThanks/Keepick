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
    const currentScroll = window.innerHeight + document.documentElement.scrollTop
    const documentHeight = document.documentElement.offsetHeight
    const distanceFromBottom = documentHeight - currentScroll
    
    console.log(`📏 스크롤 디버깅: 하단까지 거리=${distanceFromBottom}px, 임계값=${threshold}px`)
    
    const isNearBottom = distanceFromBottom <= threshold

    if (isNearBottom) {
      console.log(`🚀 무한스크롤 트리거! (거리: ${distanceFromBottom}px <= 임계값: ${threshold}px)`)
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, isFetching, threshold])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
}
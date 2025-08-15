"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TimelineAlbum, TimelineSection } from "@/entities/album"
import { getTimelineAlbum, updateTimelineAlbum, UpdateTimelineAlbumRequest } from "../api/timelineAlbumApi"

export function useTimelineAlbum(groupId: string, albumId: string) {
  const queryClient = useQueryClient()

  // 타임라인 앨범 조회
  const {
    data: timelineAlbum,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['timeline-album', groupId, albumId],
    queryFn: () => getTimelineAlbum(parseInt(groupId), parseInt(albumId)),
  })

  // 타임라인 앨범 수정
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateTimelineAlbumRequest) => {
      return updateTimelineAlbum(parseInt(groupId), parseInt(albumId), data)
    },
    onSuccess: () => {
      // 수정 성공시 캐시 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({
        queryKey: ['timeline-album', groupId, albumId]
      })
      
      // 그룹스페이스 앨범 목록도 무효화 - 모든 페이지 포함
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[]
          return queryKey[0] === 'timelineAlbums' && queryKey[1] === groupId
        }
      })
    },
  })

  return {
    timelineAlbum,
    timelineSections: timelineAlbum?.sections || [],
    loading,
    error,
    updateTimelineAlbum: updateMutation.mutate,
    updateTimelineAlbumAsync: updateMutation.mutateAsync, // 비동기 완료를 기다리는 메서드 추가
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    refetchTimeline: refetch,
    // 사전 로딩을 위한 함수
    prefetchTimeline: async (albumId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['timeline-album', groupId, albumId],
        queryFn: () => getTimelineAlbum(parseInt(groupId), parseInt(albumId)),
      })
    }
  }
}
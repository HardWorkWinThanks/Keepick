import { useQuery } from "@tanstack/react-query"
import { useFriends } from "./useFriends"

/**
 * 친구 신청 개수를 실시간으로 조회하는 커스텀 훅
 * 받은 친구신청과 보낸 친구신청의 개수를 각각 반환합니다.
 */
export function useFriendRequestCount() {
  const { useFriendsList } = useFriends()

  // 받은 친구 신청 목록
  const { data: receivedRequests = [] } = useFriendsList("RECEIVED")
  
  // 보낸 친구 신청 목록  
  const { data: sentRequests = [] } = useFriendsList("SENT")

  // 개수 계산
  const receivedCount = receivedRequests.length
  const sentCount = sentRequests.length
  const totalCount = receivedCount + sentCount

  return {
    receivedCount,   // 받은 친구신청 수
    sentCount,       // 보낸 친구신청 수  
    totalCount,      // 전체 친구신청 수
    hasRequests: totalCount > 0  // 신청이 있는지 여부
  }
}
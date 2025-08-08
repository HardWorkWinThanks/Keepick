'use client';

/**
 * 메인 랜딩페이지의 친구 시스템을 Keepick API와 연결하는 훅
 * 현재는 스텁 구현, 추후 실제 API 연결 가능
 */
export const useMainFriends = () => {
  // 샘플 데이터
  const friends = [
    { id: 1, name: "김철수" },
    { id: 2, name: "이영희" },
    { id: 3, name: "박민수" },
    { id: 4, name: "정수진" },
    { id: 5, name: "최영호" },
    { id: 6, name: "한미영" },
    { id: 7, name: "조성민" },
    { id: 8, name: "윤지혜" },
  ];

  const receivedRequests = [
    { id: 1, name: "신동현", timestamp: "2시간 전" },
    { id: 2, name: "배수지", timestamp: "1일 전" },
  ];

  const sentRequests = [
    { id: 1, name: "강호동", timestamp: "3시간 전" },
    { id: 2, name: "유재석", timestamp: "2일 전" },
  ];

  // API 연결 스텁 - 실제 구현 시 여기에 API 호출 추가
  const sendFriendRequest = (userId: number) => {
    console.log(`친구 요청 보내기: ${userId}`);
    // TODO: 실제 API 호출로 교체
  };

  const acceptFriendRequest = (requestId: number) => {
    console.log(`친구 요청 승인: ${requestId}`);
    // TODO: 실제 API 호출로 교체
  };

  const rejectFriendRequest = (requestId: number) => {
    console.log(`친구 요청 거절: ${requestId}`);
    // TODO: 실제 API 호출로 교체
  };

  return {
    friends,
    receivedRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
};
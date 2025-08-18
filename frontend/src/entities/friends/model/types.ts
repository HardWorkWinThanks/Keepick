// entities/friends/model/types.ts

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED"
export type FriendStatus = "FRIEND" | "SENT" | "RECEIVED"

export interface Friend {
  friendshipId: number
  friendId: number
  name: string
  nickname: string
  profileUrl: string
  friendshipStatus: FriendshipStatus
  friendStatus: FriendStatus
  requestedAt: string
  respondedAt?: string
}

export interface SearchedUser {
  memberId: number
  nickname: string
  profileUrl: string
}

export interface FriendRequestResponse {
  friendshipId: number
  friendId: number
  requestedAt: string
}

// 친구 요청 생성 시 사용
export interface CreateFriendRequest {
  friendId: number
}

// 친구 요청 수락/거절 후 응답
export interface FriendRequestActionResponse {
  friendshipId: number
  friendId: number
  name: string
  nickname: string
  profileUrl: string
  friendshipStatus: FriendshipStatus
  friendStatus: FriendStatus
  requestedAt: string
  respondedAt: string
}
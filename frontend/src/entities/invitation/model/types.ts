// entities/invitation/model/types.ts

/**
 * 초대 상태 열거형
 */
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED"

/**
 * 그룹 초대 엔티티
 */
export interface Invitation {
  invitationId: number
  groupId: number
  memberId: number
  status: InvitationStatus
  createdAt: string
  updatedAt: string
}

/**
 * 초대 링크 생성 응답 타입
 */
export interface InvitationLinkResponse {
  link: string // https://i13d207.p.ssafy.io/invite/abc123 형태
}

/**
 * 초대 링크의 토큰 디코딩 결과
 */
export interface InvitationTokenData {
  groupId: number
  groupName: string
  token: string
}

/**
 * 그룹 초대 요청 (여러 친구 초대)
 */
export interface GroupInviteRequest {
  inviteeIds: number[]
}

/**
 * 그룹 초대 요청 응답
 */
export interface GroupInviteResponse {
  invitationId: number
  groupId: number
  memberId: number
  status: InvitationStatus
  createdAt: string
  updatedAt: string
}

/**
 * API 응답 래퍼 타입
 */
export interface InvitationApiResponse<T = unknown> {
  status: number
  message: string
  data: T
}
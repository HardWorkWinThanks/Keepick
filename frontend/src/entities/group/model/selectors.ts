import type { Group, GroupListItem, GroupMember } from './types'
import { PLACEHOLDERS } from '@/shared/constants/placeholders'

/**
 * 그룹 엔티티 관련 셀렉터 함수들
 */

// 그룹 상태 확인 함수들
export const groupSelectors = {
  // 그룹이 활성화된 상태인지 확인
  isActiveGroup: (group: Group): boolean => {
    return group.memberCount > 0
  },

  // 그룹이 비어있는지 확인
  isEmpty: (group: Group): boolean => {
    return group.memberCount === 0
  },

  // 그룹 생성자인지 확인
  isOwner: (group: Group, userId: number): boolean => {
    return group.createdId === userId
  },

  // 그룹 멤버 수 포맷팅
  formatMemberCount: (count: number): string => {
    return `${count}명`
  },

  // 그룹 생성일 포맷팅
  formatCreatedDate: (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  },

  // 그룹 썸네일 URL 가져오기 (fallback 포함)
  getThumbnailUrl: (group: Group, fallback: string = PLACEHOLDERS.GROUP_THUMBNAIL): string => {
    return group.thumbnailUrl || fallback
  }
}

// 그룹 목록 관련 셀렉터
export const groupListSelectors = {
  // 수락된 그룹만 필터링
  getAcceptedGroups: (groups: GroupListItem[]): GroupListItem[] => {
    return groups.filter(group => group.invitationStatus === "ACCEPTED")
  },

  // 대기 중인 초대 그룹 필터링
  getPendingGroups: (groups: GroupListItem[]): GroupListItem[] => {
    return groups.filter(group => group.invitationStatus === "PENDING")
  },

  // 거절된 그룹 필터링
  getRejectedGroups: (groups: GroupListItem[]): GroupListItem[] => {
    return groups.filter(group => group.invitationStatus === "REJECTED")
  },

  // 그룹을 이름순으로 정렬
  sortByName: (groups: GroupListItem[]): GroupListItem[] => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  },

  // 그룹을 멤버 수순으로 정렬 (내림차순)
  sortByMemberCount: (groups: GroupListItem[]): GroupListItem[] => {
    return [...groups].sort((a, b) => b.memberCount - a.memberCount)
  },

  // 특정 ID의 그룹 찾기
  findById: (groups: GroupListItem[], groupId: number): GroupListItem | undefined => {
    return groups.find(group => group.groupId === groupId)
  }
}

// 그룹 멤버 관련 셀렉터
export const groupMemberSelectors = {
  // 멤버를 이름순으로 정렬
  sortByName: (members: GroupMember[]): GroupMember[] => {
    return [...members].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  },

  // 멤버를 닉네임순으로 정렬
  sortByNickname: (members: GroupMember[]): GroupMember[] => {
    return [...members].sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'))
  },

  // 멤버를 가입일순으로 정렬 (최신순)
  sortByJoinDate: (members: GroupMember[]): GroupMember[] => {
    return [...members].sort((a, b) => 
      new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    )
  },

  // 특정 멤버 ID로 찾기
  findByMemberId: (members: GroupMember[], memberId: number): GroupMember | undefined => {
    return members.find(member => member.memberId === memberId)
  },

  // 멤버 프로필 이미지 가져오기 (fallback 포함)
  getProfileImage: (member: GroupMember, fallback: string = PLACEHOLDERS.USER_PROFILE): string => {
    return member.profileUrl || fallback
  },

  // 멤버 가입일 포맷팅
  formatJoinDate: (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  }
}
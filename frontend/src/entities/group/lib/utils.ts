import type { Group, GroupListItem, GroupMember } from '../model/types'

/**
 * 그룹 관련 유틸리티 함수들
 */

// 그룹 데이터 변환 함수들
export const groupTransformers = {
  // API 응답을 Group 엔티티로 변환
  fromApiResponse: (apiData: any): Group => {
    return {
      groupId: apiData.groupId,
      name: apiData.name,
      description: apiData.description || "",
      thumbnailUrl: apiData.thumbnailUrl || "",
      memberCount: apiData.memberCount,
      createdId: apiData.createdId,
      creatorName: apiData.creatorName,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt
    }
  },

  // Group 엔티티를 API 요청 형태로 변환
  toApiRequest: (group: Partial<Group>): Record<string, any> => {
    const request: Record<string, any> = {}
    
    if (group.name !== undefined) request.name = group.name
    if (group.description !== undefined) request.description = group.description
    if (group.thumbnailUrl !== undefined) request.thumbnailUrl = group.thumbnailUrl
    
    return request
  },

  // GroupListItem을 Group으로 변환 (기본값 포함)
  listItemToGroup: (item: GroupListItem): Partial<Group> => {
    return {
      groupId: item.groupId,
      name: item.name,
      memberCount: item.memberCount,
      // 나머지 필드들은 API에서 가져와야 함
    }
  }
}

// URL 관련 함수들
export const groupUrlUtils = {
  // 그룹 페이지 URL 생성
  getGroupPageUrl: (groupId: number | string): string => {
    return `/group/${groupId}`
  },

  // 그룹 설정 페이지 URL 생성
  getGroupSettingsUrl: (groupId: number | string): string => {
    return `/group/${groupId}/settings`
  },

  // 그룹 멤버 페이지 URL 생성
  getGroupMembersUrl: (groupId: number | string): string => {
    return `/group/${groupId}/members`
  },

  // 그룹 갤러리 페이지 URL 생성
  getGroupGalleryUrl: (groupId: number | string): string => {
    return `/group/${groupId}/gallery`
  }
}

// 그룹 상태 유틸리티
export const groupStatusUtils = {
  // 그룹 상태에 따른 CSS 클래스 반환
  getStatusClass: (status: GroupListItem['invitationStatus']): string => {
    const classes = {
      'ACCEPTED': 'text-green-500 bg-green-50',
      'PENDING': 'text-yellow-500 bg-yellow-50',
      'REJECTED': 'text-red-500 bg-red-50'
    }
    return classes[status] || ''
  },

  // 그룹 상태 한글 변환
  getStatusText: (status: GroupListItem['invitationStatus']): string => {
    const texts = {
      'ACCEPTED': '가입됨',
      'PENDING': '대기 중',
      'REJECTED': '거절됨'
    }
    return texts[status] || status
  },

  // 그룹 가입 가능 여부 확인
  canJoinGroup: (group: Group, currentUserId?: number): boolean => {
    // 이미 그룹 생성자인 경우
    if (currentUserId && group.createdId === currentUserId) {
      return false
    }
    
    // TODO: 그룹 가입 제한 로직 추가 (최대 멤버 수 등)
    return true
  }
}

// 데이터 포맷팅 함수들
export const groupFormatters = {
  // 멤버 수 포맷팅 (한글)
  formatMemberCount: (count: number): string => {
    return `${count.toLocaleString()}명`
  },

  // 날짜 포맷팅 (상대시간)
  formatRelativeTime: (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInDays < 7) return `${diffInDays}일 전`
    
    return date.toLocaleDateString('ko-KR')
  },

  // 그룹 이름 줄이기 (길이 제한)
  truncateGroupName: (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name
    return `${name.substring(0, maxLength)}...`
  },

  // 그룹 설명 줄이기
  truncateDescription: (description: string, maxLength: number = 100): string => {
    if (description.length <= maxLength) return description
    return `${description.substring(0, maxLength)}...`
  }
}

// 검색 및 필터링 함수들
export const groupFilters = {
  // 그룹명으로 검색
  searchByName: (groups: GroupListItem[], query: string): GroupListItem[] => {
    if (!query.trim()) return groups
    
    const lowerQuery = query.toLowerCase()
    return groups.filter(group => 
      group.name.toLowerCase().includes(lowerQuery)
    )
  },

  // 멤버 수로 필터링
  filterByMemberCount: (
    groups: GroupListItem[], 
    minCount?: number, 
    maxCount?: number
  ): GroupListItem[] => {
    return groups.filter(group => {
      if (minCount !== undefined && group.memberCount < minCount) return false
      if (maxCount !== undefined && group.memberCount > maxCount) return false
      return true
    })
  },

  // 초대 상태로 필터링
  filterByStatus: (
    groups: GroupListItem[], 
    status: GroupListItem['invitationStatus']
  ): GroupListItem[] => {
    return groups.filter(group => group.invitationStatus === status)
  }
}
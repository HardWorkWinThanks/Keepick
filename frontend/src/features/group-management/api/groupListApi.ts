'use client'

export interface GroupListItem {
  groupId: number
  name: string
  memberCount: number
  invitationId: number
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

export interface GroupListResponse {
  status: number
  message: string
  data: GroupListItem[]
}

export class GroupListApi {
  private static baseUrl = '/api/groups'

  static async getMyGroups(): Promise<GroupListItem[]> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`그룹 목록 조회 실패: ${response.status}`)
    }

    const result: GroupListResponse = await response.json()
    
    // ACCEPTED 상태인 그룹만 필터링
    return result.data.filter(group => group.invitationStatus === 'ACCEPTED')
  }
}
'use client'

interface CreateGroupRequest {
  name: string
}

interface CreateGroupResponse {
  status: number
  message: string
  data: {
    groupId: number
    name: string
    createdAt: string
  }
}

export class GroupCreateApi {
  private static baseUrl = '/api/groups'

  static async createGroup(data: CreateGroupRequest): Promise<CreateGroupResponse['data']> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`그룹 생성 실패: ${response.status}`)
    }

    const result: CreateGroupResponse = await response.json()
    return result.data
  }
}
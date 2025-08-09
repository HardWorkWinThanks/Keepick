'use client'

interface UpdateGroupRequest {
  name: string
  description: string
  thumbnailUrl: string
}

interface UpdateGroupResponse {
  id: string
  name: string
  description: string
  thumbnailImage: string
  updatedAt: string
}

export class GroupApi {
  private static baseUrl = '/api/groups'

  static async updateGroup(groupId: string, data: UpdateGroupRequest): Promise<UpdateGroupResponse> {
    const response = await fetch(`${this.baseUrl}/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`그룹 수정 실패: ${response.status}`)
    }

    return response.json()
  }
}
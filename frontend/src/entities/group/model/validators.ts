import { z } from "zod"
import type { Group, GroupListItem, GroupMember } from './types'

/**
 * 그룹 관련 Zod 스키마 및 밸리데이션 함수들
 */

// 그룹 생성 요청 스키마
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "그룹 이름을 입력해주세요.")
    .max(50, "그룹 이름은 50자 이하로 입력해주세요.")
    .regex(/^[가-힣a-zA-Z0-9\s\-_]+$/, "그룹 이름에 특수문자는 사용할 수 없습니다.")
})

// 그룹 수정 요청 스키마
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, "그룹 이름을 입력해주세요.")
    .max(50, "그룹 이름은 50자 이하로 입력해주세요.")
    .regex(/^[가-힣a-zA-Z0-9\s\-_]+$/, "그룹 이름에 특수문자는 사용할 수 없습니다."),
  description: z
    .string()
    .max(200, "그룹 설명은 200자 이하로 입력해주세요.")
    .optional(),
  thumbnailUrl: z
    .string()
    .url("올바른 URL 형식이 아닙니다.")
    .optional()
    .or(z.literal(""))
})

// 타입 추론
export type CreateGroupFormData = z.infer<typeof createGroupSchema>
export type UpdateGroupFormData = z.infer<typeof updateGroupSchema>

/**
 * 그룹 데이터 검증 함수들
 */
export const groupValidators = {
  // 그룹 생성 데이터 검증
  validateCreateGroup: (data: unknown) => {
    return createGroupSchema.safeParse(data)
  },

  // 그룹 수정 데이터 검증
  validateUpdateGroup: (data: unknown) => {
    return updateGroupSchema.safeParse(data)
  },

  // 그룹 이름 중복 체크 (클라이언트 사이드)
  isGroupNameDuplicate: (name: string, existingGroups: GroupListItem[]): boolean => {
    return existingGroups.some(group => 
      group.name.toLowerCase() === name.toLowerCase()
    )
  },

  // 그룹 ID 유효성 검증
  isValidGroupId: (groupId: unknown): groupId is number => {
    return typeof groupId === 'number' && groupId > 0
  },

  // 그룹 객체 유효성 검증 (런타임)
  isValidGroup: (obj: unknown): obj is Group => {
    if (!obj || typeof obj !== 'object') return false
    
    const group = obj as any
    return (
      typeof group.groupId === 'number' &&
      typeof group.name === 'string' &&
      typeof group.description === 'string' &&
      typeof group.thumbnailUrl === 'string' &&
      typeof group.memberCount === 'number' &&
      typeof group.createdId === 'number' &&
      typeof group.creatorName === 'string' &&
      typeof group.createdAt === 'string' &&
      typeof group.updatedAt === 'string'
    )
  },

  // 그룹 리스트 아이템 유효성 검증
  isValidGroupListItem: (obj: unknown): obj is GroupListItem => {
    if (!obj || typeof obj !== 'object') return false
    
    const item = obj as any
    return (
      typeof item.groupId === 'number' &&
      typeof item.name === 'string' &&
      typeof item.memberCount === 'number' &&
      typeof item.invitationId === 'number' &&
      ['PENDING', 'ACCEPTED', 'REJECTED'].includes(item.invitationStatus)
    )
  },

  // 그룹 멤버 유효성 검증
  isValidGroupMember: (obj: unknown): obj is GroupMember => {
    if (!obj || typeof obj !== 'object') return false
    
    const member = obj as any
    return (
      typeof member.invitationId === 'number' &&
      typeof member.memberId === 'number' &&
      typeof member.name === 'string' &&
      typeof member.nickname === 'string' &&
      typeof member.email === 'string' &&
      typeof member.profileUrl === 'string' &&
      typeof member.joinedAt === 'string'
    )
  }
}

/**
 * 폼 검증 헬퍼 함수들
 */
export const formValidators = {
  // 실시간 그룹명 검증 (입력하는 동안)
  validateGroupNameRealTime: (
    name: string, 
    existingGroups?: GroupListItem[]
  ): { isValid: boolean; message?: string } => {
    if (!name.trim()) {
      return { isValid: false, message: "그룹 이름을 입력해주세요." }
    }

    if (name.length > 50) {
      return { isValid: false, message: "그룹 이름은 50자 이하로 입력해주세요." }
    }

    if (!/^[가-힣a-zA-Z0-9\s\-_]+$/.test(name)) {
      return { isValid: false, message: "그룹 이름에 특수문자는 사용할 수 없습니다." }
    }

    if (existingGroups && groupValidators.isGroupNameDuplicate(name, existingGroups)) {
      return { isValid: false, message: "이미 존재하는 그룹명입니다." }
    }

    return { isValid: true }
  },

  // 그룹 설명 검증
  validateGroupDescription: (description: string): { isValid: boolean; message?: string } => {
    if (description.length > 200) {
      return { isValid: false, message: "그룹 설명은 200자 이하로 입력해주세요." }
    }

    return { isValid: true }
  }
}
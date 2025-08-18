// shared/lib/invitationUtils.ts

import type { InvitationTokenData } from "@/entities/invitation"

/**
 * 초대 링크에서 토큰을 추출하고 Base64 디코딩하여 JSON 파싱
 * @param inviteLink https://i13d207.p.ssafy.io/invite/abc123 형태의 링크
 * @returns 디코딩된 토큰 데이터 또는 null (실패 시)
 */
export function decodeInvitationToken(inviteLink: string): InvitationTokenData | null {
  try {
    // URL에서 토큰 부분 추출
    const url = new URL(inviteLink)
    const pathSegments = url.pathname.split('/')
    const base64Token = pathSegments[pathSegments.length - 1]
    
    if (!base64Token) {
      console.error('토큰을 찾을 수 없습니다.')
      return null
    }

    // Base64 디코딩
    const jsonString = atob(base64Token)
    
    // JSON 파싱
    const tokenData = JSON.parse(jsonString) as InvitationTokenData
    
    // 필수 필드 검증
    if (!tokenData.groupId || !tokenData.groupName || !tokenData.token) {
      console.error('토큰 데이터가 유효하지 않습니다:', tokenData)
      return null
    }

    return tokenData
  } catch (error) {
    console.error('초대 토큰 디코딩 실패:', error)
    return null
  }
}

/**
 * inviteToken (예: abc123) 단독으로 디코딩
 * @param inviteToken Base64로 인코딩된 토큰 문자열
 * @returns 디코딩된 토큰 데이터 또는 null (실패 시)
 */
export function decodeInviteToken(inviteToken: string): InvitationTokenData | null {
  try {
    // Base64 디코딩
    const jsonString = atob(inviteToken)
    
    // JSON 파싱
    const tokenData = JSON.parse(jsonString) as InvitationTokenData
    
    // 필수 필드 검증
    if (!tokenData.groupId || !tokenData.groupName || !tokenData.token) {
      console.error('토큰 데이터가 유효하지 않습니다:', tokenData)
      return null
    }

    return tokenData
  } catch (error) {
    console.error('초대 토큰 디코딩 실패:', error)
    return null
  }
}

/**
 * 초대 링크 유효성 검사
 * @param inviteLink 검사할 초대 링크
 * @returns 유효한 링크인지 여부
 */
export function isValidInvitationLink(inviteLink: string): boolean {
  try {
    const url = new URL(inviteLink)
    
    // 도메인 검증
    if (url.hostname !== 'i13d207.p.ssafy.io') {
      return false
    }
    
    // 경로 검증 (/invite/토큰 형태)
    const pathPattern = /^\/invite\/[A-Za-z0-9+/=]+$/
    if (!pathPattern.test(url.pathname)) {
      return false
    }
    
    // 토큰 디코딩 가능한지 검증
    const tokenData = decodeInvitationToken(inviteLink)
    return tokenData !== null
    
  } catch (error) {
    return false
  }
}

/**
 * 초대 링크 복사를 위한 헬퍼 함수
 * @param inviteLink 복사할 초대 링크
 * @returns 복사 성공 여부
 */
export async function copyInvitationLink(inviteLink: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(inviteLink)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = inviteLink
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('링크 복사 실패:', error)
    return false
  }
}
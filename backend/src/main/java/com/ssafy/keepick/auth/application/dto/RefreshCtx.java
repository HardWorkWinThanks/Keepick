package com.ssafy.keepick.auth.application.dto;

/**
 * 리프레시 토큰 회전 시 사용되는 컨텍스트 정보
 * 
 * @param memberId        사용자 ID
 * @param username        사용자명
 * @param familyId        패밀리 ID (같은 패밀리의 토큰들을 그룹화)
 * @param oldJti          이전 JWT ID
 * @param newJti          새로운 JWT ID
 * @param newRtExpiresEpochSec  새로운 리프레시 토큰 만료 시간 (초)
 * @param newRtTtlSeconds 새로운 리프레시 토큰 TTL (초)
 */
public record RefreshCtx(
        Long memberId,
        String username,
        String familyId,
        String oldJti,
        String newJti,
        Long newRtExpiresEpochSec,
        int newRtTtlSeconds) {
}

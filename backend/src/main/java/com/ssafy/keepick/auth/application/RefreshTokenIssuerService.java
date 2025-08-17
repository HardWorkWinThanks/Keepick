package com.ssafy.keepick.auth.application;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ssafy.keepick.auth.persistence.RefreshTokenRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenIssuerService {

    private final RefreshTokenRepository repository;

    // 토큰 상태
    private static final String STATUS_ACTIVE = "ACTIVE";
    
    // 패밀리 상태
    private static final String FAMILY_STATUS_REVOKED = "REVOKED";
    private static final String FAMILY_STATUS_COMPROMISED = "COMPROMISED";

    // 기본 TTL (30일)
    private static final Duration DEFAULT_TTL = Duration.ofDays(30);

    /**
     * 리프레시 토큰을 발급합니다.
     * 
     * @param memberId 사용자 ID
     * @param username 사용자명
     * @param familyId 패밀리 ID
     * @return 발급된 JWT ID
     * @throws BaseException 패밀리가 폐기된 상태인 경우
     */
    public String issue(Long memberId, String username, String familyId) {
        // 패밀리 상태 확인
        String familyStatus = repository.getFamilyStatus(familyId);
        if (FAMILY_STATUS_REVOKED.equals(familyStatus) || FAMILY_STATUS_COMPROMISED.equals(familyStatus)) {
            log.warn("폐기/침해된 패밀리에 대한 토큰 발급 시도: memberId={}, familyId={}, status={}", 
                    memberId, familyId, familyStatus);
            throw new BaseException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }
        
        // 새로운 JTI 생성
        String jti = UUID.randomUUID().toString();
        
        // 토큰 만료 시간 계산
        long currentTimeMs = System.currentTimeMillis();
        long expiredSec = java.time.Instant.now().getEpochSecond() + DEFAULT_TTL.getSeconds();
        
        log.info("🔄 리프레시 토큰 발급 시작: memberId={}, username={}, familyId={}", memberId, username, familyId);
        log.info("📝 생성된 JTI: {}", jti);
        log.info("⏰ 발급시간: {} ({}ms)", java.time.Instant.ofEpochMilli(currentTimeMs), currentTimeMs);
        log.info("⏰ 만료시간: {} ({}초)", java.time.Instant.ofEpochSecond(expiredSec), expiredSec);
        log.info("⏰ TTL: {}일", DEFAULT_TTL.toDays());
        
        // 토큰 필드 생성
        Map<String, String> fields = Map.of(
                "member_id", String.valueOf(memberId),
                "username", username,
                "family_id", familyId,
                "status", STATUS_ACTIVE,
                "issued_at_ms", String.valueOf(currentTimeMs),
                "exp_sec", String.valueOf(expiredSec));

        // 토큰 저장
        repository.putToken(jti, fields, DEFAULT_TTL);
        log.info("💾 Redis에 토큰 저장 완료: key=rt:{}", jti);

        // 패밀리 그룹에 토큰 추가
        repository.addToFamily(familyId, jti);
        log.info("👨‍👩‍👧‍👦 패밀리 그룹에 토큰 추가: familyId={}, jti={}", familyId, jti);

        // 사용자별 패밀리 인덱스 추가 (revokeByMember 최적화)
        repository.addMemberFamily(memberId, familyId);
        log.info("👤 사용자별 패밀리 인덱스 추가: memberId={}, familyId={}", memberId, familyId);

        log.info("✅ 리프레시 토큰 발급 완료: jti={}, memberId={}, familyId={}, username={}", jti, memberId, familyId, username);
        return jti;
    }
}

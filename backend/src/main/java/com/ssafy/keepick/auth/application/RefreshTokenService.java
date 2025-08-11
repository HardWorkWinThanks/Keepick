package com.ssafy.keepick.auth.application;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.ssafy.keepick.auth.application.dto.RefreshCtx;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final StringRedisTemplate stringRedisTemplate;

        // Redis 키 접두사
    private static final String RT_KEY_PREFIX = "rt:";
    private static final String FAMILY_KEY_PREFIX = "family:";
    private static final String FAMILY_STATUS_KEY_PREFIX = "family_status:";
    private static final String MEMBER_FAMILIES_KEY_PREFIX = "member:";
    
    // 토큰 상태
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_USED = "USED";
    private static final String STATUS_REVOKED = "REVOKED";
    
    // 패밀리 상태
    private static final String FAMILY_STATUS_COMPROMISED = "COMPROMISED";
    private static final String FAMILY_STATUS_REVOKED = "REVOKED";

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
        String familyStatus = getFamilyStatus(familyId);
        if (FAMILY_STATUS_REVOKED.equals(familyStatus) || FAMILY_STATUS_COMPROMISED.equals(familyStatus)) {
            log.warn("폐기/침해된 패밀리에 대한 토큰 발급 시도: memberId={}, familyId={}, status={}", 
                    memberId, familyId, familyStatus);
            throw new BaseException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }
        
        String jti = UUID.randomUUID().toString();
        String key = RT_KEY_PREFIX + jti;

        long expiredSec = java.time.Instant.now().getEpochSecond() + DEFAULT_TTL.getSeconds();

        Map<String, String> fields = Map.of(
                "member_id", String.valueOf(memberId),
                "username", username,
                "family_id", familyId,
                "status", STATUS_ACTIVE,
                "issued_at_ms", String.valueOf(System.currentTimeMillis()),
                "exp_sec", String.valueOf(expiredSec));

        stringRedisTemplate.opsForHash().putAll(key, fields);
        stringRedisTemplate.expire(key, DEFAULT_TTL);

        // 패밀리 그룹에 토큰 추가
        String familyKey = FAMILY_KEY_PREFIX + familyId;
        stringRedisTemplate.opsForSet().add(familyKey, jti);
        stringRedisTemplate.expire(familyKey, DEFAULT_TTL);

        // 사용자별 패밀리 인덱스 추가 (revokeByMember 최적화)
        String memberFamiliesKey = MEMBER_FAMILIES_KEY_PREFIX + memberId + ":families";
        stringRedisTemplate.opsForSet().add(memberFamiliesKey, familyId);
        stringRedisTemplate.expire(memberFamiliesKey, DEFAULT_TTL);

        log.info("리프레시 토큰 발급 완료: jti={}, memberId={}, familyId={}", jti, memberId, familyId);
        return jti;
    }

    /**
     * 리프레시 토큰을 검증하고 회전시킵니다. (원자적 처리)
     * 
     * @param rtJti 리프레시 토큰 JWT ID
     * @return 토큰 회전 컨텍스트
     * @throws BaseException 토큰이 유효하지 않은 경우
     */
    public RefreshCtx validateAndRotate(String rtJti) {
        String key = RT_KEY_PREFIX + rtJti;

        // WATCH/MULTI/EXEC 패턴을 사용한 원자적 처리
        return validateAndRotateWithWatch(key, rtJti);
    }

    /**
     * WATCH/MULTI/EXEC 패턴을 사용한 토큰 검증 및 회전
     */
    private RefreshCtx validateAndRotateWithWatch(String key, String rtJti) {
        while (true) {
            // WATCH 키
            stringRedisTemplate.watch(key);

            try {
                // 현재 토큰 상태 확인
                Map<Object, Object> tokenData = stringRedisTemplate.opsForHash().entries(key);
                if (tokenData.isEmpty()) {
                    log.warn("리프레시 토큰이 존재하지 않음: jti={}", rtJti);
                    throw new BaseException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
                }

                String status = (String) tokenData.get("status");
                String familyId = (String) tokenData.get("family_id");
                Long memberId = Long.valueOf((String) tokenData.get("member_id"));
                
                if (!STATUS_ACTIVE.equals(status)) {
                    log.warn("리프레시 토큰 재사용/폐기 감지: jti={}, status={}, memberId={}, familyId={}", 
                            rtJti, status, memberId, familyId);
                    if (familyId != null) {
                        stringRedisTemplate.opsForValue()
                            .set(FAMILY_STATUS_KEY_PREFIX + familyId, FAMILY_STATUS_REVOKED, DEFAULT_TTL);
                        // 비동기로 family 전체 폐기 (운영 가시성 향상)
                        revokeByFamily(familyId);
                    }
                    throw new BaseException(ErrorCode.REFRESH_TOKEN_REUSED);
                }

                // 패밀리 상태 확인
                String familyStatus = getFamilyStatus(familyId);
                if (FAMILY_STATUS_REVOKED.equals(familyStatus)) {
                    log.warn("폐기된 패밀리의 리프레시 토큰 사용 시도: jti={}, memberId={}, familyId={}", 
                            rtJti, memberId, familyId);
                    throw new BaseException(ErrorCode.REFRESH_TOKEN_REVOKED);
                }

                // 사용자 정보 추출
                String username = (String) tokenData.get("username");

                // 새로운 JTI 생성
                String newJti = UUID.randomUUID().toString();
                String newKey = RT_KEY_PREFIX + newJti;

                long ttlSeconds = DEFAULT_TTL.getSeconds();
                long expSec = java.time.Instant.now().getEpochSecond() + ttlSeconds;

                // MULTI 시작
                stringRedisTemplate.multi();

                try {
                    // 기존 토큰을 USED로 표시
                    stringRedisTemplate.opsForHash().put(key, "status", STATUS_USED);
                    stringRedisTemplate.opsForHash().put(key, "last_used_at_ms", String.valueOf(System.currentTimeMillis()));

                    // 새 토큰 생성
                    Map<String, String> newTokenFields = Map.of(
                            "member_id", String.valueOf(memberId),
                            "username", username,
                            "family_id", familyId,
                            "status", STATUS_ACTIVE,
                            "issued_at_ms", String.valueOf(System.currentTimeMillis()),
                            "exp_sec", String.valueOf(expSec));
                    stringRedisTemplate.opsForHash().putAll(newKey, newTokenFields);
                    stringRedisTemplate.expire(newKey, DEFAULT_TTL);

                    // 패밀리 그룹 관리: 새 토큰 추가, 기존 토큰 제거
                    String familyKey = FAMILY_KEY_PREFIX + familyId;
                    stringRedisTemplate.opsForSet().add(familyKey, newJti);
                    stringRedisTemplate.opsForSet().remove(familyKey, rtJti);
                    stringRedisTemplate.expire(familyKey, DEFAULT_TTL);

                    // EXEC 실행
                    List<Object> results = stringRedisTemplate.exec();

                    if (results != null && !results.isEmpty()) {
                        log.info("리프레시 토큰 회전 성공: oldJti={}, newJti={}, memberId={}, familyId={}, expSec={}, ttlSeconds={}",
                                rtJti, newJti, memberId, familyId, expSec, ttlSeconds);

                        return new RefreshCtx(memberId, username, familyId, rtJti, newJti, expSec, (int) ttlSeconds);
                    }

                } catch (Exception e) {
                    stringRedisTemplate.discard();
                    throw e;
                }

            } catch (BaseException e) {
                stringRedisTemplate.discard();
                throw e;
            } finally {
                stringRedisTemplate.unwatch();
            }

            // 경쟁 조건이 발생한 경우 재시도
            log.debug("토큰 회전 중 경쟁 조건 발생, 재시도: jti={}", rtJti);
        }
    }

    /**
     * 리프레시 토큰을 사용됨으로 표시합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     */
    public void markUsed(String jti) {
        String key = RT_KEY_PREFIX + jti;
        stringRedisTemplate.opsForHash().put(key, "status", STATUS_USED);
        stringRedisTemplate.opsForHash().put(key, "last_used_at_ms", String.valueOf(System.currentTimeMillis()));

        log.debug("리프레시 토큰 사용 표시: jti={}", jti);
    }

    /**
     * 리프레시 토큰을 통해 해당 패밀리의 모든 토큰을 폐기합니다.
     * 
     * @param rtJti 리프레시 토큰 JWT ID
     */
    public void revokeByRt(String rtJti) {
        String key = RT_KEY_PREFIX + rtJti;
        Map<Object, Object> tokenData = stringRedisTemplate.opsForHash().entries(key);

        if (tokenData.isEmpty()) {
            log.warn("폐기할 리프레시 토큰이 존재하지 않음: jti={}", rtJti);
            return;
        }

        String familyId = (String) tokenData.get("family_id");
        if (familyId == null) {
            log.warn("패밀리 ID가 없는 토큰: jti={}", rtJti);
            return;
        }

        // 패밀리 상태를 REVOKED로 설정
        stringRedisTemplate.opsForValue().set(FAMILY_STATUS_KEY_PREFIX + familyId, FAMILY_STATUS_REVOKED, DEFAULT_TTL);

        // 패밀리 그룹의 모든 토큰을 안전하게 REVOKED로 표시
        String familyKey = FAMILY_KEY_PREFIX + familyId;
        Set<String> familyTokens = stringRedisTemplate.opsForSet().members(familyKey);

        int revokedCount = 0;
        if (familyTokens != null) {
            for (String jti : familyTokens) {
                String tokenKey = RT_KEY_PREFIX + jti;
                // EXISTS 체크로 만료된 키 부활 방지
                if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(tokenKey))) {
                    stringRedisTemplate.opsForHash().put(tokenKey, "status", STATUS_REVOKED);
                    stringRedisTemplate.opsForHash().put(tokenKey, "revoked_at_ms",
                            String.valueOf(System.currentTimeMillis()));
                    revokedCount++;
                }
            }
        }

        // 패밀리 그룹 삭제
        stringRedisTemplate.delete(familyKey);

        log.info("패밀리 토큰 폐기 완료: familyId={}, totalTokens={}, revokedTokens={}", 
                familyId, familyTokens != null ? familyTokens.size() : 0, revokedCount);
    }

    /**
     * 특정 사용자의 모든 리프레시 토큰을 폐기합니다.
     * 
     * @param memberId 사용자 ID
     */
    public void revokeByMember(Long memberId) {
        // 사용자별 패밀리 인덱스를 통해 효율적으로 폐기
        String memberFamiliesKey = MEMBER_FAMILIES_KEY_PREFIX + memberId + ":families";
        Set<String> families = stringRedisTemplate.opsForSet().members(memberFamiliesKey);
        
        int revokedFamilies = 0;
        if (families != null) {
            for (String familyId : families) {
                revokeByFamily(familyId);
                revokedFamilies++;
            }
        }
        
        // 사용자별 패밀리 인덱스 삭제
        stringRedisTemplate.delete(memberFamiliesKey);

        log.info("사용자 토큰 폐기 완료: memberId={}, revokedFamilies={}", memberId, revokedFamilies);
    }

    /**
     * 특정 패밀리의 모든 토큰을 폐기합니다.
     * 
     * @param familyId 패밀리 ID
     */
    public void revokeByFamily(String familyId) {
        // 패밀리 상태를 REVOKED로 설정
        stringRedisTemplate.opsForValue().set(FAMILY_STATUS_KEY_PREFIX + familyId, FAMILY_STATUS_REVOKED, DEFAULT_TTL);

        // 패밀리 그룹의 모든 토큰을 안전하게 REVOKED로 표시
        String familyKey = FAMILY_KEY_PREFIX + familyId;
        Set<String> familyTokens = stringRedisTemplate.opsForSet().members(familyKey);

        int revokedCount = 0;
        if (familyTokens != null) {
            for (String jti : familyTokens) {
                String tokenKey = RT_KEY_PREFIX + jti;
                // EXISTS 체크로 만료된 키 부활 방지
                if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(tokenKey))) {
                    stringRedisTemplate.opsForHash().put(tokenKey, "status", STATUS_REVOKED);
                    stringRedisTemplate.opsForHash().put(tokenKey, "revoked_at_ms",
                            String.valueOf(System.currentTimeMillis()));
                    revokedCount++;
                }
            }
        }

        // 패밀리 그룹 삭제
        stringRedisTemplate.delete(familyKey);

        log.info("패밀리 토큰 폐기 완료: familyId={}, totalTokens={}, revokedTokens={}", 
                familyId, familyTokens != null ? familyTokens.size() : 0, revokedCount);
    }

    /**
     * 패밀리 상태를 확인합니다.
     * 
     * @param familyId 패밀리 ID
     * @return 패밀리 상태 (COMPROMISED, REVOKED, null=정상)
     */
    public String getFamilyStatus(String familyId) {
        return stringRedisTemplate.opsForValue().get(FAMILY_STATUS_KEY_PREFIX + familyId);
    }

    /**
     * 패밀리가 정상 상태인지 확인합니다.
     * 
     * @param familyId 패밀리 ID
     * @return 정상 상태 여부
     */
    public boolean isFamilyHealthy(String familyId) {
        String status = getFamilyStatus(familyId);
        return status == null; // 상태가 없으면 정상
    }

    /**
     * 리프레시 토큰이 존재하는지 확인합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @return 토큰 존재 여부
     */
    public boolean exists(String jti) {
        String key = RT_KEY_PREFIX + jti;
        Boolean hasKey = stringRedisTemplate.hasKey(key);

        log.debug("리프레시 토큰 존재 확인: jti={}, exists={}", jti, hasKey);
        return Boolean.TRUE.equals(hasKey);
    }

    /**
     * 리프레시 토큰을 삭제합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     */
    public void delete(String jti) {
        String key = RT_KEY_PREFIX + jti;
        
        // 토큰 정보 조회 (패밀리 ID 추출용)
        Map<Object, Object> tokenData = stringRedisTemplate.opsForHash().entries(key);
        String familyId = null;
        if (!tokenData.isEmpty()) {
            familyId = (String) tokenData.get("family_id");
        }
        
        // 토큰 삭제
        Boolean deleted = stringRedisTemplate.delete(key);
        
        // 패밀리 세트에서도 제거 (잔여 참조 방지)
        if (familyId != null && Boolean.TRUE.equals(deleted)) {
            String familyKey = FAMILY_KEY_PREFIX + familyId;
            stringRedisTemplate.opsForSet().remove(familyKey, jti);
            
            // 패밀리 세트가 비어있으면 삭제
            Long size = stringRedisTemplate.opsForSet().size(familyKey);
            if (size != null && size == 0) {
                stringRedisTemplate.delete(familyKey);
            }
        }

        log.debug("리프레시 토큰 삭제: jti={}, deleted={}, familyId={}", jti, deleted, familyId);
    }

    /**
     * 리프레시 토큰 정보를 조회합니다.
     * 
     * @param jti JWT ID (토큰 식별자)
     * @return 토큰 정보 맵
     */
    public Map<Object, Object> get(String jti) {
        String key = RT_KEY_PREFIX + jti;
        Map<Object, Object> entries = stringRedisTemplate.opsForHash().entries(key);

        log.debug("리프레시 토큰 조회: jti={}, exists={}", jti, !entries.isEmpty());
        return entries;
    }
}

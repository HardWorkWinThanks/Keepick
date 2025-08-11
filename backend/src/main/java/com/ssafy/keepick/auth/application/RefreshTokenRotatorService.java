package com.ssafy.keepick.auth.application;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import com.ssafy.keepick.auth.application.dto.RefreshCtx;
import com.ssafy.keepick.auth.persistence.RefreshTokenRepository;
import com.ssafy.keepick.global.exception.BaseException;
import com.ssafy.keepick.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenRotatorService {

    private final RefreshTokenRepository repository;
    private final StringRedisTemplate stringRedisTemplate;

    // 토큰 상태
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_USED = "USED";
    private static final String STATUS_REVOKED = "REVOKED";
    
    // 패밀리 상태
    private static final String FAMILY_STATUS_REVOKED = "REVOKED";
    private static final String FAMILY_STATUS_COMPROMISED = "COMPROMISED";

    // 기본 TTL (30일)
    private static final Duration DEFAULT_TTL = Duration.ofDays(30);

    // Lua 스크립트: 토큰 회전을 원자적으로 처리
    private static final String ROTATE_TOKEN_SCRIPT = """
            -- KEYS[1]: 토큰 키 (rt:jti)
            -- KEYS[2]: 패밀리 키 (family:familyId)
            -- KEYS[3]: 새 토큰 키 (rt:newJti)
            -- ARGV[1]: 새 JTI
            -- ARGV[2]: member_id
            -- ARGV[3]: username
            -- ARGV[4]: family_id
            -- ARGV[5]: 현재 시간 (밀리초)
            -- ARGV[6]: 만료 시간 (초)
            -- ARGV[7]: TTL (초)
            
            -- 기존 토큰 존재 확인
            if redis.call('EXISTS', KEYS[1]) == 0 then
                return {err = 'TOKEN_NOT_FOUND'}
            end
            
            -- 토큰 상태 확인
            local status = redis.call('HGET', KEYS[1], 'status')
            if status ~= 'ACTIVE' then
                return {err = 'TOKEN_REUSED', status = status}
            end
            
            -- 패밀리 상태 확인
            local familyStatusKey = 'family_status:' .. ARGV[4]
            local familyStatus = redis.call('GET', familyStatusKey)
            if familyStatus == 'REVOKED' or familyStatus == 'COMPROMISED' then
                return {err = 'FAMILY_REVOKED', status = familyStatus}
            end
            
            -- 기존 토큰을 USED로 표시
            redis.call('HSET', KEYS[1], 'status', 'USED')
            redis.call('HSET', KEYS[1], 'last_used_at_ms', ARGV[5])
            
            -- 새 토큰 생성
            redis.call('HSET', KEYS[3], 'member_id', ARGV[2])
            redis.call('HSET', KEYS[3], 'username', ARGV[3])
            redis.call('HSET', KEYS[3], 'family_id', ARGV[4])
            redis.call('HSET', KEYS[3], 'status', 'ACTIVE')
            redis.call('HSET', KEYS[3], 'issued_at_ms', ARGV[5])
            redis.call('HSET', KEYS[3], 'exp_sec', ARGV[6])
            redis.call('EXPIRE', KEYS[3], ARGV[7])
            
            -- 패밀리 그룹 관리: 새 토큰 추가, 기존 토큰 제거
            redis.call('SADD', KEYS[2], ARGV[1])
            redis.call('SREM', KEYS[2], redis.call('HGET', KEYS[1], 'jti'))
            redis.call('EXPIRE', KEYS[2], ARGV[7])
            
            return {ok = 'SUCCESS', member_id = ARGV[2], username = ARGV[3], family_id = ARGV[4], exp_sec = ARGV[6], ttl_seconds = ARGV[7]}
            """;

    /**
     * 리프레시 토큰을 검증하고 회전시킵니다.
     * 
     * @param rtJti 리프레시 토큰 JWT ID
     * @return 토큰 회전 컨텍스트
     * @throws BaseException 토큰이 유효하지 않은 경우
     */
    public RefreshCtx rotate(String rtJti) {
        // 기존 토큰 정보 조회
        Map<Object, Object> tokenData = repository.getToken(rtJti);
        if (tokenData.isEmpty()) {
            log.warn("리프레시 토큰이 존재하지 않음: jti={}", rtJti);
            throw new BaseException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }

        String familyId = (String) tokenData.get("family_id");
        Long memberId = Long.valueOf((String) tokenData.get("member_id"));
        String username = (String) tokenData.get("username");

        // 패밀리 상태 확인
        String familyStatus = repository.getFamilyStatus(familyId);
        if (FAMILY_STATUS_REVOKED.equals(familyStatus) || FAMILY_STATUS_COMPROMISED.equals(familyStatus)) {
            log.warn("폐기/침해된 패밀리의 리프레시 토큰 사용 시도: jti={}, memberId={}, familyId={}, status={}", 
                    rtJti, memberId, familyId, familyStatus);
            throw new BaseException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        // 새로운 JTI 생성
        String newJti = UUID.randomUUID().toString();
        
        // Lua 스크립트 실행을 위한 키와 인자 준비
        String tokenKey = repository.getTokenKey(rtJti);
        String familyKey = repository.getFamilyKey(familyId);
        String newTokenKey = repository.getTokenKey(newJti);
        
        long currentTimeMs = System.currentTimeMillis();
        long expSec = java.time.Instant.now().getEpochSecond() + DEFAULT_TTL.getSeconds();
        long ttlSeconds = DEFAULT_TTL.getSeconds();

        List<String> keys = List.of(tokenKey, familyKey, newTokenKey);
        List<String> args = List.of(
                newJti,
                String.valueOf(memberId),
                username,
                familyId,
                String.valueOf(currentTimeMs),
                String.valueOf(expSec),
                String.valueOf(ttlSeconds)
        );

        try {
            // Lua 스크립트 실행
            Object result = stringRedisTemplate.execute(
                    RedisScript.of(ROTATE_TOKEN_SCRIPT, Object.class),
                    keys,
                    args.toArray()
            );

            if (result instanceof List<?> resultList && !resultList.isEmpty()) {
                Object firstResult = resultList.get(0);
                
                if ("err".equals(firstResult)) {
                    String errorType = (String) resultList.get(1);
                    handleRotationError(errorType, rtJti, memberId, familyId, resultList);
                } else if ("ok".equals(firstResult)) {
                    log.info("리프레시 토큰 회전 성공: oldJti={}, newJti={}, memberId={}, familyId={}, expSec={}, ttlSeconds={}",
                            rtJti, newJti, memberId, familyId, expSec, ttlSeconds);
                    
                    return new RefreshCtx(memberId, username, familyId, rtJti, newJti, expSec, (int) ttlSeconds);
                }
            }

            // 예상치 못한 결과
            log.error("토큰 회전 중 예상치 못한 결과: jti={}, result={}", rtJti, result);
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);

        } catch (Exception e) {
            log.error("토큰 회전 중 오류 발생: jti={}", rtJti, e);
            throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 회전 오류를 처리합니다.
     */
    private void handleRotationError(String errorType, String rtJti, Long memberId, String familyId, List<?> resultList) {
        switch (errorType) {
            case "TOKEN_NOT_FOUND":
                log.warn("리프레시 토큰이 존재하지 않음: jti={}", rtJti);
                throw new BaseException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
                
            case "TOKEN_REUSED":
                String status = (String) resultList.get(2);
                log.warn("리프레시 토큰 재사용/폐기 감지: jti={}, status={}, memberId={}, familyId={}", 
                        rtJti, status, memberId, familyId);
                
                // 패밀리 상태를 REVOKED로 설정
                if (familyId != null) {
                    repository.setFamilyStatus(familyId, FAMILY_STATUS_REVOKED);
                }
                throw new BaseException(ErrorCode.REFRESH_TOKEN_REUSED);
                
            case "FAMILY_REVOKED":
                String familyStatus = (String) resultList.get(2);
                log.warn("폐기된 패밀리의 리프레시 토큰 사용 시도: jti={}, memberId={}, familyId={}, status={}", 
                        rtJti, memberId, familyId, familyStatus);
                throw new BaseException(ErrorCode.REFRESH_TOKEN_REVOKED);
                
            default:
                log.error("알 수 없는 회전 오류: jti={}, errorType={}", rtJti, errorType);
                throw new BaseException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
